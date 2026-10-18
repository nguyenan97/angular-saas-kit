#!/usr/bin/env node
/**
 * Checks that the instructions agents and people read are still true.
 *
 * The docs site's build catches a dead link inside `docs/`, but nothing read
 * `AGENTS.md`, `CONTRIBUTING.md`, the skills or the library READMEs, and none of
 * them checked that a command they name still exists. A skill that tells an
 * agent to run a script that was renamed fails silently: the agent improvises.
 *
 * - **Links**: every relative Markdown link (inline or a reference definition)
 *   resolves to a file or folder with exactly that spelling, and none starts
 *   with `/` (on GitHub that is the repository root).
 * - **Commands**: every `npm run <script>` names a script in `package.json`, and
 *   every `nx <target> <project>` in code an Nx project that exists.
 * - **ADRs**: every record in `docs/adr` has a row in its index with the same
 *   status, and its heading carries its number.
 * - **Skills**: every `.claude/skills/<name>/SKILL.md` has Agent Skills
 *   frontmatter (https://agentskills.io/specification): a `name` that matches
 *   its folder, a `description`, no other field; and `## When to use`,
 *   `## When not to use` and `## Done when` sections.
 *   `CLAUDE.md`, `docs/guide/development-process.md` and the skills README name
 *   every skill.
 *
 * `docs/superpowers` is working material and is not checked.
 *
 *   node scripts/check-docs.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const posix = (path) => path.split(sep).join('/');
const SKIP = new Set([
  'node_modules',
  'dist',
  'coverage',
  'test-output',
  'tmp',
]);

/** The Markdown files that are read as instructions or published as docs. */
export function markdownFiles(root) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const path = join(dir, entry.name);
      const rel = posix(relative(root, path));
      if (entry.isDirectory()) {
        if (
          entry.name.startsWith('.') &&
          rel !== '.claude' &&
          rel !== '.github'
        )
          continue;
        if (rel === 'docs/superpowers' || rel === '.claude/worktrees') continue;
        walk(path);
      } else if (entry.name.endsWith('.md')) files.push(path);
    }
  };
  walk(root);
  return files.sort();
}

const blank = (part) => part.replace(/[^\n]/g, ' ');

// A fence may be indented (inside a list item) and longer than three marks;
// it closes with the same marks.
const FENCE = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm;
const INLINE_CODE = /`[^`\n]*`/g;

/** Markdown with comments, fenced and inline code blanked out, lines kept. */
function prose(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(FENCE, blank)
    .replace(INLINE_CODE, blank);
}

/** The opposite: only the code, fenced and inline, with the rest blanked. */
function code(text) {
  const kept = blank(text).split('');
  for (const pattern of [FENCE, INLINE_CODE])
    for (const match of text.matchAll(pattern))
      for (let i = 0; i < match[0].length; i++)
        kept[match.index + i] = match[0][i];
  return kept.join('');
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * Whether a relative path exists with exactly this spelling. Windows and macOS
 * ignore letter case and Linux does not, so a link to `Theming.md` that works
 * locally is dead in CI and on the site.
 */
function existsExactly(from, path) {
  let dir = from;
  for (const part of path.split(/[\\/]/)) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      dir = dirname(dir);
      continue;
    }
    if (!readdirSync(dir).includes(part)) return false;
    dir = join(dir, part);
  }
  return true;
}

// [text](target), [text](<target with spaces>), [text](target "title") or
// 'title', with one level of parentheses allowed inside the target.
const INLINE_LINK =
  /\]\(\s*(?:<([^>\n]+)>|((?:[^()\s]|\([^()\s]*\))+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
// [label]: target, a reference definition.
const REFERENCE = /^ {0,3}\[[^\]\n]+\]:[ \t]*<?([^\s>]+)>?/gm;

export function checkLinks(root, file, text) {
  const problems = [];
  const body = prose(text);
  const links = [
    ...[...body.matchAll(INLINE_LINK)].map((m) => [m[1] ?? m[2], m.index]),
    ...[...body.matchAll(REFERENCE)].map((m) => [m[1], m.index]),
  ];
  for (const [href, index] of links) {
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href)) continue;
    const where = `${posix(relative(root, file))}:${lineOf(text, index)}`;
    if (href.startsWith('/')) {
      problems.push(
        `${where}: "${href}" starts with "/", which is the repository root on GitHub; make it relative`,
      );
      continue;
    }
    let path;
    try {
      path = decodeURIComponent(href.split(/[#?]/)[0]);
    } catch {
      problems.push(`${where}: "${href}" is not a valid URL`);
      continue;
    }
    if (!existsSync(resolve(dirname(file), path)))
      problems.push(`${where}: "${href}" does not exist`);
    else if (!existsExactly(dirname(file), path))
      problems.push(
        `${where}: "${href}" exists only in another letter case, which Linux does not find`,
      );
  }
  return problems;
}

/** Nx project names, from every project.json outside node_modules. */
export function nxProjects(root) {
  const names = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === 'project.json')
        names.add(JSON.parse(readFileSync(path, 'utf8')).name);
    }
  };
  for (const top of ['apps', 'libs'])
    if (existsSync(join(root, top))) walk(join(root, top));
  return names;
}

// Nx subcommands that do not take a project as their first argument.
const NX_COMMANDS =
  'run-many|affected|show|graph|run|reset|g|generate|release|migrate|report|list|daemon|watch|sync|connect|exec|init|add';

export function checkCommands(root, file, text, scripts, projects) {
  const problems = [];
  const where = (index) =>
    `${posix(relative(root, file))}:${lineOf(text, index)}`;
  for (const match of text.matchAll(/\bnpm run ([\w:.-]+)/g))
    if (!scripts.has(match[1]))
      problems.push(
        `${where(match.index)}: "npm run ${match[1]}" is not a script in package.json`,
      );
  // `nx test ui`, `npx nx build dashboard --verbose`. Only in code, so prose
  // ("nx to the rescue") is not read as a command.
  const nx = new RegExp(
    `\\bnx (?!(?:${NX_COMMANDS})\\b)([a-z][\\w-]*) ([a-z][\\w-]*)`,
    'g',
  );
  for (const match of code(text).matchAll(nx))
    if (!projects.has(match[2]))
      problems.push(
        `${where(match.index)}: "nx ${match[1]} ${match[2]}" names no Nx project`,
      );
  return problems;
}

const status = (text) =>
  /^- \*\*Status:\*\*\s*([A-Za-z]+)/m.exec(text)?.[1] ?? null;

export function checkAdrs(root) {
  const dir = join(root, 'docs', 'adr');
  if (!existsSync(dir)) return [];
  if (!existsSync(join(dir, 'README.md')))
    return ['docs/adr/README.md: missing; it is the index of the records'];
  const problems = [];
  const index = readFileSync(join(dir, 'README.md'), 'utf8');
  for (const name of readdirSync(dir).filter((n) => /^\d{4}-.+\.md$/.test(n))) {
    const number = name.slice(0, 4);
    const text = readFileSync(join(dir, name), 'utf8');
    if (!new RegExp(`^# ${number}\\. `, 'm').test(text))
      problems.push(
        `docs/adr/${name}: its first heading is not "# ${number}. Title"`,
      );
    // The record's own row: its link is in the first cell. A later cell may
    // link to it too ("Superseded by [0025](...)").
    const row = index
      .split('\n')
      .find((line) => line.split('|')[1]?.includes(`](${name})`));
    if (!row) {
      problems.push(`docs/adr/README.md: no index row for ${name}`);
      continue;
    }
    const own = status(text);
    const listed = row.split('|').at(-2)?.trim().split(/\s+/)[0];
    if (own !== listed)
      problems.push(
        `docs/adr/README.md: ${name} is "${own}" in the record and "${listed}" in the index`,
      );
  }
  return problems;
}

