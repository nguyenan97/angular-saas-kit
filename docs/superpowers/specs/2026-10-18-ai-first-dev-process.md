# An AI-first development process

Date: 2026-10-18. Status: approved (self-review below, autonomous mode). Builds on
[the audit](2026-10-18-audit.md), [the SDLC review](2026-10-17-sdlc-and-security-review.md) and
[the agent environment review](2026-10-17-agent-environment-review.md). Plan:
[`../plans/2026-10-18-ai-first-dev-process.md`](../plans/2026-10-18-ai-first-dev-process.md).

## Goal

Turn the process this repository already has (sizing, `CONSTRAINTS.md`, twelve skills, seven
required checks) into a lifecycle an agent can run end to end without waiting for a person at each
phase, while every phase still ends at a gate a machine or an independent reviewer checks. A person
reviews afterwards, from the pull request, the ADRs and a written report, and can revert any
change. The aim is a codebase that stays maintainable for years and can grow a backend, auth and
operations without changing how work is done.

## Non-goals

- Building a backend, authentication, observability or a release pipeline. The lifecycle names
  where they go; it does not claim them.
- Installing a framework (spec-kit, OpenSpec, BMAD, AI-DLC) or vendoring another skill set.
- Changing repository settings, branch protection or secrets. What needs them is listed for the
  person in the report.
- Restructuring the libraries. The audit found no structural problem that a refactor would fix
  (audit §2).

## Research

Read through `gh api` on 2026-10-18. Stars and last push are from that day. A repository with no
licence, or no push in twelve months, was dropped (bottom of the table).

