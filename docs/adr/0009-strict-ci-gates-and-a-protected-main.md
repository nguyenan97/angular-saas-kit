# 0009. Strict CI gates and a protected `main`

- **Status:** Accepted
- **Date:** 2026-09-26
- **Deciders:** @nguyenan97

## Context

The repository is public, MIT-licensed and edited frequently, including by AI
agents. Two pressures pull in opposite directions: it has to meet the bar of a
serious open-source kit (scanned, formatted, tested, `main` protected), and CI must
not do redundant work when commits arrive in bursts. Public repositories get
unlimited free runner minutes, so the concern is queueing, slow feedback and waste,
not the bill.

The full reasoning, including what was amended during implementation, is in the
[design spec](../superpowers/specs/2026-09-05-ci-security-hardening-design.md) and
the [implementation plan](../superpowers/plans/2026-09-05-ci-security-hardening.md).

## Decision

**Gates.** A pull request runs `lint`, `test` and `build` through `nx affected`
(only the projects the change reaches), a workspace `typecheck`, and a `format`
check (`prettier --check .`). CodeQL analyses the JavaScript and TypeScript on pull
requests and on a weekly schedule. Tests collect coverage for every project.

**Protection on `main`.** The five checks above are required, and the branch must
be up to date before merging. No review approval is required and administrators are
not forced through the rules, because there is one maintainer and a required
approval would lock them out of merging their own PRs. Force pushes and deletion are
blocked. Pull requests are squash-merged ([0012](0012-conventional-commits-and-squash-merges.md)).

**Security settings.** Dependabot alerts and security updates, secret scanning and
push protection are on.

**Deliberate choices**

- `nx affected` needs the Actions API on `push` events to find the last successful
  run, so the `verify` job alone gets `actions: read`.
- The workflow has **no `paths-ignore`**. A workflow skipped by a path filter creates
  no check run at all, so once checks are required a docs-only PR would wait forever
  for a check that never reports. `nx affected` already makes such a run cheap.
- **CodeQL is not a required check.** A `pull_request` run from a fork always gets a
  read-only token, so CodeQL's upload fails for every fork PR whatever the workflow
  grants; requiring it would block outside contributors on a repository that invites
  them. It still runs and reports.
- CodeQL is an advanced-setup workflow rather than GitHub's default setup, because
  the default cannot skip the push-to-`main` trigger.
- Coverage is uploaded to Codecov with `fail_ci_if_error: false`.

## Alternatives considered

- **Run everything on every push** - simple, and slow in a burst of commits.
- **Require a review approval** - the usual default; wrong for a one-person project.
- **Enforce the rules on administrators too** - stricter; it removes the maintainer's
  ability to fix `main` in an emergency.
- **Nx Cloud remote caching** - the strongest speed lever, deferred until the
  workspace is large enough to need it.

## Consequences

- CI cost scales with the change, and a red PR cannot be merged by accident.
- Because the branch must be up to date, merging several PRs in sequence needs an
  "Update branch" and a fresh CI run for each after the first.
- The administrator can still push straight to `main` and bypass the checks. That is
  a consequence of the choice above, not an oversight.
- **Open:** the Codecov upload is rejected (`Token required because branch is
protected`) and, because of `fail_ci_if_error: false`, hidden behind a green build.
  It needs a `CODECOV_TOKEN` secret passed as `token:`.
- A local install must resolve peer dependencies the way CI does. A user-level
  `legacy-peer-deps=true` once hid a conflict that failed `npm ci` in CI, so the
  repository `.npmrc` pins `legacy-peer-deps=false`.

## References

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`codeql.yml`](../../.github/workflows/codeql.yml)
- [#6](https://github.com/nguyenan97/angular-saas-kit/pull/6), [#16](https://github.com/nguyenan97/angular-saas-kit/pull/16), [#24](https://github.com/nguyenan97/angular-saas-kit/pull/24)
