#!/usr/bin/env node
/**
 * Checks that the C4 container map matches the source.
 *
 * `docs/architecture/c4-containers.md` draws an arrow for every dependency
 * between workspace projects. This script derives the same dependencies from
 * the code and fails when the two differ, in either direction, so the map
 * cannot go stale without CI noticing.
 *
 * A dependency is any of:
 *   - a TypeScript import that lands in another project, through a
 *     `tsconfig.base.json` path alias or a relative path;
 *   - a CSS `@import` or `@source` whose relative path lands in another project;
 *   - an entry in a project's `implicitDependencies`.
 *
 * It compares the map with the code. It does not forbid any dependency.
 *
 *   node scripts/check-architecture.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAP = 'docs/architecture/c4-containers.md';
const SKIP = new Set([
  'node_modules',
  'dist',
  'coverage',
  'tmp',
  'test-output',
  '_site',
]);

const posix = (path) => path.split(sep).join('/');
// Dot-directories include .claude/worktrees, which hold whole copies of the repo.
const skipped = (entry) => entry.name.startsWith('.') || SKIP.has(entry.name);

/** Every directory that holds a project.json. */
function findProjects(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || skipped(entry)) continue;
    const path = join(dir, entry.name);
    const config = join(path, 'project.json');
    if (existsSync(config)) {
      const { name, implicitDependencies = [] } = JSON.parse(
        readFileSync(config, 'utf8'),
      );
      found.push({ name, dir: path, implicit: implicitDependencies });
    }
    findProjects(path, found);
  }
  return found;
}

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipped(entry)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(?:[cm]?ts|css)$/.test(entry.name)) yield path;
  }
}

const projects = findProjects(root);
const owner = (file) =>
  projects.find((p) => file === p.dir || file.startsWith(p.dir + sep));

const tsconfig = JSON.parse(
  readFileSync(join(root, 'tsconfig.base.json'), 'utf8'),
);
const aliases = Object.entries(tsconfig.compilerOptions?.paths ?? {}).map(
  ([alias, [target]]) => [alias, resolve(root, target)],
);

function targetProject(spec, fromFile) {
  if (spec.startsWith('.')) return owner(resolve(dirname(fromFile), spec));
  for (const [alias, target] of aliases) {
    if (spec === alias || spec.startsWith(`${alias}/`)) return owner(target);
  }
  return undefined;
}

const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// `from 'x'`, `import('x')` and `import 'x'`.
const TS_REFERENCE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\1/g;
// `@import 'x'` and `@source 'x'`.
const CSS_REFERENCE = /@(?:import|source)\s+(?:url\(\s*)?(['"])([^'"\n]+)\1/g;

/** "from -> to" mapped to the first place the dependency was found. */
const found = new Map();

function addEdge(from, to, evidence) {
  if (!from || !to || from.name === to.name) return;
  const key = `${from.name} -> ${to.name}`;
  if (!found.has(key)) found.set(key, evidence);
}

for (const project of projects) {
  for (const file of sourceFiles(project.dir)) {
    const text = stripComments(readFileSync(file, 'utf8'));
    const pattern = file.endsWith('.css') ? CSS_REFERENCE : TS_REFERENCE;
    for (const match of text.matchAll(pattern)) {
      addEdge(
        project,
        targetProject(match[2], file),
        `${posix(relative(root, file))} references '${match[2]}'`,
      );
    }
  }
  for (const name of project.implicit) {
    addEdge(
      project,
      projects.find((p) => p.name === name),
      `${posix(relative(root, join(project.dir, 'project.json')))} lists it in implicitDependencies`,
    );
  }
}

// -- the map ---------------------------------------------------------------

const doc = readFileSync(join(root, MAP), 'utf8');
// The first Mermaid block that is a container diagram; an init directive may
// precede the diagram type.
const diagram =
  [...doc.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((body) => /^\s*C4Container\b/m.test(body)) ?? '';

/** Diagram id -> project name (the container's label). */
const containers = new Map();
for (const m of diagram.matchAll(
  /^\s*Container(?:Db)?(?:_Ext)?\(\s*(\w+)\s*,\s*"([^"]+)"/gm,
)) {
  containers.set(m[1], m[2]);
}

const drawn = new Set();
for (const m of diagram.matchAll(
  /^\s*Rel(?:_[UDLR])?\(\s*(\w+)\s*,\s*(\w+)\s*,/gm,
)) {
  const from = containers.get(m[1]);
  const to = containers.get(m[2]);
  if (from && to) drawn.add(`${from} -> ${to}`);
}

// -- compare ---------------------------------------------------------------

const problems = [];
const names = new Set(projects.map((p) => p.name).filter(Boolean));
const labels = new Set(containers.values());

// A parser that silently finds nothing would pass every check.
if (
  names.size === 0 ||
  labels.size === 0 ||
  found.size === 0 ||
  drawn.size === 0
) {
  problems.push(
    `found ${names.size} projects, ${labels.size} containers, ${found.size} dependencies in the code and ${drawn.size} on the map - the check itself is probably out of date`,
  );
}
for (const label of labels) {
  if (!names.has(label)) {
    problems.push(`the map draws "${label}", which is not a workspace project`);
  }
}
for (const name of names) {
  if (!labels.has(name))
    problems.push(`project "${name}" is missing from the map`);
}
for (const [edge, evidence] of found) {
  if (!drawn.has(edge)) {
    problems.push(`in the code but not on the map: ${edge}  (${evidence})`);
  }
}
for (const edge of drawn) {
  if (!found.has(edge))
    problems.push(`on the map but not in the code: ${edge}`);
}

if (problems.length > 0) {
  console.error(
    `\n${MAP} and the source disagree:\n${problems.map((p) => `  - ${p}`).join('\n')}\n\nUpdate the Container and Rel lines in ${MAP} in the same change.`,
  );
  process.exit(1);
}

console.log(
  `The map matches the code: ${names.size} containers, ${found.size} dependencies.`,
);
