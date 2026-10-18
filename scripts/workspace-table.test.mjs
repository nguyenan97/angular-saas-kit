/**
 * The workspace table rule, red on a table that disagrees with the workspace
 * and green on one that does not.
 *
 *   node --test "scripts/*.test.mjs"
 */
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { checkWorkspaceTable, readTable } from './workspace-table.mjs';

const projects = [
  { name: 'ui', tags: ['type:lib', 'scope:shared'] },
  { name: 'tokens', tags: ['type:lib', 'scope:shared'] },
  { name: 'e2e', tags: ['type:e2e', 'scope:dashboard'] },
];
const edges = ['ui -> tokens', 'e2e -> ui'];

const page = (rows) =>
  [
    '# Workspace',
    '',
    '| Project  | Tags                          | Depends on        |',
    '| -------- | ----------------------------- | ----------------- |',
    ...rows,
    '',
    'Prose after the table.',
  ].join('\n');

const good = [
  '| `ui`     | `type:lib`, `scope:shared`    | `tokens`          |',
  '| `tokens` | `type:lib`, `scope:shared`    | none              |',
  '| `e2e`    | `type:e2e`, `scope:dashboard` | `ui` (implicit)   |',
];

describe('workspace table', () => {
  test('reads names, tags and dependencies from the cells', () => {
    assert.deepEqual(readTable(page(good)).get('e2e'), {
      tags: ['type:e2e', 'scope:dashboard'],
      deps: ['ui'],
    });
  });

  test('passes a table that matches the workspace', () => {
    assert.deepEqual(checkWorkspaceTable(page(good), projects, edges), []);
  });

  test('names a dependency the table leaves out', () => {
    const rows = [...good];
    rows[0] = '| `ui` | `type:lib`, `scope:shared` | none |';
    assert.deepEqual(checkWorkspaceTable(page(rows), projects, edges), [
      'docs/reference/workspace.md: "ui" lists dependencies none, the code has tokens',
    ]);
  });

  test('names tags that differ from project.json', () => {
    const rows = [...good];
    rows[1] = '| `tokens` | `type:lib` | none |';
    assert.deepEqual(checkWorkspaceTable(page(rows), projects, edges), [
      'docs/reference/workspace.md: "tokens" lists tags type:lib, its project.json has type:lib, scope:shared',
    ]);
  });

  test('names a project with no row, and a row with no project', () => {
    const rows = [good[0], good[1], '| `gone` | `type:lib` | none |'];
    assert.deepEqual(checkWorkspaceTable(page(rows), projects, edges), [
      'docs/reference/workspace.md: project "e2e" has no row',
      'docs/reference/workspace.md: "gone" has a row but is not a workspace project',
    ]);
  });

  test('fails when the page has no projects table', () => {
    assert.match(
      checkWorkspaceTable('# Workspace\n', projects, edges)[0],
      /has no projects table/,
    );
  });
});
