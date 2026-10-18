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

Then the branch goes, on GitHub and locally, so only work in progress has a branch. A branch is
**merged** when its pull request merged and the branch has nothing beyond that pull request's head:
anything else is work that `main` does not have, and stays. `--delete-branch` does the deleting,
but it stops short when the local branch cannot be switched away from (`main` checked out in
another worktree, for one); finish by hand, checking each step:

```bash
gh pr view <number> --json state,headRefOid --jq '.state + " " + .headRefOid'   # MERGED <head>
git fetch --prune origin
gh pr list --state open --base <branch>      # a stacked PR: gh pr edit <n> --base main, first
git rev-list --count <head>..origin/<branch> # 0, or keep it: someone pushed after the merge
git push --force-with-lease=<branch>:<head> origin --delete <branch>
git switch --detach origin/main              # if this worktree has it checked out
git rev-list --count <head>..<branch>        # 0, or keep it: it has commits the PR did not
git branch -D <branch>                       # -D: a squash merge looks unmerged to git
```

## 8. After

A push to `main` runs CI again and, for site changes, deploys the Pages site. Each open pull request
stacked on this one gets retargeted to `main`; each other open one needs `gh pr update-branch`.

Sweep the other branches too, the same way: after `git fetch --prune origin`, delete each branch,
on GitHub and locally, that is merged as defined in step 7 (its pull request is
`gh pr list --state merged --head <branch> --json number,headRefOid`; check the head, not just the
name, since a name can come back). A local branch that was never pushed and has no commits of its
own (`git rev-list --count origin/main..<branch>` is 0, typically a session's starting branch) goes
too. Everything else stays: a branch with commits no merged pull request has, a branch an open
pull request targets as its base, an open Dependabot pull request's branch (Dependabot deletes its
own once they close), and a branch checked out in another session's worktree, which that session
owns. The report names what stayed and why.

## Done when

- The PR is open against `main`, its title passes the `pr title` check, and its body has no empty
  template section.
- Its diff is about 400 lines or fewer outside the lockfile and generated files, or the body says
  why not.
- `gh pr checks <number> --required` shows every required check passing, or the report names the
  red one and why.
- If you merged: an independent review had no blocking finding, the branch is gone from GitHub
  and from the local repository (or the report says why it stayed), the report lists
  `<branch> <sha>` for every branch deleted, so any of them can be restored, and
  `git fetch origin && git log origin/main -1` shows the squash commit; for a site change
  `https://nguyenan97.github.io/angular-saas-kit/` (or `/demo/`, `/storybook/`, `/docs/`) shows it
  live.