| Source                                                                                                                 | Stars, last push | Licence      | Idea taken                                                                                                                                                                                                                                                                                   | Why it fits, or what was left                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [mattpocock/skills](https://github.com/mattpocock/skills)                                                              | 295,173, 10-13   | MIT          | Skills split into **user-invoked** and **model-invoked**, listed in a README by that split; a skill calls another by naming it; **tracer-bullet tickets with blocking edges**; **expand–contract** for wide refactors; TDD at **agreed seams**; a PR body of summary, evidence, merge danger | The organising model for `.claude/skills/README.md`, `plan-tasks`, `refactor`, `test-first`. Left: the plugin installer, `agents/openai.yaml` (one more file per skill for one vendor) |
| [agentskills/agentskills](https://github.com/agentskills/agentskills) (the spec)                                       | 26,246, 08-09    | Apache-2.0   | Frontmatter is `name` (matches the folder, lowercase-hyphen, ≤ 64), `description` (≤ 1,024), and only `license`, `compatibility`, `metadata`, `allowed-tools` besides; `skills-ref` rejects other fields                                                                                     | Adopted as a machine check. `disable-model-invocation` moves to `.claude/settings.json` `skillOverrides`, Claude Code's own place for it                                               |
| [obra/superpowers](https://github.com/obra/superpowers)                                                                | 301,251, 10-10   | MIT          | Brainstorm → plan → subagent-driven TDD → review → finish; a reviewer that is not the writer                                                                                                                                                                                                 | The generic layer stays with the agent's tooling; the repo skills say how it is done here. **Independent review** adopted                                                              |
| [github/spec-kit](https://github.com/github/spec-kit)                                                                  | 141,683, 10-16   | MIT          | A constitution (here: `CONSTRAINTS.md`); a spec checklist that the agent runs on its own spec before planning; tasks marked `[P]` when they can run in parallel                                                                                                                              | Self-review checklist and parallel marks adopted. Left: the Python CLI and `.specify/` tree                                                                                            |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)                                                  | 107,873, 10-13   | MIT          | Definition of Done, change sizing, five-axis review, the anti-weakening floor                                                                                                                                                                                                                | Already in `CONSTRAINTS.md` (ADR 0023). Adds a **performance** look to the standards axis                                                                                              |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)                                                          | 72,266, 10-17    | MIT          | `SHALL` requirements with `WHEN/THEN` scenarios; a change folder archived on merge                                                                                                                                                                                                           | Scenarios already in `write-spec`. Left: the CLI                                                                                                                                       |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)                                              | 54,268, 10-18    | MIT          | Scale-adaptive planning: a quick flow for small changes, full planning for large                                                                                                                                                                                                             | The sizing table keeps that. Left: role personas                                                                                                                                       |
| [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows)                                                  | 5,370, 10-18     | MIT-0        | Phases Inception → Construction → Operations; a gate at each phase boundary; an audit trail; NFRs and two alternatives per design                                                                                                                                                            | The lifecycle's phase names and gates. Left: 33 stages and its runtime                                                                                                                 |
| [trailofbits/skills](https://github.com/trailofbits/skills)                                                            | 7,623, 10-15     | CC-BY-SA-4.0 | Differential security review: start from what the diff can reach (input, auth, storage, network, workflows), rate by blast radius                                                                                                                                                            | The `security-review` skill's method, summarised and cited, not copied                                                                                                                 |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)                                    | 35,903, 10-15    | MIT          | Survey of skill sets: most ship one skill per recurring task with a short trigger description                                                                                                                                                                                                | Confirms the shape; nothing new to take                                                                                                                                                |
| [agentsmd/agents.md](https://github.com/agentsmd/agents.md)                                                            | 24,976, 09-10    | MIT          | One `AGENTS.md`, nested files for subprojects                                                                                                                                                                                                                                                | Already the rule (ADR 0014)                                                                                                                                                            |
| [conventional-commits/conventionalcommits.org](https://github.com/conventional-commits/conventionalcommits.org)        | 9,309, 03-11     | MIT          | The commit grammar                                                                                                                                                                                                                                                                           | Already enforced locally; the PR title is the gap (audit F3)                                                                                                                           |
| [adr/madr](https://github.com/adr/madr)                                                                                | 2,564, 08-28     | MIT or CC0   | Decision drivers, considered options, decision outcome, consequences, **confirmation** (how compliance is checked)                                                                                                                                                                           | Adds optional **Decision drivers** and **Confirmation** sections to the template                                                                                                       |
| [arc42/arc42-template](https://github.com/arc42/arc42-template)                                                        | 1,310, 10-15     | CC-BY-SA-4.0 | Twelve sections; the short form keeps goals, constraints, context, solution strategy, building blocks, quality requirements, risks                                                                                                                                                           | A one-page `docs/architecture/overview.md` that links the C4 pages and ADRs, not twelve files                                                                                          |
| [ddd-crew/ddd-starter-modelling-process](https://github.com/ddd-crew/ddd-starter-modelling-process)                    | 6,066, 08-23     | CC-BY-SA-4.0 | Align → discover → decompose → connect → strategize → organise → define → code                                                                                                                                                                                                               | Domain modeling already follows ADR 0021; the skill gets an Example Mapping step                                                                                                       |
| [nrwl/nx](https://github.com/nrwl/nx)                                                                                  | 29,415, 10-18    | MIT          | Library types feature / ui / data-access / util; `enforce-module-boundaries` with tags                                                                                                                                                                                                       | Already the rule (ADR 0015, 0021); every project must carry tags (audit F11)                                                                                                           |
| [vitalets/playwright-bdd](https://github.com/vitalets/playwright-bdd)                                                  | 808, 10-16       | MIT          | Gherkin features run by Playwright                                                                                                                                                                                                                                                           | Still the planned BDD runner for the suite; not added until a flow needs it                                                                                                            |
| [stryker-mutator/stryker-js](https://github.com/stryker-mutator/stryker-js)                                            | 3,236, 10-10     | Apache-2.0   | Mutation testing                                                                                                                                                                                                                                                                             | Named in `test-first` as the way to judge a domain test suite; not wired yet                                                                                                           |
| [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)                                                              | 30,074, 09-30    | MIT          | Secret scanning of commits with generic rules (entropy, key-like assignments)                                                                                                                                                                                                                | Adopted in CI: push protection knows only partner formats                                                                                                                              |
| [google/osv-scanner](https://github.com/google/osv-scanner)                                                            | 11,200, 10-17    | Apache-2.0   | Lockfile scan against OSV, which aggregates GitHub, npm and other advisory sources                                                                                                                                                                                                           | Adopted on a schedule, reported                                                                                                                                                        |
| [CycloneDX/cyclonedx-node-npm](https://github.com/CycloneDX/cyclonedx-node-npm)                                        | 151, 10-17       | Apache-2.0   | SBOM from the npm lockfile                                                                                                                                                                                                                                                                   | Adopted on `main` as an artifact                                                                                                                                                       |
| [zaproxy/action-baseline](https://github.com/zaproxy/action-baseline)                                                  | 373, 10-12       | Apache-2.0   | Passive DAST against a running site                                                                                                                                                                                                                                                          | Adopted on a schedule, against the built Pages site served locally                                                                                                                     |
| [semgrep/semgrep](https://github.com/semgrep/semgrep)                                                                  | 17,110, 10-16    | LGPL-2.1     | SAST rules                                                                                                                                                                                                                                                                                   | Not adopted: CodeQL covers TypeScript here, and a second SAST would mostly duplicate it                                                                                                |
| [ossf/scorecard](https://github.com/ossf/scorecard)                                                                    | 5,763, 10-17     | Apache-2.0   | Supply-chain score                                                                                                                                                                                                                                                                           | Already weekly (ADR 0024); 6.2 today                                                                                                                                                   |
| [OWASP/ASVS](https://github.com/OWASP/ASVS)                                                                            | 3,687, 10-15     | CC-BY-SA-4.0 | Verification requirements by level                                                                                                                                                                                                                                                           | `security-review` maps to ASVS chapters when a backend or auth arrives                                                                                                                 |
| [OWASP Top 10 for LLM Applications](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications) | 1,454, 08-05     | CC-BY-SA-4.0 | Prompt injection, excessive agency                                                                                                                                                                                                                                                           | Already a floor rule: no AI agent in a workflow fed by issues, comments or forks                                                                                                       |

Dropped by the rule: [anthropics/skills](https://github.com/anthropics/skills) (181,808 stars, no
repository licence; the spec repository above replaces it), [google/eng-practices](https://github.com/google/eng-practices)
(archived 2024-09), [structurizr/java](https://github.com/structurizr/java) (archived),
[tomastrajan/angular-ngrx-material-starter](https://github.com/tomastrajan/angular-ngrx-material-starter)
(last push 2022), [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)
(no licence), [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
(CC BY-NC-ND: nothing can be adapted).

Practices without a repository, read from their primary pages: trunk-based development (short-lived
branches, small merges; trunkbaseddevelopment.com), the C4 model (c4model.com: context, container,
component, dynamic, deployment), Diátaxis (diataxis.fr: tutorial, how-to, reference,
explanation), the testing trophy (mostly integration tests, static checks at the base), Example
Mapping (rules, examples, questions on cards before a story is built), Playwright's best practices
(user-facing locators, web-first assertions, isolated tests), STRIDE, fitness functions (a test
for an architectural property), SLSA and the OpenSSF Best Practices badge (both need a release or
a form the maintainer fills in).

## The gaps, by phase

| Phase           | Today                                                     | Gap                                                                                    | Closed by        |
| --------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| Inception       | `write-spec`                                              | Only a person approves; no assumptions, decision log or NFRs                           | R2, R3           |
| Domain modeling | `domain-modeling`, glossaries                             | No Example Mapping                                                                     | R5               |
| Solution design | ADRs, C4                                                  | No skill: no NFRs with numbers, no threat model, no evolution path for what is missing | R5               |
| Plan            | A plan in `docs/superpowers/plans/`, approved by a person | No skill: task size, Definition of Ready/Done, dependency graph, parallel marks        | R4               |
| Build           | `add-*` skills, "test first"                              | No test-first skill: seams, characterization tests, what jsdom cannot prove            | R5               |
| Acceptance      | Playwright e2e, axe                                       | Scenario-to-test trace not written down                                                | R5               |
| Review          | `review-change`                                           | Not required to be independent; security axis points to a vendor command               | R6               |
| Security gate   | CodeQL, zizmor, dependency review, push protection        | No CI secret scan, OSV, SBOM, DAST; no pre-PR security skill                           | R7               |
| Release         | None (nothing published)                                  | Not applicable yet                                                                     | named, not built |
| Operate         | None (no production deployment beyond Pages)              | Not applicable yet                                                                     | named, not built |
| Learn           | `retro`                                                   | Report not written anywhere durable                                                    | R6               |
| All             | `verify`, `CONSTRAINTS.md`                                | Instructions not checked by machine (F4–F6); PR title unchecked (F3)                   | R1, R8           |

## Requirements

### Requirement: Instructions are checked by machine

`npm run verify` SHALL fail when a relative link in an instruction or docs file is dead, a named
`npm run` script or Nx project does not exist, an ADR's status differs from its index row, a skill's
frontmatter breaks the Agent Skills spec, or a skill list omits a skill.

#### Scenario: A skill names a removed script

- **WHEN** a skill says `npm run check:colours` and `package.json` has no such script
- **THEN** `npm run check:docs` exits non-zero and names the file and line

#### Scenario: A non-standard frontmatter field

- **WHEN** a `SKILL.md` carries `disable-model-invocation`
- **THEN** `npm run check:docs` names the field and the skill

### Requirement: One lifecycle with a gate per phase

`docs/guide/development-process.md` SHALL describe each phase with its input, its artifact in the
repository, its skill, its gate and its exit condition, for Inception, Domain modeling, Solution
design, Plan, Build, Acceptance, Review, Security gate, Release, Operate and Learn, and SHALL mark
Release and Operate as not yet applicable.

#### Scenario: An agent looks up what ends the Plan phase

- **WHEN** an agent reads the Plan row
- **THEN** it finds the artifact path (`docs/superpowers/plans/`), the skill (`plan-tasks`) and a
  gate it can check itself

### Requirement: An autonomous mode with fixed limits

The process SHALL define an autonomous mode: when it may be used (the person grants it in words, for
a named task), which gates stay mandatory, and which limits no instruction lifts.

#### Scenario: Autonomous mode and a red check

- **WHEN** an agent in autonomous mode has a required check still red after three fixes
- **THEN** it leaves the pull request unmerged or as a draft, records why in its report, and moves
  to a task that does not depend on it

### Requirement: Plans are made of small, checkable tasks

The `plan-tasks` skill SHALL produce tasks that each touch one to five files, fit in one agent
session, name the scenario they cover, the command that proves them and the tasks they depend on,
and are marked parallel when they share no file and no dependency.

#### Scenario: A task too large

- **WHEN** a task touches more than two projects, needs more than one architectural decision, or has
  no command that proves it
- **THEN** the skill splits it before the plan is written

### Requirement: Skills for each phase without one

The repository SHALL have skills for planning (`plan-tasks`), test-first building (`test-first`),
solution design (`solution-design`), refactoring (`refactor`) and security review
(`security-review`), each with when to use it, when not to, steps and a `## Done when` list.

#### Scenario: Refactoring without a test

- **WHEN** an agent refactors code that no test covers
- **THEN** the `refactor` skill has it write a characterization test first, and the PR changes no
  behaviour

### Requirement: Review is independent

`review-change` SHALL be run by an agent or session other than the one that wrote the change, and
no change SHALL merge with a blocking finding open.

#### Scenario: Self-review only

- **WHEN** the only review of a branch is by the session that wrote it
- **THEN** the PR body says so and the change is not merged in autonomous mode

### Requirement: Security scans for every project

The repository SHALL scan for secrets on every pull request, scan the lockfile against OSV and
produce an SBOM on a schedule, and run a passive DAST baseline against the built site, each recorded
in a table with where it runs, whether it blocks and who acts on it.

#### Scenario: A secret in a pull request

- **WHEN** a pull request adds a high-entropy credential that push protection does not know
- **THEN** the secret-scan job fails on that pull request

### Requirement: The pull request title is linted

CI SHALL fail a pull request whose title is not a Conventional Commit with a scope from `AGENTS.md`.

#### Scenario: A title with a wrong scope

- **WHEN** a pull request is titled `docs(readme): fix a link`
- **THEN** the title check fails and says which rule

## Design

The work lands as the pull requests in the plan. In outline:

- **`scripts/check-docs.mjs`** (R1), with a `node:test` suite in `scripts/check-docs.test.mjs`
  run by a new `test:scripts`, both in `verify` and on CI's `lint` leg, like the other checks.
- **`.claude/settings.json`** gets `skillOverrides` set to `user-invocable-only` for `open-pr`,
  `dependabot-triage`, `review-change` and `retro`, replacing the frontmatter field. Other agents
  read the skill's own "When not to use" instead.
- **`.claude/skills/README.md`**: the index, by phase and by invocation (mattpocock's split).
- **ADR 0025** supersedes 0023: the lifecycle, self-checked gates and autonomous mode.
  **ADR 0026**: the security scans (amends 0024's picture).
- **CI**: a `pr-title` job (commitlint on the title, passed through an environment variable, not
  interpolated into the script); a `gitleaks` job; a scheduled `Security scans` workflow with OSV,
  an SBOM and the ZAP baseline. None is made required here: that is a repository setting.
- **Docs**: an arc42-short `docs/architecture/overview.md`; a Diátaxis map in `docs/README.md`.
- **Dependencies**: drop Jest; override `nx`'s `undici` to 7.30.1.
- **Performance**: `@defer (on viewport)` for the landing page's sections below the fold.

Rejected: a separate `git-workflow` skill (its steps are `open-pr`'s; two would overlap); a
`tdd` and a `bdd` skill (one `test-first` covers both levels in this repo); a skill per scan (one
`security-review` routes to them); making new checks required (a setting, and ADR 0009 earns
required status with a clean run).

## Testing

- R1: `scripts/check-docs.test.mjs` builds fixture trees that break each rule and asserts the
  message; the real tree passes.
- R7, R8: each new CI job is shown red once, on a throwaway pull request with a planted fake secret
  or a bad title, then closed.
- R2–R6: each new or changed skill is run on a real task in this work and the result recorded in
  the report (does the agent do what the skill says, and would it have without it).
- Perf: initial bundle before and after, from the build output, in the PR body.

## Assumptions

- A1. The prompt that started this work is the person's grant of autonomous mode for it, including
  merging green pull requests. Later work needs its own grant.
- A2. Claude Code's `skillOverrides` (`user-invocable-only`) gives the same protection as
  `disable-model-invocation` (from the Claude Code skills documentation, read 2026-10-18).
- A3. A new CI job may land as a non-required check. Making it required is a branch-protection
  change for the person.
- A4. `undici` 7.30.1 is compatible with `nx` 23.3.0's pinned 7.29.0 (same major, a fix release).
- A5. ZAP's baseline against `npm run pages:preview` approximates the Pages site; GitHub's own
  headers differ, so findings about headers on Pages are informational.
- A6. "About 400 lines" excludes generated files, the lockfile and the working documents in
  `docs/superpowers`.

## Decision log

| #   | Decision                                                                              | Why                                                                                            | Source                                    |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| D1  | One script, `check-docs`, for links, commands, ADRs and skills                        | Same inputs (Markdown files), one walk; a second script would duplicate the walk               | audit F4–F6                               |
| D2  | Move `disable-model-invocation` to `.claude/settings.json`                            | The spec rejects the field; Claude Code supports the same effect in its settings               | agentskills spec; Claude Code skills docs |
| D3  | Five new skills, none deleted, none merged                                            | Each closes a phase gap (table above); no two existing skills overlap (audit §1)               | audit §1                                  |
| D4  | `plan-tasks` separate from `write-spec`                                               | A plan is a different artifact with its own gate; mattpocock and spec-kit both separate them   | mattpocock `to-tickets`, spec-kit `tasks` |
| D5  | Supersede ADR 0023 rather than amend it                                               | Its central rule (a person approves each spec and plan) changes                                | ADR rule in `write-adr`                   |
| D6  | PR title check in CI with commitlint, not a third-party action                        | commitlint is already a dependency with the repo's config; one fewer action to pin             | audit F3                                  |
| D7  | gitleaks on PRs; OSV, SBOM and ZAP on a schedule                                      | Secrets must be caught before merge; the rest are slow or judge the whole tree, so they report | ADR 0024's diff-scoped rule               |
| D8  | No Semgrep                                                                            | CodeQL already analyses TypeScript on every PR with 0 open alerts                              | audit security table                      |
| D9  | Drop Jest instead of accepting the `sprintf-js` advisory                              | Unused; removing it removes the only path to the advisory                                      | audit F2                                  |
| D10 | `@defer (on viewport)` on the landing sections, not a bigger budget                   | 348 kB of a 350 kB warning; deferring below-the-fold content is Angular's recommended lever    | audit F10                                 |
| D11 | PR size: about 400 changed lines excluding generated files and working documents      | Review quality drops with size; the figure is the common one in review studies and the prompt  | prompt; small-CL practice                 |
| D12 | Tag `dashboard-e2e` (`type:e2e`, `scope:dashboard`) and require tags on every project | An untagged project escapes every boundary rule                                                | audit F11                                 |

## Self-review

The checklist `write-spec` now carries, applied to this spec:

- [x] Goal says what changes, for whom, and why now.
- [x] Every requirement is one `SHALL` with at least one `WHEN/THEN` scenario.
- [x] Every requirement traces to an audit finding or a research row.
- [x] Nothing claims a backend, auth, observability or a published package.
- [x] Every decision is in the log with a source; the hard-to-reverse ones get ADRs (D5, D7).
- [x] Open questions: none left; each was settled as an assumption above.
