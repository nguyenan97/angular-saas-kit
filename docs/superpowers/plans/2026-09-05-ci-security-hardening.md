# CI / Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add format enforcement, security scanning (CodeQL, Dependabot alerts, secret scanning), coverage reporting (Codecov), and branch protection to `main`, while keeping CI cost proportional to the size of each change (`nx affected`, path filtering, no push-to-main triggers on CodeQL).

**Architecture:** All work lands as ordinary file edits on the current branch (`features/project-purpose-ca3ca3`), committed task-by-task. The last two tasks change GitHub repository _settings_ (not files) via `gh api` and require the user's explicit go-ahead immediately before running, per this session's operating rules — do not run them without asking first, even though the design was already approved.

**Tech Stack:** GitHub Actions, Nx (`nx affected`), Prettier, CodeQL (Advanced setup), Codecov, GitHub REST API via `gh api`.

**Reference spec:** `docs/superpowers/specs/2026-09-05-ci-security-hardening-design.md`

---

## Verified facts this plan depends on

Recorded here because they came from reading the actual tool source (not assumed), and later tasks rely on them:

- `@angular/build:unit-test` (used by `dashboard`, `landing`) and `@nx/angular:unit-test` (used by `tokens`, `ui`) share the exact same options schema — `@nx/angular:unit-test`'s schema literally extends `UnitTestBuilderOptions` from `@angular/build`. Both accept `coverage: boolean` and `coverageReporters: string[]` (valid values include `'lcov'`, `'text-summary'`). **Neither exposes a coverage output-directory option** — there is no `reportsDirectory`/`coverageDirectory` field in the schema, confirmed by reading `options.ts` in `angular/angular-cli`, which normalizes builder options into a coverage config object with no directory field. The directory is therefore whatever Vitest's own default resolves to per project — this plan does not hardcode it (see Task 5).
- `libs/mock-api` uses the `@nx/vitest:test` executor, which has **no `coverage` option at all** (confirmed from its schema in `nrwl/nx`) — coverage there is controlled entirely by `libs/mock-api/vite.config.mts`'s own `test.coverage` block. That block currently sets `reportsDirectory` and `provider` but not `enabled`, so **coverage is not actually being collected today**. Task 4 fixes this.
- `@nx/vitest:test` is deprecated upstream (removal planned for Nx v24). Out of scope for this plan (see spec Non-goals) — noted here so nobody "fixes" it by accident while touching this file.
- `gh` is installed and authenticated as `nguyenan97` (repo owner) with `repo` scope — sufficient for the repo-settings tasks at the end.

---

## Task 1: Format-check gate

**Files:**

- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the `format:check` script**

In `package.json`, add a new script. Current scripts block:

```json
  "scripts": {
    "start": "nx serve dashboard",
    "start:landing": "nx serve landing",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint",
    "typecheck": "tsc -p tsconfig.base.json --noEmit",
    "verify": "nx run-many -t lint test build && npm run typecheck",
    "prepare": "husky"
  },
```

Change it to:

```json
  "scripts": {
    "start": "nx serve dashboard",
    "start:landing": "nx serve landing",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint",
    "typecheck": "tsc -p tsconfig.base.json --noEmit",
    "format:check": "prettier --check .",
    "verify": "nx run-many -t lint test build && npm run typecheck",
    "prepare": "husky"
  },
```

- [ ] **Step 2: Verify the script fails today (repo is not fully formatted-checked yet)**

Run: `npm run format:check`
Expected: exits non-zero and lists any files that are not Prettier-formatted (or exits 0 if the tree is already clean — either is fine, this step just confirms the script runs and Prettier resolves correctly).

- [ ] **Step 3: Add the `format` job to CI**

In `.github/workflows/ci.yml`, add a new job after `typecheck` (the full current file, for orientation):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# A new push to a PR makes the in-flight run pointless - cancel it rather than
# burning minutes on a commit nobody will merge.
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  NX_DAEMON: false

