/**
 * Each rule of check-docs.mjs, shown red on a small tree that breaks it and
 * green on one that does not.
 *
 *   node --test scripts/
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { check } from './check-docs.mjs';

let root;

const write = (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

const skill = (name, front = `name: ${name}\ndescription: Does a thing.`) =>
  write(
    `.claude/skills/${name}/SKILL.md`,
    `---\n${front}\n---\n\n# ${name}\n\n## Done when\n\n- It is done.\n`,
  );

const problems = () => check(root).problems;

describe('check-docs', () => {
  // A tree that passes every rule; each test breaks one thing in it.
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'check-docs-'));
    write('package.json', JSON.stringify({ scripts: { verify: 'x' } }));
    write('libs/ui/project.json', JSON.stringify({ name: 'ui' }));
    write(
      'AGENTS.md',
      'Run `npm run verify` and `npx nx test ui`. See [docs](docs/a.md).\n',
    );
    write('docs/a.md', '# A\n\nBack to [agents](../AGENTS.md#commands).\n');
    write(
      'docs/adr/README.md',
      '| # | Decision | Status |\n| - | - | - |\n| [0001](0001-one.md) | One | Accepted |\n',
    );
    write('docs/adr/0001-one.md', '# 0001. One\n\n- **Status:** Accepted\n');
    skill('verify');
    write('CLAUDE.md', 'Skills: `verify`.\n');
    write(
      'docs/guide/development-process.md',
      '# Process\n\nThe `verify` skill.\n',
    );
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  test('passes a tree that breaks no rule', () => {
    assert.deepEqual(problems(), []);
  });

  test('names a dead relative link with its file and line', () => {
    write('docs/a.md', '# A\n\nSee [gone](gone.md).\n');
    assert.deepEqual(problems(), ['docs/a.md:3: "gone.md" does not exist']);
  });

  test('rejects a link that starts at the repository root', () => {
    write('docs/a.md', '# A\n\n[x](/AGENTS.md)\n');
    assert.match(problems()[0], /starts with "\/"/);
  });

  test('ignores links in code, comments and the working documents', () => {
    write(
      'docs/a.md',
      '# A\n\n`[x](gone.md)`\n\n```md\n[x](gone.md)\n```\n<!-- [x](gone.md) -->\n',
    );
    write('docs/superpowers/plan.md', '[x](gone.md)\n');
    assert.deepEqual(problems(), []);
  });

  test('names an npm script that package.json does not have', () => {
    write('docs/a.md', '# A\n\nRun `npm run check:colours`.\n');
    assert.deepEqual(problems(), [
      'docs/a.md:3: "npm run check:colours" is not a script in package.json',
    ]);
  });

  test('names an Nx project that does not exist', () => {
    write('docs/a.md', '# A\n\n`npx nx test widgets`\n');
    assert.deepEqual(problems(), [
      'docs/a.md:3: "nx test widgets" names no Nx project',
    ]);
  });

  test('reads Nx commands in code only, and not the subcommands', () => {
    write(
      'docs/a.md',
      '# A\n\nThe nx to the rescue.\n\n`npx nx run-many -t lint` and `nx affected -t test`.\n',
    );
    assert.deepEqual(problems(), []);
  });

  test('checks titled, bracketed, parenthesised and reference links', () => {
    write('docs/x (1).md', '# X\n');
    write('docs/b_(c).md', '# B\n');
    write(
      'docs/a.md',
      '# A\n\n[t](gone.md "title") [u](gone.md \'t\') [v](<x (1).md>) [w](b_(c).md)\n\n[r]: away.md\n',
    );
    assert.deepEqual(problems(), [
      'docs/a.md:3: "gone.md" does not exist',
      'docs/a.md:3: "gone.md" does not exist',
      'docs/a.md:5: "away.md" does not exist',
    ]);
  });

  test('blanks an indented fence and ignores a query string', () => {
    write(
      'docs/a.md',
      '# A\n\n- Item:\n\n  ```md\n  [x](gone.md)\n  ```\n\n[ok](../AGENTS.md?plain=1)\n',
    );
    assert.deepEqual(problems(), []);
  });

  test('rejects a link whose letter case differs from the file', () => {
    write('docs/a.md', '# A\n\n[x](../agents.md)\n');
    // A file system that ignores case (Windows, macOS) finds the file and the
    // spelling check catches it; Linux does not find it at all.
    const found = problems();
    assert.equal(found.length, 1);
    assert.match(
      found[0],
      /^docs\/a\.md:3: "\.\.\/agents\.md" (?:exists only in another letter case|does not exist)/,
    );
  });

  test('reports a malformed escape instead of crashing', () => {
    write('docs/a.md', '# A\n\n[x](bad%zz.md)\n');
    assert.deepEqual(problems(), [
      'docs/a.md:3: "bad%zz.md" is not a valid URL',
    ]);
  });

  test('names an ADR whose heading lacks its number', () => {
    write('docs/adr/0001-one.md', '# One\n\n- **Status:** Accepted\n');
    assert.deepEqual(problems(), [
      'docs/adr/0001-one.md: its first heading is not "# 0001. Title"',
    ]);
  });

  test('reads the status from the record’s own row, not one that links to it', () => {
    write(
      'docs/adr/README.md',
      '| # | Decision | Status |\n| - | - | - |\n| [0001](0001-one.md) | One | Superseded by [0002](0002-two.md) |\n| [0002](0002-two.md) | Two | Accepted |\n',
    );
    write(
      'docs/adr/0001-one.md',
      '# 0001. One\n\n- **Status:** Superseded by [0002](0002-two.md)\n',
    );
    write('docs/adr/0002-two.md', '# 0002. Two\n\n- **Status:** Accepted\n');
    assert.deepEqual(problems(), []);
  });

  test('names an ADR whose status differs from its index row', () => {
    write('docs/adr/0001-one.md', '# 0001. One\n\n- **Status:** Proposed\n');
    assert.deepEqual(problems(), [
      'docs/adr/README.md: 0001-one.md is "Proposed" in the record and "Accepted" in the index',
    ]);
  });

  test('names an ADR with no index row', () => {
    write('docs/adr/0002-two.md', '# 0002. Two\n\n- **Status:** Accepted\n');
    assert.deepEqual(problems(), [
      'docs/adr/README.md: no index row for 0002-two.md',
    ]);
  });

  test('rejects a frontmatter field outside the Agent Skills spec', () => {
    skill(
      'verify',
      'name: verify\ndescription: x\ndisable-model-invocation: true',
    );
    assert.deepEqual(problems(), [
      '.claude/skills/verify/SKILL.md: "disable-model-invocation" is not an Agent Skills frontmatter field',
    ]);
  });

  test('rejects a skill whose name does not match its folder', () => {
    skill('verify', 'name: check\ndescription: x');
    assert.match(problems()[0], /name "check" does not match its folder/);
  });

  test('reads a folded description and rejects an empty one', () => {
    skill('verify', 'name: verify\ndescription: >\n  Runs the checks.');
    assert.deepEqual(problems(), []);
    skill('verify', 'name: verify\ndescription:');
    assert.deepEqual(problems(), [
      '.claude/skills/verify/SKILL.md: description must be 1 to 1024 characters',
    ]);
  });

  test('rejects a skill name outside the spec', () => {
    skill('Verify_It', 'name: Verify_It\ndescription: x');
    write('CLAUDE.md', 'Skills: `verify`, `Verify_It`.\n');
    write(
      'docs/guide/development-process.md',
      'The `verify` and `Verify_It` skills.\n',
    );
    assert.deepEqual(problems(), [
      '.claude/skills/Verify_It/SKILL.md: "Verify_It" is not a valid skill name',
    ]);
  });

  test('rejects a skill with no Done when list', () => {
    write(
      '.claude/skills/verify/SKILL.md',
      '---\nname: verify\ndescription: x\n---\n\n# Verify\n',
    );
    assert.deepEqual(problems(), [
      '.claude/skills/verify/SKILL.md: no "## Done when" section',
    ]);
  });

  test('names a skill that a skill list leaves out', () => {
    skill('open-pr');
    write('CLAUDE.md', 'Skills: `verify`, `open-pr`.\n');
    assert.deepEqual(problems(), [
      'docs/guide/development-process.md: does not name the "open-pr" skill',
    ]);
  });
});
