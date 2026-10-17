# A development process for agents and people: research and proposal

Date: 2026-10-17. Status: proposed, nothing applied. Follows
[the agent environment review](2026-10-17-agent-environment-review.md), which took the writing
habits from mattpocock/skills (#75, #76, #77). This one asks the larger question: what process
should carry this repository from a demo kit to code that can go to production and stay
maintainable for years, with AI agents doing much of the typing.

## The short version

The most-starred agent-workflow repositories agree on more than they disagree. Stripped of their
installers and slash commands, they share seven habits:

1. **Agree before you build.** A short written spec with concrete scenarios, reviewed by a person,
   before code (spec-kit, OpenSpec, BMAD, superpowers, addyosmani).
2. **Small vertical slices.** Plan in tasks of a few files each; one test, one implementation,
   one commit (superpowers, addyosmani, mattpocock).
3. **Tests are the proof, written first** for logic; scenarios for behaviour (all of them).
4. **A written quality bar with numbers, checked by machine**, and guarded against an agent
   lowering it to get green (addyosmani's `constraint-driven-development`).
5. **Human approval gates at phase boundaries**, with traceability from requirement to test
   (AWS AI-DLC, spec-kit).
6. **Review on separate axes**: correctness against the spec, standards, security, performance
   (addyosmani five-axis, mattpocock two-axis, Trail of Bits differential review).
7. **A learning loop**: a correction made once becomes a rule or a check, so it is never needed
   twice (AI-DLC learnings, mattpocock `retro`).

This repository already does 3, 5 (protected `main`, ADRs) and parts of 2, 4 and 7. The gaps that
matter for production are: no written quality bar in one place, no review discipline beyond CI,
specs that live as working notes rather than as checked artifacts, and a CI supply chain that
trusts mutable action tags. The proposal below closes those gaps with **project skills, one
`CONSTRAINTS.md`, a process page in the docs, and six CI controls**. It does **not** install any of
the frameworks wholesale.

## What was read

Primary sources, read through `gh api` on 2026-10-17. Star counts are from the same day.

| Repository                                                                | Stars | What it is                                                                                     | Take                                                                                                                   | Skip                                                             |
| ------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [obra/superpowers](https://github.com/obra/superpowers)                   | 301k  | Skills for brainstorm → plan → subagent-driven TDD → review → finish                           | Already installed for this user; keep it as the generic layer                                                          | Vendoring it                                                     |
| [anthropics/skills](https://github.com/anthropics/skills)                 | 182k  | Reference skills, including `skill-creator`                                                    | Skill format, evals for skills                                                                                         | Its document skills                                              |
| [github/spec-kit](https://github.com/github/spec-kit)                     | 142k  | Spec-Driven Development: constitution → specify → plan → tasks → implement → converge          | The **constitution** (project principles, versioned) and **converge** (implementation checked back against the spec)   | Python CLI, `.specify/` tree, phase rigidity                     |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)     | 108k  | 25 lifecycle skills: Define, Plan, Build, Verify, Review, Ship                                 | **Definition of Done**, **CONSTRAINTS.md** with the anti-weakening floor and ratchets, five-axis review, change sizing | Personas, the slash-command layer                                |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)             | 72k   | Lightweight SDD: a folder per change (proposal, spec deltas, design, tasks), archived on merge | **Requirements as `SHALL` + `WHEN/THEN` scenarios**, spec deltas per change                                            | The CLI and `openspec/` tree                                     |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 54k   | Agile AI-driven development with role agents                                                   | **Right-sized process**: small changes go straight to build, big ones get planning                                     | Role personas, installer                                         |
| [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows)     | 5k    | AWS AI-DLC: 5 phases, 33 stages, approval gates, audit trail, learning loop                    | **Verification gates** between phases, **two alternatives per architecture decision**, the **learning loop**           | 33 stages and a native runtime: far too heavy for one maintainer |
| [trailofbits/skills](https://github.com/trailofbits/skills)               | 8k    | Security research and audit skills                                                             | **Differential security review** (risk-first, blast radius), **agentic Actions audit**, supply-chain audit             | Exploit and binary tooling                                       |
| [mattpocock/skills](https://github.com/mattpocock/skills)                 | 295k  | Small composable engineering skills                                                            | Already applied in #75, #76                                                                                            |                                                                  |

Security and quality tooling checked for maintenance and latest release: gitleaks (30k, v8.30.1),
zizmor (6.7k, v1.31.1), OSV-Scanner (11k, v2.7.0), Semgrep (17k), OpenSSF Scorecard action
(v2.5.0), `actions/dependency-review-action` (v5.0.0), `step-security/harden-runner` (v2.22.1),
Syft and `anchore/sbom-action`, `@axe-core/playwright` (axe-core-npm v4.14.0), Stryker
(v10.0.0), fast-check (v4.10.2), `playwright-bdd` (v9.2.1).

## Where this repository stands

| Practice                   | Today                                                                                        | Evidence                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| DDD                        | Started: bounded contexts as Nx libraries with `layer:` tags, a pure domain, a shared kernel | ADR 0021, `libs/shared/kernel`, `libs/booking/domain`       |
| TDD                        | Practised in the domain libraries (Vitest, pure functions returning `Result`)                | `sales-order.spec.ts` and 4 more specs                      |
| BDD                        | Decided, not built: `apps/suite-e2e` with `playwright-bdd` and `.feature` files is Plan 4    | `docs/superpowers/specs/2026-10-17-suite-booking-design.md` |
| Specs and plans            | Written, approved, kept in `docs/superpowers/` as working material                           | the suite design and plan                                   |
| Decisions                  | 22 ADRs with alternatives and costs                                                          | `docs/adr`                                                  |
| Quality gates              | 7 required checks, bundle budgets, lint a11y rules, architecture and token checks            | ADR 0009, 0022                                              |
| Accessibility at runtime   | Storybook a11y panel by hand; no axe in the browser tests                                    | `apps/dashboard-e2e` has no axe                             |
| Coverage                   | Collected, no threshold                                                                      | `vite.config.mts` files                                     |
| SAST                       | CodeQL on PRs and weekly                                                                     | `.github/workflows/codeql.yml`                              |
| Secrets                    | GitHub secret scanning and push protection on                                                | repository settings                                         |
| Dependencies               | Dependabot (security updates on), `npm audit` by hand                                        | ADR 0010, `dependabot-triage`                               |
| CI supply chain            | Least-privilege `permissions:`; **actions pinned by tag, not SHA**                           | `uses: actions/checkout@v7`                                 |
| Actions linting            | None                                                                                         |                                                             |
| New-dependency gate on PRs | None                                                                                         |                                                             |
| Security headers           | None on the landing Node server                                                              | no CSP or HSTS in `apps/landing/src`                        |
| SBOM, provenance           | None; no package is published yet                                                            |                                                             |
| Review discipline          | CI plus the PR template                                                                      |                                                             |
| Learning loop              | ADRs and skills updated by hand                                                              |                                                             |

## The proposed process

One lifecycle, sized to the change, written down once in `docs/guide/development-process.md` and
pointed to from `AGENTS.md`. Each phase names what it produces, the skill that does it, and the
gate that ends it.

| Phase                                 | Produces                                                                                                    | Skill                                                                               | Gate                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| **Define**                            | A spec: goal, non-goals, requirements (`SHALL`), scenarios (`WHEN/THEN`), open questions                    | superpowers `brainstorming`, then project `write-spec` for the format and the place | The person approves the spec     |
| **Model** (bounded-context work only) | Terms in the context's `GLOSSARY.md`; an ADR when a decision is hard to reverse, with two alternatives      | project `domain-modeling`, `write-adr`                                              | Glossary and ADR in the same PR  |
| **Plan**                              | Tasks of a few files each, each with its acceptance check and the scenario it covers                        | superpowers `writing-plans`                                                         | The person approves the plan     |
| **Build**                             | Code and tests, slice by slice: a failing test first for logic; a `.feature` scenario first for a user flow | superpowers TDD, project `add-*` skills                                             | Each slice green and committed   |
| **Verify**                            | Every check in `CONSTRAINTS.md` green; scenarios traced to tests                                            | `verify`                                                                            | `npm run verify`, `format:check` |
| **Review**                            | Findings on four axes: spec, standards, security, accessibility                                             | project `review-change`                                                             | No unresolved blocking finding   |
| **Ship**                              | A PR with evidence and a merge-danger call; later, a release with provenance and SBOM                       | `open-pr`; later `release`                                                          | Required checks, human merge     |
| **Learn**                             | A correction turned into a rule, a check or a skill edit                                                    | project `retro`                                                                     | The edit lands in its own PR     |

**Right-sizing** (from BMAD and OpenSpec): a typo, a dependency bump or a one-file fix goes
straight to Build and Verify. A new page or component adds Plan. A new bounded context, a public
API or anything the person calls a feature goes through every phase.

### How DDD, TDD and BDD fit together

They are not three processes; they are three layers of one test pyramid, each already chosen in
this repository's design documents:

- **DDD** shapes the code: a context's `domain` library is plain TypeScript with no Angular and no
  RxJS, its operations are pure functions returning `Result`, and contexts talk through contracts
  and domain events (ADR 0021). The glossary names the concepts the code, the specs and the
  scenarios share.
- **TDD** drives the domain: unit tests at the aggregate's public functions, red before green. The
  domain is pure, so these tests are fast and need no TestBed.
- **BDD** drives the flows: a spec's `WHEN/THEN` scenarios become `Given/When/Then` steps in a
  `.feature` file run by `playwright-bdd` (planned for `apps/suite-e2e`). The scenario text is the
  acceptance check in the plan, so a requirement traces to a scenario, and a scenario to a test.

### `CONSTRAINTS.md`: the quality bar in one place

A root file, after addyosmani's `constraint-driven-development`, that every agent reads and that
nobody weakens to make a change pass. It records:

- **The floor**, checked on every diff at review: no new `@ts-ignore` or `eslint-disable`, no
  `.skip` or deleted test without a reason, no assertion removed from a kept test, no empty
  `catch`, no stub that throws "not implemented", no threshold lowered in this file.
- **Enforced constraints with their commands**: the seven required checks, `check:tokens`,
  `check:architecture`, `check:packages`, the bundle budgets, and the new controls below.
- **Ratchets**, measured and not allowed to fall: coverage of the domain libraries, initial
  bundle size.
- **Exceptions** with an owner and an expiry date: the accepted `braces` advisory (ADR 0020) is
  the first row.

`AGENTS.md` keeps one line: read `CONSTRAINTS.md` before writing code. The commands in it must
match `package.json` and CI; it is the reason column that makes it worth having.

## Security baseline

Controls that most serious open-source TypeScript projects now run, measured against what is
here. The rule for picking: prefer a check that is **external** (a database or a standard the agent
cannot argue with) and **diff-scoped** (it judges what this PR adds, not what `main` inherited).

| Control                                    | Status              | Proposal                                                                                                                                                                                                                                                            | Verdict                                                          |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| SAST (CodeQL)                              | Running             | Keep. Semgrep would mostly duplicate it for TypeScript.                                                                                                                                                                                                             | Keep                                                             |
| Secret scanning, push protection           | On                  | Keep. A gitleaks CI job would duplicate push protection on a personal repo.                                                                                                                                                                                         | Keep                                                             |
| **Actions pinned by commit SHA**           | Tags                | Pin every `uses:` to a full SHA with the tag as a comment; Dependabot already updates Actions monthly and understands SHA pins. The `tj-actions/changed-files` compromise (GHSA-mw4p-6x4p-x5m5, March 2025) rewrote tags that thousands of workflows trusted.       | **Adopt**                                                        |
| **zizmor** (Actions static analysis)       | None                | A CI job on workflow changes: template injection, excessive permissions, unpinned actions, `pull_request_target` misuse. It also keeps the SHA pins honest.                                                                                                         | **Adopt**                                                        |
| **Dependency review on PRs**               | None                | `actions/dependency-review-action` fails a PR that **adds** a dependency with a known vulnerability at `high` or above, or a licence outside an allow list (MIT, Apache-2.0, BSD, ISC, …). Diff-scoped, so the inherited `braces` advisory does not block every PR. | **Adopt** (a required check after two clean weeks, as `e2e` was) |
| **OpenSSF Scorecard**                      | None                | A weekly workflow uploading SARIF to code scanning, and a README badge. It scores branch protection, pinning, tokens, fuzzing and more, from outside.                                                                                                               | **Adopt**                                                        |
| OSV-Scanner, scheduled                     | `npm audit` by hand | A weekly scan of the lockfile, reported, not blocking; it reads more advisory sources than `npm audit`.                                                                                                                                                             | Worth it, low priority                                           |
| `harden-runner` (egress audit)             | None                | Audit mode on CI jobs shows every outbound call a build makes; block mode later. Adds a third-party action to every job.                                                                                                                                            | Explore                                                          |
| **Security headers** on the landing server | None                | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors` in the Node server, with a test. Needed before any real deployment.                                                                                                                       | **Adopt** (own PR, `landing`)                                    |
| **Accessibility at runtime**               | Storybook only      | `@axe-core/playwright` in the e2e suites: zero `critical` or `serious` violations per page, light and dark. External, like a vulnerability database.                                                                                                                | **Adopt**                                                        |
| SBOM and npm provenance                    | No release yet      | When `libs/ui` and `libs/tokens` publish: trusted publishing with provenance, and an SBOM (Syft) attached to the release.                                                                                                                                           | Later, with the release workflow                                 |
| Mutation testing (Stryker)                 | None                | On the domain libraries only, scoped to changed files: it tells whether the tests the agent wrote actually catch bugs.                                                                                                                                              | Explore after the suite lands                                    |
| Agentic workflows                          | None in CI          | If a Claude Code or other AI action is ever added to a workflow, audit it against Trail of Bits' `agentic-actions-auditor` rules first: no attacker-controlled input to the prompt, no `pull_request_target`.                                                       | Rule in `CONSTRAINTS.md`                                         |

## Project skills to add

All under `.claude/skills/`, each with `## Done when`, written to the conventions of ADR 0014 and
the earlier review. Generic discipline stays in superpowers; these say how it is done **here**.

| Skill                          | Invocation | What it adds over the generic layer                                                                                                                                                                                                                                                                         |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `write-spec`                   | model      | Where a spec goes, its sections, `SHALL` requirements and `WHEN/THEN` scenarios that become `.feature` files, the right-sizing table                                                                                                                                                                        |
| `domain-modeling`              | model      | One `GLOSSARY.md` per bounded context (`libs/<context>/GLOSSARY.md`), the layer rules of ADR 0021, events and `Result`, when a decision needs an ADR with two alternatives                                                                                                                                  |
| `review-change`                | user       | Four axes as separate passes, each with its sources: spec (the approved spec and plan), standards (`AGENTS.md`, `CONSTRAINTS.md` floor), security (Trail of Bits' risk-first triggers: input, auth, `innerHTML`, new dependency, workflow change), accessibility. Severity labels; no reranking across axes |
| `retro`                        | user       | After a session: what went wrong, and the cheapest durable fix, in order of preference: a check, a skill edit, an `AGENTS.md` line                                                                                                                                                                          |
| `security-review` is not added |            | Claude Code ships `/security-review`; `review-change`'s security axis points to it for depth                                                                                                                                                                                                                |

## What not to do

- **Install spec-kit, OpenSpec, BMAD or AI-DLC as frameworks.** Each brings its own folders,
  runtime (Python, Bun or a native binary) and vocabulary, which would compete with `docs/adr`,
  `docs/superpowers` and the skills here. Their ideas fit in four skills and one file.
- **Add role personas** (PM, architect, QA agents). One maintainer and one agent; the review axes
  give the separation that matters.
- **Gate on everything at once.** A new check starts as a report, becomes required after a clean
  run, as `e2e` did (ADR 0009).
- **Claim production readiness.** The kit has no backend, no auth and no observability. The process
  makes the code ready for those; the docs must keep saying they are not built.

## Proposed rollout

| PR    | Scope                  | Contents                                                                                                                                                                                                              | ADR                                          |
| ----- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1     | `repo`                 | `CONSTRAINTS.md`; `docs/guide/development-process.md`; skills `write-spec`, `domain-modeling`, `review-change`, `retro`; `AGENTS.md` and `CLAUDE.md` pointers; `libs/booking/GLOSSARY.md` seeded from the domain code | 0023: the development process                |
| 2     | `ci`                   | Actions pinned by SHA; zizmor job; dependency review; Scorecard workflow and badge                                                                                                                                    | 0024: CI supply-chain controls (amends 0009) |
| 3     | `dashboard`, `landing` | axe in both e2e suites; security headers on the landing server with a test                                                                                                                                            | none, or an amendment                        |
| Later |                        | OSV-Scanner weekly, harden-runner audit, Stryker on the domain, release workflow with provenance and SBOM, `playwright-bdd` with Plan 4                                                                               | as each lands                                |

Each PR is verified, opened, checked green and merged the way #75 to #77 were.
