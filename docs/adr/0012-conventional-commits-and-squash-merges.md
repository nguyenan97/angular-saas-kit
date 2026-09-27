# 0012. Conventional Commits and squash merges

- **Status:** Accepted
- **Date:** 2026-09-26
- **Deciders:** @nguyenan97

## Context

The history is read by people scanning for what changed and, eventually, by a
changelog generator. Pull requests also contain intermediate commits: reviewed
work is fixed in follow-up commits, and some intermediate commits are red on their
own (in [#6](https://github.com/nguyenan97/angular-saas-kit/pull/6), turning
coverage on broke a test until the next commit fixed it).

## Decision

- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)**,
  enforced by commitlint in a husky `commit-msg` hook. The optional scope must be one
  of `ui`, `tokens`, `mock-api`, `dashboard`, `landing`, `ci`, `deps`, `repo`.
- A husky `pre-commit` hook runs `lint-staged`, which runs `prettier --write` on
  staged TypeScript, HTML, CSS, JSON, Markdown and `.mjs` files.
- **Pull requests are squash-merged.** The PR title becomes the commit subject on
  `main`, so it has to satisfy the same rules. `main` stays a linear list of one
  conventional commit per change.

## Alternatives considered

- **Merge commits** - keep every intermediate commit, including the red ones, and
  make `git bisect` land on commits that never passed CI.
- **Rebase merges** - the same problem, without the merge commit.
- **No convention** - nothing for a changelog to read.

## Consequences

- `main` bisects cleanly: each commit is a change that went through the required
  checks ([0009](0009-strict-ci-gates-and-a-protected-main.md)).
- The detail of how a change was reviewed and corrected lives in the PR, not in
  `main`. Write the PR description accordingly.
- The scope list is a closed enum: a new area of the codebase needs an entry in
  `commitlint.config.mjs` before commits can mention it.
- Prettier rewrites staged files on commit, so a commit can differ from what was
  staged. The `format` check in CI is the backstop for anything that skips the hook.
- `CONTRIBUTING.md` says the changelog is generated from these messages, but no
  generator is wired up yet: there is no release workflow and no `CHANGELOG.md`.

## References

- [`commitlint.config.mjs`](../../commitlint.config.mjs), [`.husky/`](../../.husky), [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
