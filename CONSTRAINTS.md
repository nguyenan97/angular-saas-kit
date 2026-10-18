# Constraints

The quality bar for every change, in one place. Each row names the command that gives the verdict;
a rule with no command is an aspiration and does not belong here. Agents and people read this before
writing code, and **nobody weakens it to make a change pass**: tightening a constraint is a normal
change, loosening one needs its reason in the PR and, if it is lasting, an ADR.

The process this bar belongs to is in [docs/guide/development-process.md](docs/guide/development-process.md);
the reasoning is in [ADR 0023](docs/adr/0023-a-development-process-with-a-written-quality-bar.md),
which set up this file, [ADR 0025](docs/adr/0025-an-ai-first-lifecycle-with-self-checked-gates.md)
and [ADR 0027](docs/adr/0027-the-agent-decides-and-merges-by-default.md).

## The floor

Checked on every diff, at review (`review-change`), because no tool sees all of it:

- No new `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `istanbul ignore` or `v8 ignore`.
- No `.skip`, `.only` or deleted test, and no assertion removed from a test that stays, without the
  reason in the commit message.
- No empty `catch`, and no stub that throws "not implemented" or a `TODO` where the code should be.
- No secret, token or key in source, tests or fixtures (push protection rejects the known kinds;
  the rest is review).
- No threshold, budget or rule in this file, a lint config or a `vite.config.mts` lowered.
- No AI coding agent in a GitHub workflow that takes input from issues, comments or forks
  (`pull_request_target`, `issue_comment`): attacker text would reach its prompt.

## Enforced

| Dimension                | Rule                                                                                                           | Checked by                                  | Runs                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| Lint                     | No errors, a11y template rules included                                                                        | `npm run lint`                              | `verify`, CI `lint`      |
| Module boundaries        | `type:`, `scope:`, `layer:` tags (ADR 0015, 0021)                                                              | `npm run lint`                              | `verify`, CI `lint`      |
| Types                    | No errors, specs included                                                                                      | `npm run typecheck`                         | `verify`, CI `typecheck` |
| Tests                    | All pass                                                                                                       | `npm test`                                  | `verify`, CI `test`      |
| Domain coverage          | `shared-kernel`, `booking-domain`: lines ≥ 98%, branches ≥ 95%, functions 100%                                 | `thresholds` in their `vite.config.mts`     | `npm test`               |
| Build and bundle         | Builds; each app's initial bundle under 500 kB (warning at 350 kB), a component's styles under 8 kB            | budgets in `project.json`, `npm run build`  | `verify`, CI `build`     |
| Formatting               | Prettier                                                                                                       | `npm run format:check`                      | CI `format`              |
| Browser flows            | Playwright, Chromium; the suite's flows as Gherkin through `playwright-bdd`                                    | `npx nx e2e dashboard-e2e`, `suite-e2e`     | CI `e2e`                 |
| Accessibility at runtime | Every dashboard and suite page, light and dark: no critical or serious axe violation against WCAG 2.2 A and AA | `accessibility.spec.ts` in both e2e apps    | CI `e2e`                 |
| Security headers         | The landing server sends CSP (base, object, framing, forms), HSTS, nosniff, referrer and permissions policies  | `security-headers.spec.ts` in `landing`     | `verify`, CI `test`      |
| Architecture map         | The C4 container map and the workspace projects table match the code                                           | `npm run check:architecture`                | `verify`, CI `lint`      |
| Docs and instructions    | Links resolve, named scripts and projects exist, ADR index matches, skills follow the Agent Skills spec        | `npm run check:docs`                        | `verify`, CI `lint`      |
| Colours                  | Semantic tokens only (ADR 0022)                                                                                | `npm run check:tokens`                      | `verify`, CI `lint`      |
| Signals                  | No decorator inputs, outputs or queries; no opting out of OnPush                                               | `npm run lint`                              | `verify`, CI `lint`      |
| Packages                 | Built `tokens` and `ui` declare what they import and ship what they promise                                    | `npm run check:packages`                    | `verify`, CI `build`     |
| Docs                     | No dead link                                                                                                   | `npm run docs:build`                        | CI `Build site`          |
| SAST                     | No new CodeQL alert                                                                                            | CodeQL                                      | PRs, weekly              |
| Secrets                  | Known secret formats rejected on push; generic keys and private keys found in new commits                      | GitHub push protection; gitleaks (ADR 0026) | every push; PRs, `main`  |
| Dependencies             | Install resolves strictly; no `--legacy-peer-deps`                                                             | `npm ci`                                    | CI, every job            |
| New dependencies         | Nothing added at `high` or above; licence on the allow list                                                    | dependency review (ADR 0024)                | PRs                      |
| Workflows                | Every action pinned to a SHA; no credentials left in a checkout; no template injection or broad permissions    | zizmor (ADR 0024)                           | PRs, `main`              |
| Commits                  | Conventional Commits, scopes from `AGENTS.md`                                                                  | commitlint                                  | commit hook              |
| Pull request title       | The same rules: it becomes the squash commit on `main`                                                         | commitlint, CI `pr title` (not required)    | PRs (not Dependabot)     |

`npm run verify` runs the rows marked `verify`. The required checks on `main` are listed in
[ADR 0009](docs/adr/0009-strict-ci-gates-and-a-protected-main.md).

## Measured, not yet enforced

| Metric                  | Today                           | Direction                 |
| ----------------------- | ------------------------------- | ------------------------- |
| Coverage, apps and `ui` | collected, not recorded         | record before enforcing   |
| OpenSSF Scorecard       | measured weekly from 2026-10-17 | must not fall             |
| OSV advisories          | reported weekly from 2026-10-18 | none above the exceptions |

## Exceptions

| Rule             | Where                                              | Reason                                                                                                          | Owner       | Review by  |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| `npm audit` high | `braces` 3.0.3 through Storybook's webpack builder | No fixed release; dev-only, not shipped ([ADR 0020](docs/adr/0020-storybook-on-the-angular-webpack-builder.md)) | @nguyenan97 | 2027-01-17 |

An exception has an owner and a date. On the date it is fixed, renewed with a reason, or turned
into an ADR.
