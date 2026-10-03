---
name: dependabot-triage
description: Triage and merge Dependabot pull requests safely - read each bump, reproduce a strict install, close unsupported majors with a reason, read the dependency chain before accepting a security fix, and merge in order. Use when asked to check, review or merge dependency updates.
---

# Triage Dependabot pull requests

The policy and its history are in `docs/adr/0010-dependabot-grouping-and-ignored-major-versions.md`,
and `.github/dependabot.yml` is the source of truth. Weekly npm PRs, monthly GitHub Actions PRs.

## 1. List

```bash
gh pr list --repo nguyenan97/angular-saas-kit --author "app/dependabot" \
  --json number,title,headRefName,mergeStateStatus,statusCheckRollup
```

## 2. Read each one

- **Groups.** The Angular packages (`@angular/*`, `@angular-devkit/*`, `@schematics/angular`,
  `angular-eslint`) travel together, and so do `nx` and `@nx/*`. `@angular/compiler` and `@angular/compiler-cli` peer-depend on
  each other's exact version. A PR that splits the Angular set is a configuration bug: report it, do not
  merge half of it.
- **Ignored majors.** Major bumps of `vitest`, `@vitest/*` and `@types/node` are ignored on purpose
  (the toolchain does not support Vitest 5 yet; types track the minimum Node, 22). Close such a PR
  with the reason. The ignore entries come out when all three tools widen their peer ranges.
- **The diff.** `package.json` and the lockfile. Anything you would not expect (a new package, a
  removed one, an install script) gets a look.

## 3. Reproduce a failure the way CI sees it

```bash
gh pr checkout <number>
npm ci        # strict: the repo .npmrc sets legacy-peer-deps=false
npm run verify && npm run format:check
```

A PR that fails `npm ci` is **never merged**. `ERESOLVE` is a real conflict, often a peer range that
does not include the new version. Close it with the reason, or fix it in a separate change.

## 4. Security updates are not automatically right

Read the chain before accepting the fix: `npm ls <package>`, then `npm audit`. The `uuid` advisory came
only through `@angular-devkit/build-angular`, which nothing used, and Dependabot proposed upgrading it
(red on every job) instead of removing it. Removing a dependency can leave its whole subtree in the
lockfile, because npm keeps an entry that any edge, optional peers included, still points at; prune it.
Run `npm audit` before and after and say what changed.

## 5. Merge in order

Oldest first, and only with the required checks green (see `open-pr` for the merge command). Because
`main` requires an up-to-date branch, each merge makes the rest stale: `gh pr update-branch <number>`,
or comment `@dependabot rebase` (a lockfile conflict needs the latter), then wait for a fresh run.
Do not enable auto-merge.

## 6. After

Check that `main` CI is green. Note anything you closed and why in your report, so the person can see
what did not land.
