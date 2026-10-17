# 0024. Pin actions and check the CI supply chain

- **Status:** Proposed
- **Date:** 2026-10-17
- **Deciders:** @nguyenan97

## Context

CI already had least-privilege `permissions:`, CodeQL, Dependabot, secret scanning and push
protection ([0009](0009-strict-ci-gates-and-a-protected-main.md)). Three gaps were left in the
supply chain around it:

- **Actions were pinned by tag** (`actions/checkout@v7`). A tag is a pointer its owner, or an
  attacker with their token, can move. In March 2025 the tags of `tj-actions/changed-files` were
  rewritten to code that printed secrets into build logs
  ([GHSA-mw4p-6x4p-x5m5](https://github.com/advisories/GHSA-mw4p-6x4p-x5m5)), in every workflow
  that trusted them. zizmor counted 17 unpinned references here, and 6 checkouts that left the job
  token in `.git/config`.
- **Nothing judged a new dependency** before merge. `npm audit` runs by hand and reports the whole
  tree, so the advisory `main` already carries (`braces`, [0020](0020-storybook-on-the-angular-webpack-builder.md))
  would make it fail on every pull request.
- **Nothing measured the security practices** from outside, so a regression in them (a protection
  rule relaxed, a token widened) would go unseen.

## Decision

- **Every `uses:` is pinned to a full commit SHA**, with the release in a comment
  (`@3d3c42e… # v7.0.1`). Dependabot's monthly Actions updates move the SHA and the comment
  together. Every checkout sets `persist-credentials: false`.
- **zizmor** (the `Security` workflow) checks the workflows and `dependabot.yml` on every pull
  request and push to `main`, outside Advanced Security mode so that a finding fails the job.
- **Dependabot waits seven days** (`cooldown`) before proposing a new npm or Actions release:
  most compromised releases are found and pulled within days. Security updates are not delayed.
- **Dependency review** (the same workflow, pull requests only) fails a change that adds or
  upgrades to a dependency with a known vulnerability at `high` or above, or under a licence
  outside the allow list of permissive licences.
- **OpenSSF Scorecard** (its own workflow, as publishing requires) runs weekly, on pushes to `main`
  and when branch protection changes, uploads to code scanning and publishes the README badge.
- zizmor and dependency review start as ordinary checks and become **required after a run of
  clean results**, as `e2e` did. Scorecard is never required: it is a score, not a verdict.

## Alternatives considered

- **Pin by tag and trust Dependabot.** Dependabot notices a new release; it cannot notice a tag
  that was moved to different code.
- **`npm audit --audit-level=high` in CI.** It judges the whole tree, so it fails on the inherited
  `braces` advisory until that is fixed upstream, and a check that is always red gets ignored.
  Dependency review judges only what a change adds.
- **actionlint instead of zizmor.** actionlint checks workflow syntax and shell; zizmor checks
  security (injection, permissions, pinning, credentials), which is the gap here.
- **`step-security/harden-runner`** to audit each job's network egress. Useful, but it adds a
  third-party action to every job; it stays a candidate.

## Consequences

- A SHA says nothing to a reader; the comment carries the version, and a pin edited by hand must
  keep the two in step. Dependabot does that for its own updates.
- Two more jobs on every pull request, under a minute together.
- The licence allow list can refuse a dependency under an unusual or undeclared licence. The fix is
  to check the licence and extend the list in the same pull request, not to remove the check.
- Scorecard publishes its results publicly, as the badge does. It will mark down what this
  repository chose on purpose (no required review approval with one maintainer, 0009); that is
  accepted, and recorded here so the score is not chased.

## References

- [`.github/workflows/security.yml`](../../.github/workflows/security.yml),
  [`.github/workflows/scorecard.yml`](../../.github/workflows/scorecard.yml)
- [zizmor](https://docs.zizmor.sh), [dependency review](https://github.com/actions/dependency-review-action),
  [OpenSSF Scorecard](https://github.com/ossf/scorecard)
- [`CONSTRAINTS.md`](../../CONSTRAINTS.md), [the CI guide](../guide/ci.md)
