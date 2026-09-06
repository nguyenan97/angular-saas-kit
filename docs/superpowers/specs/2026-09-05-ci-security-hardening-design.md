# CI / Security Hardening — Design

- **Status:** Approved
- **Date:** 2026-09-05

## Context

The workspace currently ships a minimal CI pipeline (`.github/workflows/ci.yml`):
a 3-way matrix (`lint`, `test`, `build`) plus a `typecheck` job, both using
`nx run-many` (every project, every run). There is no code-scanning
(CodeQL), no enforced format check, no coverage reporting, and `main` has no
branch protection. Dependabot is configured for dependency **version**
updates only (`.github/dependabot.yml`), not vulnerability alerts.

This is a public, MIT-licensed repo (`nguyenan97/angular-saas-kit`) worked on
heavily by an AI agent (Claude Code) committing frequently. Two goals need to
be balanced:

1. Bring the repo up to the standard expected of a serious open-source
   Angular kit (comparable to Kendo UI / PrimeNG's `sakai-ng`): security
   scanning, enforced formatting, coverage visibility, protected `main`.
2. Because commits land frequently (much more often than a typical
   human-paced repo), CI must not do redundant work. Public repos get
   unlimited free Actions minutes on standard runners, so this is not a
   billing concern — it's about avoiding queue pressure (the free-tier
   concurrent-job cap), slow feedback, and wasted compute.

## Goals

- CodeQL scanning, Dependabot security alerts, secret scanning + push
  protection.
- `prettier --check` enforced in CI, not just at commit time.
- Coverage measured across all 5 projects and reported via Codecov.
- `main` protected: PRs required, listed status checks required to pass.
- CI work scales with the size of a change, not the size of the repo.

## Non-goals

- Nx Cloud remote caching (revisit once the workspace is bigger — explicitly
  deferred by user decision).
- OSV-Scanner / npm audit workflow, OpenSSF Scorecard badge (explicitly out
  of scope — "standard GitHub bundle" was chosen over the extended bundle).
- Required PR review approvals on `main` (solo maintainer today; would lock
  the owner out of merging their own PRs). Revisit if the project gains
  collaborators.
- Anything about GitHub Pages, docs site, ADRs, C4 model, or Claude Code
  agent skills — separate specs (see decomposition discussed in
  conversation; this spec covers sub-project 1 of 6 only).

## Design

### 1. CI efficiency (applies to every job below)

- Replace `nx run-many -t <target>` with `nx affected -t <target>` in the
  `verify` matrix job of `ci.yml`. `fetch-depth: 0` is already set in the
  checkout step (present for exactly this purpose but currently unused) —
  wire it up: `nx affected` needs the merge-base against `main` to compute
  the affected project graph. On `pull_request` events this diffs against
  the PR base; on `push` events it diffs against the previous commit
  (`github.event.before`).
