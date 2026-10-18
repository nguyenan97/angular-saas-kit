/**
 * The projects table in `docs/reference/workspace.md` against the workspace.
 *
 * The table lists each project's tags and what it depends on. Nothing checked
 * it, and its dependency column went stale (fixed by hand in #84).
 * `check-architecture.mjs` calls this with the projects and the dependencies it
 * has already derived from the code, so the table and the C4 map are held to
 * the same truth.
 */

export const TABLE = 'docs/reference/workspace.md';

/** The backticked names in a cell; "none" and prose are ignored. */
const names = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** Rows of the first table whose header starts with "Project": name -> {tags, deps}. */
export function readTable(markdown) {
  const rows = new Map();
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => /^\|\s*Project\s*\|/.test(line));
  if (start === -1) return rows;
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const [, project = '', tags = '', deps = ''] = line.split('|');
    const [name] = names(project);
    if (name) rows.set(name, { tags: names(tags), deps: names(deps) });
  }
  return rows;
}

const same = (a, b) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * @param {string} markdown the table's page
 * @param {{name: string, tags: string[]}[]} projects every workspace project
 * @param {Iterable<string>} edges "from -> to" for every dependency in the code
 * @returns {string[]} one message per difference
 */
export function checkWorkspaceTable(markdown, projects, edges) {
  const rows = readTable(markdown);
  if (rows.size === 0)
    return [`${TABLE} has no projects table (a header starting "| Project |")`];

  const problems = [];
  const deps = new Map(projects.map((p) => [p.name, []]));
  for (const edge of edges) {
    const [from, to] = edge.split(' -> ');
    deps.get(from)?.push(to);
  }
  for (const { name, tags } of projects) {
    const row = rows.get(name);
    if (!row) {
      problems.push(`${TABLE}: project "${name}" has no row`);
      continue;
    }
    if (!same(row.tags, tags))
      problems.push(
        `${TABLE}: "${name}" lists tags ${row.tags.join(', ') || 'none'}, its project.json has ${tags.join(', ') || 'none'}`,
      );
    const actual = deps.get(name) ?? [];
    if (!same(row.deps, actual))
      problems.push(
        `${TABLE}: "${name}" lists dependencies ${row.deps.join(', ') || 'none'}, the code has ${actual.join(', ') || 'none'}`,
      );
  }
  for (const name of rows.keys())
    if (!deps.has(name))
      problems.push(
        `${TABLE}: "${name}" has a row but is not a workspace project`,
      );
  return problems;
}
