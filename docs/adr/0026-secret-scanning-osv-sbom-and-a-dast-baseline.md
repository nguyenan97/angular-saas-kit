# 0026. Secret scanning, OSV, an SBOM and a DAST baseline

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** @nguyenan97

## Context

[0024](0024-pin-actions-and-check-the-ci-supply-chain.md) pinned the actions and added zizmor,
dependency review and Scorecard; CodeQL already ran on every pull request
([0009](0009-strict-ci-gates-and-a-protected-main.md)). The audit of 2026-10-18
(`docs/superpowers/specs/2026-10-18-audit.md`, finding F9) found four gaps:

- **Secrets.** Push protection rejects only the formats GitHub's partners register. A generic key
  (`api_key = "..."`, a private key block, a token from a provider that is not a partner) goes
  through.
- **Advisories beyond GitHub's.** `npm audit` reads one database and runs by hand; the audit found
  40 advisories where `CONSTRAINTS.md` listed one.
- **No SBOM.** Nothing records what the apps ship, which a user of the kit, or a future release,
  needs.
- **No test of a running site.** The landing server's headers are unit-tested, but nothing has looked
  at the built site from outside.

## Decision

- **gitleaks** (the `Security` workflow) scans the commits a pull request adds, and what a push to
  `main` adds, and fails on a finding. It runs the official image pinned by digest, with no token.
- **A `Security scans` workflow**, weekly, on every push to `main` and on demand, that never
  blocks: **OSV-Scanner** on the lockfile, results to code scanning; a **CycloneDX SBOM** of the
  production dependencies, kept as an artifact for 90 days; a **ZAP baseline** (passive) against the
  built Pages site served locally, its report kept as an artifact.
- Each scan, where it runs, whether it blocks and who acts on it is a table in
  [the CI guide](../guide/ci.md#security-scanning).
- **Semgrep is not added.** CodeQL already analyses the TypeScript on every pull request with no open
  alert; a second SAST engine would mostly repeat it.
- None of the new jobs is required. gitleaks becomes required after a run of clean results, as `e2e`
  did; that is a branch-protection change for the maintainer.

## Alternatives considered

- **gitleaks-action instead of the image.** It needs a token and can comment on pull requests; the
  image needs neither, and a digest pins it as firmly as a SHA pins an action.
- **OSV-Scanner on every pull request, blocking.** It judges the whole tree, so it would fail every
  pull request on the accepted `braces` advisory; dependency review already judges what a change adds
  (0024's reasoning).
- **ZAP against the live Pages site.** Closer to what users get, but it scans a production host from
  CI on a schedule, and GitHub's own headers are out of this repository's control. The local preview
  tests what the repository builds.
- **SBOM with Syft.** It reads the built files rather than the lockfile and would add an action; the
  CycloneDX npm tool reads the lockfile the apps are built from.

## Consequences

- One more job on every pull request (gitleaks, seconds) and a weekly workflow of about ten minutes.
- A false positive in gitleaks blocks a pull request once the check is required. The fix is an
  allow-list entry in a `.gitleaks.toml` with the reason, never removing the job.
- The scheduled findings land in code scanning and artifacts, where someone has to look. The CI
  guide names who: the maintainer, weekly, with `dependabot-triage`.
- The ZAP baseline runs against a static preview server, so it says little about the Node server
  the landing page can also run on; that server's headers stay covered by
  `security-headers.spec.ts`.

## References

- [`.github/workflows/security.yml`](../../.github/workflows/security.yml),
  [`.github/workflows/security-scans.yml`](../../.github/workflows/security-scans.yml)
- [gitleaks](https://github.com/gitleaks/gitleaks), [OSV-Scanner](https://github.com/google/osv-scanner),
  [CycloneDX for npm](https://github.com/CycloneDX/cyclonedx-node-npm),
  [ZAP baseline](https://github.com/zaproxy/action-baseline)
- [0024](0024-pin-actions-and-check-the-ci-supply-chain.md), [`CONSTRAINTS.md`](../../CONSTRAINTS.md)