const FRONTMATTER_FIELDS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

/** Top-level YAML keys and their values; a `>` or `|` value takes the indented lines under it. */
function frontmatter(front) {
  const fields = new Map();
  let last;
  for (const line of front.split(/\r?\n/)) {
    const key = /^([a-z][\w-]*):\s*(.*)$/.exec(line);
    if (key) {
      last = key[1];
      fields.set(last, /^[>|][-+]?$/.test(key[2]) ? '' : key[2]);
    } else if (last && /^\s+\S/.test(line))
      fields.set(last, `${fields.get(last)} ${line.trim()}`.trim());
  }
  return fields;
}

export function checkSkills(root) {
  const dir = join(root, '.claude', 'skills');
  if (!existsSync(dir)) return [];
  const problems = [];
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const name of names) {
    const where = `.claude/skills/${name}/SKILL.md`;
    const path = join(dir, name, 'SKILL.md');
    if (!existsSync(path)) {
      problems.push(`${where}: missing`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1];
    if (!front) {
      problems.push(`${where}: no frontmatter`);
      continue;
    }
    const fields = frontmatter(front);
    for (const field of fields.keys())
      if (!FRONTMATTER_FIELDS.has(field))
        problems.push(
          `${where}: "${field}" is not an Agent Skills frontmatter field`,
        );
    const skillName = fields.get('name');
    if (skillName !== name)
      problems.push(`${where}: name "${skillName}" does not match its folder`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)
      problems.push(`${where}: "${name}" is not a valid skill name`);
    const description = fields.get('description') ?? '';
    if (description.length === 0 || description.length > 1024)
      problems.push(`${where}: description must be 1 to 1024 characters`);
    if (!/^## Done when$/m.test(text))
      problems.push(`${where}: no "## Done when" section`);
    for (const section of ['When to use', 'When not to use'])
      if (!new RegExp(`^## ${section}$`, 'm').test(text))
        problems.push(`${where}: no "## ${section}" section`);
  }
  for (const list of [
    'CLAUDE.md',
    'docs/guide/development-process.md',
    '.claude/skills/README.md',
  ]) {
    const path = join(root, list);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const name of names)
      if (!text.includes(`\`${name}\``))
        problems.push(`${list}: does not name the "${name}" skill`);
  }
  return problems;
}

export function check(root) {
  const scripts = new Set(
    Object.keys(
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts ??
        {},
    ),
  );
  const projects = nxProjects(root);
  const files = markdownFiles(root);
  const problems = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    problems.push(...checkLinks(root, file, text));
    problems.push(...checkCommands(root, file, text, scripts, projects));
  }
  problems.push(...checkAdrs(root), ...checkSkills(root));
  return { files: files.length, problems };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const { files, problems } = check(root);
  if (problems.length) {
    console.error(
      `${problems.length} problem(s) in the docs and instructions:\n`,
    );
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(
    `The docs and instructions hold: ${files} Markdown files, their links, commands, ADRs and skills.`,
  );
}
