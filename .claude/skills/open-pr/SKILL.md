---
name: open-pr
description: Branch, commit, verify, push, open a pull request against main, and squash-merge it once the required checks are green.
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

The title becomes the commit on `main`, so it has to satisfy commitlint. The body fills every
section of `.github/pull_request_template.md`, the checklist honestly ticked.

## 5. Checks

The required checks are listed in `docs/adr/0009-strict-ci-gates-and-a-protected-main.md`, and the
branch must be up to date with `main`. Look at them with `gh pr checks <number> --required`; do not
poll it in a loop. A red required check is fixed with a
new commit, not bypassed. If `main` moved, `gh pr update-branch <number>` and wait for a fresh run.

## 6. Merge

Only when asked to, or under a standing instruction, and only when the required checks are green:

```bash
gh pr merge <number> --squash --delete-branch
```

Squash only, so `main` stays one conventional commit per change. Do not enable auto-merge unless
asked.

## 7. After

A push to `main` runs CI again and, for site changes, deploys the Pages site. If a follow-up is
needed, start a new branch from `origin/main`.

## Done when

- The PR is open against `main`, its title passes commitlint, and its body has no empty template
  section.
- `gh pr checks <number> --required` shows every required check passing, or the report names the
  red one and why.
- If you merged: `git fetch origin && git log origin/main -1` shows the squash commit, and for a
  site change `https://nguyenan97.github.io/angular-saas-kit/` (or `/demo/`, `/storybook/`,
  `/docs/`) shows it live.
