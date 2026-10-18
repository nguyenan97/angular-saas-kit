---
name: open-pr
description: Branch, commit, verify, push, open a pull request against main, and squash-merge it once the required checks are green - small, one purpose, up to date with main. User-invoked (hidden from the model); run it at the ship step of every task, since autonomous mode is the default.
---

# Open a pull request

`main` is protected. Changes land through a pull request; nothing is pushed to `main` directly. The
workflow is in the Git workflow section of `CONTRIBUTING.md`, the reasoning in `docs/adr/0009-*.md`
and `docs/adr/0012-*.md`.

## When to use

At the ship step of every task: autonomous mode is the default (ADR 0027,
`docs/guide/development-process.md`), so the agent opens and merges without asking.

## When not to use

- When the person narrowed the task in words ("do not merge"): open the pull request and stop there.
- Before the `verify` skill is done. Do not open a pull request you have not run.

## 1. Branch

One task, one branch, one worktree. If another agent works in this checkout, take a worktree of
your own (`git worktree add ../<dir> -b <branch> origin/main`).

```bash
git fetch origin
git switch -c <type>/<scope>-<slug> origin/main   # feat/ui-combobox, fix/tokens-dark-ring, chore/repo-check-docs
git branch --show-current                          # not main
```

For a change that needs another open one, branch from that branch instead (a stacked pull
request); open it against that branch, and retarget it to `main` once the first merges.

## 2. Commit

Small commits, each green, one idea each, in Conventional Commits: `type(scope): subject`, the
scope from `AGENTS.md`, `docs` a type and never a scope. A refactor and a feature are separate
commits and separate pull requests. The body says why, and what was checked. Hooks run Prettier
and commitlint; never `--no-verify`, not even for a throwaway commit that only proves a check
fails: give it a conventional message instead. A body line that starts with a word and a colon
(`mode: ...`) reads to commitlint as a footer; reword it.

## 3. Size and sync

```bash
git fetch origin && git rebase origin/main
git diff --stat origin/main...HEAD -- . ':!package-lock.json'
```

About 400 changed lines is the limit, not counting the lockfile, generated files or the working
documents in `docs/superpowers`. Over it: split the change, or say in the body why it cannot be.

## 4. Verify and review

Run the `verify` skill: `npm run verify` and `npm run format:check`. Then the `review-change`
skill, run by another agent or session, not the one that wrote the change; fix every blocking
finding before the merge.

## 5. Push and open

```bash
git push -u origin <branch>
gh pr create --base main --title "<the squash commit subject>" --body "..."
```

The title becomes the commit on `main`, and CI's `pr title` check runs commitlint on it. The body
fills every section of `.github/pull_request_template.md`, with the commands' output pasted, the
checklist honestly ticked, and the size explained if it is over the limit.

## 6. Checks

The required checks are in `docs/adr/0009-strict-ci-gates-and-a-protected-main.md`; the branch must
be up to date with `main`. Look at them with `gh pr checks <number> --required`; do not poll it in a
loop. A red check is fixed at its cause with a new commit, never bypassed; after three failed
attempts, leave the pull request open or as a draft and say why. If `main` moved,
`gh pr update-branch <number>` and wait for a fresh run.

## 7. Merge

Without asking, and only with every required check green, the branch up to date and no blocking
review finding:

```bash
gh pr merge <number> --squash --delete-branch
```

Squash only, so `main` stays one conventional commit per change. Never merge as an administrator
around the rules, and do not enable auto-merge unless asked.

Then the branch goes, on GitHub and locally, so only work in progress has a branch.
`--delete-branch` does both, but it stops short when the local branch cannot be switched away
from (`main` checked out in another worktree, for one). Once `gh pr view <number> --json state`
says `MERGED`, finish it by hand; a squash merge leaves the branch looking unmerged to git, hence
`-D`:

```bash
git push origin --delete <branch>   # if it is still on GitHub
git switch --detach origin/main     # if this worktree has it checked out
git branch -D <branch>
```

## 8. After

A push to `main` runs CI again and, for site changes, deploys the Pages site. Each open pull request
stacked on this one gets retargeted to `main`; each other open one needs `gh pr update-branch`.

Sweep the other branches too: delete each one, on GitHub and locally, whose pull request has merged
(`gh pr list --state merged --head <branch>`) or whose commits are all in `main`
(`git rev-list --count origin/main..<branch>` is 0). Leave a branch that has no merged pull request
and commits of its own, and one checked out in another session's worktree: that session owns it,
and the report names it.

## Done when

- The PR is open against `main`, its title passes the `pr title` check, and its body has no empty
  template section.
- Its diff is about 400 lines or fewer outside the lockfile and generated files, or the body says
  why not.
- `gh pr checks <number> --required` shows every required check passing, or the report names the
  red one and why.
- If you merged: an independent review had no blocking finding, the branch is gone from GitHub
  and from the local repository (or the report says which worktree still holds it), and
  `git fetch origin && git log origin/main -1` shows the squash commit; for a site change
  `https://nguyenan97.github.io/angular-saas-kit/` (or `/demo/`, `/storybook/`, `/docs/`) shows it
  live.
