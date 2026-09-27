---
name: open-pr
description: Open a pull request against main the way this repository works - a branch, Conventional Commits, verified locally, the required checks green, a squash merge. Use when a change is ready to go up, when asked to open or merge a PR, or when unsure how changes land on main.
---

# Open a pull request

`main` is protected. Changes land through a pull request; nothing is pushed to `main` directly. The
reasoning is in `docs/adr/0009-*.md` and `docs/adr/0012-*.md`.

## 1. Branch

```bash
git fetch origin
git switch -c <type>/<short-description> origin/main     # e.g. docs/vitepress-site, fix/theme-flash
git branch --show-current                                # not main
```

## 2. Commit

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`. The scope is
optional; if present it is one of `ui`, `tokens`, `mock-api`, `dashboard`, `landing`, `ci`, `deps`,
`repo`. `docs` is a **type** here, not a scope. Hooks run Prettier and commitlint; never `--no-verify`.
The body says why, and what was checked.

## 3. Verify

Run the `verify` skill: `npm run verify` and `npm run format:check`. Do not open a PR you have not run.

## 4. Push and open

```bash
git push -u origin <branch>
gh pr create --base main --title "<the squash commit subject>" --body "..."
```

The title becomes the commit on `main`, so it has to satisfy commitlint. The body follows the
repository's template: **What this changes**, **Why**, the checklist, screenshots for visual changes.
Add **How it was checked** and **Not covered**. Say what you did not verify, plainly.

## 5. Checks

Five are required and the branch must be up to date with `main`: `lint`, `test`, `build`,
`typecheck`, `format`. `CodeQL` and the Pages `Build site` run too but are not required. Look at the
result with `gh pr checks <number>`; do not poll it in a loop. A red required check is fixed with a
new commit, not bypassed. If `main` moved, `gh pr update-branch <number>` and wait for a fresh run.

## 6. Merge

Only when asked to, or under a standing instruction, and only when the required checks are green:

```bash
gh pr merge <number> --squash --delete-branch
```

Squash only, so `main` stays one conventional commit per change. Do not enable auto-merge unless
asked.

## 7. After

`git fetch origin` and confirm `main` has the commit. A push to `main` runs CI again and, for site
changes, deploys the Pages site: open `https://nguyenan97.github.io/angular-saas-kit/` (and `/demo/`,
`/docs/`) and check the change is live. If a follow-up is needed, start a new branch from `origin/main`.