- **Amended during implementation:** the original design here added
  `paths-ignore: ['**/*.md', 'docs/**']` to the `ci.yml` triggers so
  docs-only changes would skip the pipeline entirely. Code review of the
  first implementation attempt found this breaks required status checks
  (section 6, below): when a workflow is skipped via `paths-ignore`, GitHub
  creates no check-run at all for that commit, so a docs-only PR can never
  satisfy a required check and becomes permanently unmergeable. `paths-ignore`
  was dropped; `nx affected` alone already resolves a docs-only change to a
  fast no-op (confirmed empirically: exits in under a second, "No tasks were
  run"), which is enough cost control without the required-checks trap.
- Keep the existing `concurrency` block (`cancel-in-progress: true`) as-is —
  it already cancels superseded runs on the same ref, which is the main
  defense against rapid-fire commits on one branch.
- No Nx Cloud (see Non-goals).

### 2. PR-funneled workflow

Branch protection (section 6) blocks direct pushes to `main`, so in practice
all work lands via PRs. Combined with `affected` + `cancel-in-progress`,
iterative commits on a PR branch are cheap (only the diff since the last run
is checked, and only the latest push actually finishes). `main` itself then
only sees one CI run per merge.

### 3. Format-check gate

- Add `"format:check": "prettier --check ."` to root `package.json` scripts
  (existing `lint-staged` config keeps doing `prettier --write` at commit
  time — this is the CI-side backstop, for anything that bypasses hooks or
  is edited directly on GitHub).
- Add a `format` job to `ci.yml`, parallel to the existing `typecheck` job.

### 4. Security scanning

- **CodeQL** — Advanced setup: a new `.github/workflows/codeql.yml` with
  `languages: [javascript-typescript]`, triggered on `pull_request` to
  `main` and a weekly `schedule` (not on every push to `main`) — chosen over
  Default Setup specifically because Default Setup does not expose this
  trigger control, and avoiding a push-to-main trigger is the point here.
  Needs `security-events: write` permission.
- **Dependabot alerts + automated security fixes** — repository setting,
  not a file (`vulnerability_alerts` / `automated_security_fixes` via the
  GitHub API or the Security tab). Requires explicit confirmation at
  execution time (repo-settings change).
- **Secret scanning + push protection** — repository setting
  (`security_and_analysis` block via the GitHub API or the Security tab).
  Requires explicit confirmation at execution time.

### 5. Coverage → Codecov

- `apps/dashboard` and `apps/landing` use `@angular/build:unit-test`;
  `libs/tokens` and `libs/ui` use `@nx/angular:unit-test`; `libs/mock-api`
  uses `@nx/vitest:test` and already sets
  `reportsDirectory: coverage/libs/mock-api`. Add equivalent coverage output
  configuration (provider `v8`, reporters including `lcov`) to the other
  four projects' test targets so every project emits an `lcov.info`.
- Add a `codecov/codecov-action@v5` step to the CI `test` job, uploading all
  five `coverage/**/lcov.info` paths. Public repo → tokenless upload, no
  `CODECOV_TOKEN` secret needed.
- Add Codecov and CodeQL badges to `README.md`, next to the existing CI /
  License / Angular / Sponsor badges.

### 6. Branch protection on `main`

- Required status checks: `lint`, `test`, `build`, `typecheck`, `format`,
  and the CodeQL analysis check.
- Require the branch to be up to date with `main` before merging.
- Do **not** require PR review approvals (see Non-goals).
- Applied via the GitHub API/Settings UI — requires explicit confirmation
  at execution time (repo-settings change, not a file in this repo).

## Rollout order

1. `package.json` script + `format` CI job.
2. Switch matrix job to `nx affected` (job-scoped `actions: read`
   permission for `nrwl/nx-set-shas`; no `paths-ignore` — see amendment
   above).
3. Coverage config per project + Codecov action + README badge.
4. `codeql.yml` (Advanced setup) + CodeQL README badge.
5. Confirm with user, then enable via API/Settings: Dependabot alerts,
   secret scanning + push protection, branch protection on `main`.

Steps 1–4 are ordinary code changes (PR + review as normal). Step 5 touches
shared repo configuration and is called out for a separate, explicit
confirmation immediately before execution, per the change categories this
session operates under.

## Testing / verification

- Open a throwaway PR touching one project only; confirm the `verify`
  matrix only runs targets for the affected project(s), not all five.
- Open a PR touching only a `.md` file; confirm the `verify` matrix still
  runs (no `paths-ignore` — see amendment above) but `nx affected` finds
  zero affected projects and each job finishes quickly as a no-op.
- Confirm `format` job fails on a deliberately unformatted file, then
  passes after `prettier --write`.
- Confirm CodeQL run appears under the Security tab after the PR trigger
  fires (not on a direct push to `main`, since that trigger is intentionally
  excluded).
- Confirm Codecov comment/status appears on the PR and the badge in
  `README.md` renders a real percentage after merge.
- Once branch protection is enabled, confirm a PR cannot merge with a
  failing required check, and that a direct push to `main` is rejected.
