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
