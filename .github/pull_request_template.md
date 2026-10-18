## What this changes

<!-- One or two sentences. Link the spec and the plan task, or the issue. -->

## Why

<!-- What problem this solves. Skip if the spec or issue already covers it. -->

## Scenarios covered

<!-- The spec's scenarios (or audit findings) this makes true, each with the test that proves it.
"None: a dependency bump" is an answer. -->

## How it was checked

<!-- Paste the output: `npm run verify`, `npm run format:check`, the task's own command, a test that
failed before and passes after, a before/after screenshot. Then what you did not check, plainly. -->

## Docs, C4 and ADRs

<!-- Which guides, C4 pages and ADRs this updates, or "none needed" and why. -->

## Written with AI

<!-- Which parts an agent wrote, and who reviewed them (another agent, a person). "None" is fine. -->

## Merge danger

<!-- Door: two-way (easy to revert) or one-way (a published API, a migration, a removed file other
people link to). Blast radius in a word: none, docs, one component, the dashboard, every app, CI.
Rollback: how to undo it (usually: revert this pull request). Size: over about 400 changed lines,
not counting the lockfile and generated files? Say why it is not split. -->

## Checklist

- [ ] `npm run verify` and `npm run format:check` pass locally
- [ ] The title is a Conventional Commit with a scope from `AGENTS.md` (CI checks it)
- [ ] No colour literals in components — semantic tokens only (`npm run check:tokens`)
- [ ] Keyboard reachable and operable; focus is visible; ARIA matches the WAI-ARIA pattern
- [ ] Works in both light and dark, and with all four accents
- [ ] Tests cover the behaviour, not just that it renders
- [ ] New project or dependency between projects: `docs/architecture/c4-containers.md` updated
- [ ] Hard-to-reverse decision: an ADR in `docs/adr/`
- [ ] Behaviour a guide describes has changed: the page in `docs/` is updated

## Screenshots

<!-- For any visual change: light and dark. -->