jobs:
  verify:
    name: ${{ matrix.target }}
    runs-on: ubuntu-latest
    strategy:
      # Report every failing gate in one run instead of stopping at the first.
      fail-fast: false
      matrix:
        target: [lint, test, build]

    steps:
      - uses: actions/checkout@v5
        with:
          # Nx `affected` needs history to diff against the base branch.
          fetch-depth: 0

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install
        run: npm ci

      - name: Run ${{ matrix.target }}
        run: npx nx run-many -t ${{ matrix.target }} --output-style=static

  typecheck:
    name: typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      # The build compiles with the app tsconfigs; this catches anything the
      # build's own program does not include, such as spec-only type errors.
      - run: npx tsc -p tsconfig.base.json --noEmit
```

Add this job at the end of the file (keep everything above unchanged for this step — Task 2 edits the `verify` job body). Indentation below is exactly as it must appear in the file — `format:` is a sibling of `verify:` and `typecheck:` under `jobs:`, so it starts 2 spaces in (shown as plain text, not a `yaml` fence, so this markdown file's own formatter can't quietly re-indent it):

```
  format:
    name: format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx prettier --check .
```

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: add format:check script and CI job

prettier --write already runs at commit time via lint-staged; this adds
the same check as a CI backstop for anything that bypasses hooks or is
edited directly on GitHub.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Switch CI to `nx affected`

> **Amended after code-quality review of the first implementation attempt**
> (commit `499b456`). The original version of this task also added
> `paths-ignore: ['**/*.md', 'docs/**']` to the workflow triggers. Review
> found two problems, both preserved here as a record: (1) `nrwl/nx-set-shas@v4`
> needs `actions: read` to handle `push` events (it calls the Actions API to
> find the last successful run) — the workflow only grants `contents: read`,
> so every `push` to `main`, including every PR merge, would fail the
> `verify` job. (2) `paths-ignore` at the workflow-trigger level means
> GitHub creates no check-run at all for a docs-only change — once Task 9
> makes `lint`/`test`/`build`/`typecheck`/`format` required status checks,
> a docs-only PR would get permanently stuck on "Expected — waiting for
> status," unmergeable. Fix: add the missing permission, and drop
> `paths-ignore` entirely — `nx affected` already makes a docs-only run
> cheap (zero projects affected, jobs finish in seconds), without the
> required-checks trap. Task 9 no longer needs to account for this
> interaction.

**Files:**

- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Give the `verify` job its own `actions: read` permission**

`nrwl/nx-set-shas` (added in Step 2 below) needs `actions: read` to look up the
last successful workflow run on `push` events — the workflow only grants
`contents: read` at the top level, which isn't enough, and `push` fires on
every merge to `main`. Scope the extra permission to the `verify` job only
(not `typecheck`/`format`, which don't need it). Indentation below matches
the real file exactly (`name:`/`runs-on:` sit 4 spaces in, under `verify:`
under `jobs:`) — shown as plain text rather than a `yaml` fence so it
survives untouched:

```
  verify:
    name: ${{ matrix.target }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
    strategy:
```

(This is the same `verify:` job header that's already in the file — you're inserting the new `permissions:` block between the existing `runs-on: ubuntu-latest` line and the existing `strategy:` line. Nothing else in the header changes.)

- [ ] **Step 2: Add `nx-set-shas` and switch `run-many` to `affected`**

In `.github/workflows/ci.yml`, replace the `verify` job's `steps:` block. Indentation below matches the real file exactly (`steps:` sits 4 spaces in, under `verify:` under `jobs:`) — shown as plain text rather than a `yaml` fence so it survives untouched:

```
    steps:
      - uses: actions/checkout@v5
        with:
          # Nx `affected` needs history to diff against the base branch.
          fetch-depth: 0

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install
        run: npm ci

      - name: Run ${{ matrix.target }}
        run: npx nx run-many -t ${{ matrix.target }} --output-style=static
```

with:

```
    steps:
      - uses: actions/checkout@v5
        with:
          # Nx `affected` needs history to diff against the base branch.
          fetch-depth: 0

      # Sets NX_BASE / NX_HEAD so `nx affected` diffs against the right
      # commits for both push and pull_request events.
      - uses: nrwl/nx-set-shas@v4

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install
        run: npm ci

      - name: Run ${{ matrix.target }}
        run: npx nx affected -t ${{ matrix.target }} --output-style=static
```

- [ ] **Step 3: Verify the workflow YAML is well-formed**

Run: `node -e "require('yaml') || 1" 2>/dev/null; npx -y yaml-lint .github/workflows/ci.yml`
Expected: no parse errors printed (if `yaml-lint` itself fails to install/run in this environment, instead visually diff the file against the two blocks above — every `steps:`/`on:` key must line up at the same indentation as its siblings).

- [ ] **Step 4: Commit**

If Steps 1-3 above are landing as a fix on top of an already-committed first
attempt (as happened here — see the amendment note at the top of this task),
commit them separately with a message that explains the correction:

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
fix: grant actions: read to verify, drop paths-ignore

Code-quality review of 499b456 found two problems: nx-set-shas needs
actions: read to handle push events (only contents: read was granted,
so every push to main would fail the verify job), and paths-ignore at
the workflow-trigger level means no check-run is created for docs-only
changes - once Task 9 makes these required status checks, a docs-only
PR would get permanently stuck unmergeable. nx affected already makes
a docs-only run cheap on its own, so drop paths-ignore rather than work
around the required-checks interaction.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

If instead you're implementing this task fresh (no prior `paths-ignore` commit exists yet), fold Steps 1-3 into a single commit with the original message:

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: run only affected projects in verify

nx run-many always ran lint/test/build across all 5 projects regardless
of what changed. fetch-depth: 0 was already set up for nx affected but
nothing used it. Switch to affected + nrwl/nx-set-shas (with the
actions: read permission it needs for push events) so CI work scales
with the size of the change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Enable coverage on the four Angular-builder projects

**Files:**

- Modify: `apps/dashboard/project.json`
- Modify: `apps/landing/project.json`
- Modify: `libs/tokens/project.json`
- Modify: `libs/ui/project.json`

- [ ] **Step 1: `apps/dashboard/project.json` — add coverage to the `test` target**

Current:

```json
    "test": {
      "executor": "@angular/build:unit-test",
      "options": {
        "watch": false
      }
    },
```

New:

```json
    "test": {
      "executor": "@angular/build:unit-test",
      "options": {
        "watch": false,
        "coverage": true,
        "coverageReporters": ["lcov", "text-summary"]
      }
    },
```

- [ ] **Step 2: `apps/landing/project.json` — same change**

Apply the identical edit (same current block, same new block as Step 1) to `apps/landing/project.json`.

- [ ] **Step 3: `libs/tokens/project.json` — same change**

Current:

```json
    "test": {
      "executor": "@nx/angular:unit-test",
      "options": {
        "watch": false
      }
    }
```

New:

```json
    "test": {
      "executor": "@nx/angular:unit-test",
      "options": {
        "watch": false,
        "coverage": true,
        "coverageReporters": ["lcov", "text-summary"]
      }
    }
```

(This is the last key in the `targets` object for this file — no trailing comma.)

- [ ] **Step 4: `libs/ui/project.json` — same change**

Apply the identical edit as Step 3 (same executor, same shape, no trailing comma — last key in `targets`).

- [ ] **Step 5: Run each project's tests and confirm coverage is collected**

Run: `npx nx test dashboard`
Expected: test output includes a coverage summary table (statements/branches/functions/lines), and the run does not error on the new options (an error here almost always means a typo in the option name — re-check against Step 1's exact JSON).

Run: `npx nx test landing && npx nx test tokens && npx nx test ui`
Expected: same — each prints a coverage summary.

- [ ] **Step 6: Find where each project wrote its lcov report**

Run: `find . -name lcov.info -not -path '*/node_modules/*'`
Expected: at least 4 paths printed (one per project just run). Note the paths in the task output — they're not hardcoded anywhere in this plan on purpose (see "Verified facts" above), but Codecov's own auto-discovery (Task 6) needs at least one to exist to prove the setup works.

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/project.json apps/landing/project.json libs/tokens/project.json libs/ui/project.json
git commit -m "$(cat <<'EOF'
test: enable coverage on dashboard, landing, tokens, ui

Both @angular/build:unit-test and @nx/angular:unit-test share the same
options schema, so this is the same two-line addition on all four
projects. lcov output feeds the Codecov upload added in a later task.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Enable coverage on `mock-api`

**Files:**

- Modify: `libs/mock-api/vite.config.mts`

- [ ] **Step 1: Turn on coverage collection and add the lcov reporter**

Current `test.coverage` block in `libs/mock-api/vite.config.mts`:

```ts
    coverage: {
      reportsDirectory: '../../coverage/libs/mock-api',
      provider: 'v8' as const,
    },
```

New:

```ts
    coverage: {
      enabled: true,
      reportsDirectory: '../../coverage/libs/mock-api',
      provider: 'v8' as const,
      reporter: ['lcov', 'text-summary'],
    },
```

`@nx/vitest:test` (the executor `mock-api`'s `test` target uses) has no `coverage` flag of its own — it just runs Vitest against this config file, so `enabled: true` here is the only thing that turns coverage on. Without it, `reportsDirectory`/`provider` were already present but silently doing nothing.

- [ ] **Step 2: Run the test and confirm coverage now writes a real lcov file**

Run: `npx nx test mock-api && ls coverage/libs/mock-api/lcov.info`
Expected: the `ls` prints the file path (not "No such file or directory"). Before this change, that file did not exist because coverage was never enabled.

- [ ] **Step 3: Commit**

```bash
git add libs/mock-api/vite.config.mts
git commit -m "$(cat <<'EOF'
test(mock-api): actually enable coverage collection

The vite.config.mts coverage block set reportsDirectory and provider
but never enabled: true, so `nx test mock-api` was never collecting
coverage despite looking configured. Also add the lcov reporter so
Codecov has something to ingest.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Upload coverage to Codecov

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

- [ ] **Step 1: Add the Codecov upload step to the `verify` job**

In `.github/workflows/ci.yml`, the `verify` job's steps end with the `Run ${{ matrix.target }}` step (added in Task 2). Add one more step after it. Indentation below matches the real file exactly (6 spaces before each `-`, matching the other items in this `steps:` list) — shown as plain text rather than a `yaml` fence so it survives untouched:

```
      - name: Run ${{ matrix.target }}
        run: npx nx affected -t ${{ matrix.target }} --output-style=static

      - name: Upload coverage to Codecov
        if: matrix.target == 'test'
        uses: codecov/codecov-action@v5
        with:
          fail_ci_if_error: false
```

No `token:` input — this is a public repo, so Codecov accepts tokenless uploads. No `files:`/`directory:` input either: the action auto-discovers coverage reports across the repo, which sidesteps needing to know the exact per-project output path (see "Verified facts").

The `if: matrix.target == 'test'` means this step only runs on the `test` leg of the matrix — `lint` and `build` runs have no coverage to upload.

- [ ] **Step 2: Add the Codecov badge to `README.md`**

Current badge row:

```markdown
[![CI](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031.svg)](https://angular.dev)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2.svg)](https://github.com/sponsors/nguyenan97)
```

New:

```markdown
[![CI](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/nguyenan97/angular-saas-kit/graph/badge.svg)](https://codecov.io/gh/nguyenan97/angular-saas-kit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031.svg)](https://angular.dev)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2.svg)](https://github.com/sponsors/nguyenan97)
```

(The badge will show "unknown" until the first successful upload from a real CI run — expected, resolves itself once Task 7's PR runs.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "$(cat <<'EOF'
ci: upload coverage to Codecov

Tokenless upload (public repo), auto-discovers lcov reports from all 5
projects rather than hardcoding paths the test executors don't actually
expose. Badge will read "unknown" until the first CI run populates it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: CodeQL (Advanced setup)

**Files:**

- Create: `.github/workflows/codeql.yml`
- Modify: `README.md`

- [ ] **Step 1: Create the CodeQL workflow**

Create `.github/workflows/codeql.yml`:

```yaml
name: CodeQL

# Advanced setup (own workflow file) instead of GitHub's Default Setup,
# specifically so this can skip push-to-main and only run on PRs plus a
# weekly schedule - Default Setup does not expose that trigger control.
on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '17 3 * * 1' # Monday 03:17 UTC

permissions:
  contents: read
  security-events: write

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - uses: github/codeql-action/analyze@v3
        with:
          category: '/language:javascript-typescript'
```

JavaScript/TypeScript is interpreted, not compiled, so CodeQL analyzes source directly — no `npm ci`/build step needed here (unlike the `verify`/`typecheck`/`format` jobs).

- [ ] **Step 2: Add the CodeQL badge to `README.md`**

Extend the badge row from Task 5's edit:

```markdown
[![CI](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml)
[![CodeQL](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/codeql.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/nguyenan97/angular-saas-kit/graph/badge.svg)](https://codecov.io/gh/nguyenan97/angular-saas-kit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031.svg)](https://angular.dev)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2.svg)](https://github.com/sponsors/nguyenan97)
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/codeql.yml README.md
git commit -m "$(cat <<'EOF'
ci: add CodeQL scanning (advanced setup)

PR + weekly schedule only, deliberately not on every push to main - see
the design spec's CI-efficiency section.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Push, open a PR, verify every check goes green

This is the first point in this plan where anything leaves the local worktree. **Ask the user for explicit go-ahead before the push in Step 1** — do not run it as a matter of course just because the design was approved earlier.

**Files:** none (verification checkpoint).

- [ ] **Step 1: Push the branch**

Run: `git push -u origin features/project-purpose-ca3ca3`
Expected: `remote: Create a pull request ... branch 'features/project-purpose-ca3ca3' set up to track 'origin/features/project-purpose-ca3ca3'.`

- [ ] **Step 2: Open the PR**

Run:

```bash
gh pr create --base main --head features/project-purpose-ca3ca3 \
  --title "ci: security hardening (CodeQL, format gate, coverage, affected-only CI)" \
  --body "Implements docs/superpowers/specs/2026-09-05-ci-security-hardening-design.md. See that file for the full design."
```

Expected: prints the created PR URL.

- [ ] **Step 3: Watch the checks**

Run: `gh pr checks --watch`
Expected: eventually all of `lint`, `test`, `build`, `typecheck`, `format`, and `Analyze` (CodeQL) show as passing. If `format` fails, run `npx prettier --write .` locally, commit, and push again. If `test` fails on the coverage options, re-check Task 3/4's exact JSON/TS against what's in the failing project's files.

- [ ] **Step 4: Confirm the Codecov comment appears**

Run: `gh pr view --comments`
Expected: a comment from the `codecov` bot showing a coverage percentage (not an error message about missing reports).

- [ ] **Step 5: Note the exact CodeQL check name for Task 9**

Run: `gh api repos/nguyenan97/angular-saas-kit/commits/$(git rev-parse HEAD)/check-runs --jq '.check_runs[].name'`
Expected: a list of check-run names including `lint`, `test`, `build`, `typecheck`, `format`, and one for CodeQL. **Write down the CodeQL one exactly as printed** (it may be `Analyze` or `Analyze (javascript-typescript)` depending on how GitHub names single-language Advanced-setup runs) — Task 9 needs the literal string, and guessing wrong would silently make `main` unmergeable forever.

No commit in this task — it's verification only.

---

## Task 8: Enable Dependabot alerts and secret scanning

**Ask the user for explicit confirmation before running this task** — these are repository _settings_ changes (not files), called out separately in the design spec for exactly this reason.

**Files:** none (repo settings via API).

- [ ] **Step 1: Enable Dependabot vulnerability alerts**

Run: `gh api -X PUT repos/nguyenan97/angular-saas-kit/vulnerability-alerts`
Expected: no output, exit code 0 (this endpoint returns `204 No Content` on success).

- [ ] **Step 2: Enable Dependabot automated security fixes**

Run: `gh api -X PUT repos/nguyenan97/angular-saas-kit/automated-security-fixes`
Expected: no output, exit code 0.

- [ ] **Step 3: Enable secret scanning and push protection**

Run:

```bash
gh api -X PATCH repos/nguyenan97/angular-saas-kit --input - <<'EOF'
{
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
EOF
```

Expected: JSON response echoing the repo object; `.security_and_analysis.secret_scanning.status` and `.security_and_analysis.secret_scanning_push_protection.status` both read `"enabled"`.

- [ ] **Step 4: Verify**

Run: `gh api repos/nguyenan97/angular-saas-kit --jq '.security_and_analysis'`
Expected:

```json
{
  "secret_scanning": { "status": "enabled" },
  "secret_scanning_push_protection": { "status": "enabled" }
}
```

No commit — nothing in the working tree changed.

---

## Task 9: Branch protection on `main`

**Ask the user for explicit confirmation before running this task**, same reason as Task 8. Do this task _after_ Task 7's PR has actually run (so the exact CodeQL check name from Task 7 Step 5 is in hand — do not guess it here).

**Files:** none (repo settings via API).

- [ ] **Step 1: Apply branch protection**

Substitute the real CodeQL check name from Task 7 Step 5 for `<CODEQL_CHECK_NAME>` below, then run:

```bash
gh api -X PUT repos/nguyenan97/angular-saas-kit/branches/main/protection --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint" },
      { "context": "test" },
      { "context": "build" },
      { "context": "typecheck" },
      { "context": "format" },
      { "context": "<CODEQL_CHECK_NAME>" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

`enforce_admins: false` and `required_pull_request_reviews: null` are deliberate — see the design spec's Non-goals (solo maintainer; required reviews would lock the owner out of merging their own PRs).

Expected: JSON response describing the new protection rule, including a `required_status_checks.checks` array matching what was sent.

- [ ] **Step 2: Verify a direct push to `main` is now rejected**

From the main worktree (`D:/Projects/nguyenan97/angular-saas-kit`, already on `main`), attempt a trivial no-op push to confirm the rule is live — e.g. `git commit --allow-empty -m "test: confirm branch protection" && git push origin main`.
Expected: the push is rejected with a message like `remote: error: GH006: Protected branch update failed ... required status check ... is expected.` If it succeeds instead, protection did not apply — re-check Step 1's response for errors. Either way, **do not leave an empty commit **on `main`** — if the push unexpectedly succeeds, revert it (`git revert`, then push) rather than leaving a no-op commit in history.**

- [ ] **Step 3: Verify the PR from Task 7 can still merge**

Run: `gh pr checks` (on the Task 7 PR) once more, then, only after the user confirms, `gh pr merge --squash` (or whichever merge strategy the user prefers — this plan does not choose one on their behalf).

No commit — nothing in the working tree changed.

---

## Self-review notes

- **Spec coverage:** format gate → Task 1; CodeQL → Task 6; Dependabot alerts/security updates → Task 8; secret scanning + push protection → Task 8; Codecov → Task 5; branch protection → Task 9; `nx affected` + PR-funneled flow → Tasks 2 and 7 (`paths-ignore`, originally part of Task 2, was reverted after code review — see Task 2's amendment note — `nx affected`'s own no-op-on-zero-projects behavior covers the cost-control goal instead). All spec sections have a task.
- **Placeholder scan:** the one intentionally-unresolved value is `<CODEQL_CHECK_NAME>` in Task 9 — flagged in "Verified facts" and at Task 7 Step 5 as a deliberate verify-then-use step (the actual GitHub-assigned check name can't be known without a live run), not an oversight.
- **Type/name consistency:** `format` (script name, CI job name, and required-status-check context) is spelled identically everywhere it appears. `coverageReporters`/`reporter` option names match each executor's actual schema (plural key differs between the Angular builder (`coverageReporters`) and raw Vitest config (`reporter`) — this is intentional, not a typo, because they're two different tools' config surfaces).
