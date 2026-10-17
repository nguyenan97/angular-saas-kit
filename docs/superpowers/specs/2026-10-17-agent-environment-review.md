# Agent environment review: what to take from mattpocock/skills

Phases 1 and 2 of [the prompt](../plans/2026-10-17-adopt-mattpocock-skills-prompt.md). Nothing has
been changed yet. Sources were read from `mattpocock/skills` at its 2026-10-13 head (MIT) and from
this repo at `8212f07`.

## The short version

mattpocock/skills is worth learning from mostly for **how it writes and maintains agent
instructions**, not for its skill catalogue. Its generic skills (grilling, tdd, diagnosing-bugs,
prototype, handoff) overlap with the superpowers plugin already in use here and belong in a
per-developer plugin install, not in this repo. What transfers is a handful of disciplines:

- a mechanical rule gets a check, not a sentence (`retro`);
- every always-loaded line must change behaviour (the no-op test, `writing-for-agents`);
- one source of truth per meaning, because copies drift;
- every step ends on a checkable completion criterion;
- skills with outward effects are reachable only when typed.

This repo already follows several of these better than most (ADR 0014, `check:architecture`,
`theme-init.spec.ts` guarding a three-way copy). The review found real drift that proves the point:
`verify` says five checks are required, `open-pr`, `AGENTS.md` and ADR 0009 say seven.

## Candidates

Ranked by value. Verdicts: **Adopt** (take as is), **Adapt** (take the idea, reshape it), **Skip**.

| #   | Idea                                                            | Source                                                   | Evidence here                                                                                                                                                                                                                                                                                           | Cost | Verdict                                               |
| --- | --------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------- |
| 1   | Mechanical rule → deterministic check                           | `retro` (Coding standards)                               | "Components never name a colour" is in `AGENTS.md`, `CONTRIBUTING.md:98`, two skills and the PR template, and enforced by none of them: `eslint.config.mjs` has no such rule. OnPush and signal inputs are also unenforced, though the code complies today (34 of 34 components OnPush, no `@Input()`). | S    | **Adopt**                                             |
| 2   | Fix drift by one source of truth                                | `writing-for-agents` (Pruning)                           | `.claude/skills/verify/SKILL.md:8` "five of them are required"; `open-pr/SKILL.md:43` and ADR 0009:43 say seven. The non-negotiable rules are written out five times (see #1).                                                                                                                          | S    | **Adopt**                                             |
| 3   | Completion criteria per step                                    | `writing-for-agents`, `setup-ts-deep-modules`            | None of the eight skills has a "Done when". Several end in "Finish: run verify, then open-pr", which is a next step, not a criterion.                                                                                                                                                                   | S    | **Adopt**                                             |
| 4   | User-invoked skills for outward effects                         | `.agents/invocation.md`, `SKILL-MECHANICS.md`            | `open-pr` pushes and merges; `dependabot-triage` closes and merges PRs. Both are model-invoked with "Use when asked to merge" triggers.                                                                                                                                                                 | XS   | **Adapt**                                             |
| 5   | No-op pass on `AGENTS.md`                                       | `writing-for-agents`, `retro` (No-ops, Global AGENTS.md) | `AGENTS.md` is 907 words loaded every session. Lines restate the environment (the `Layout` block mirrors the folders; the commands block mirrors `package.json`), and rules now enforced by lint could shrink to a pointer once #1 lands.                                                               | M    | **Adapt**                                             |
| 6   | PR body: Evidence and Merge Danger                              | `pr`                                                     | `.github/pull_request_template.md` has What/Why/checklist/screenshots. `open-pr:39` already asks for "How it was checked" and "Not covered" outside the template. No door or blast-radius call.                                                                                                         | S    | **Adapt**                                             |
| 7   | Skill-to-skill calls named as tool calls                        | `.agents/invocation.md`                                  | `write-adr/SKILL.md:41` links `../update-architecture/SKILL.md` across folders; other skills say "the `verify` skill" in prose.                                                                                                                                                                         | XS   | **Adapt**                                             |
| 8   | Two-axis review (Standards, Spec)                               | `code-review`                                            | No review skill here; the built-in `/code-review` exists. Standards source would be `AGENTS.md` and `CONTRIBUTING.md`; Spec source would be `docs/superpowers/plans`.                                                                                                                                   | M    | **Skip for now**                                      |
| 9   | Deepen the form field pattern                                   | `codebase-design`, `improve-codebase-architecture`       | See [the survey](#deepening-survey).                                                                                                                                                                                                                                                                    | M    | **Worth exploring**                                   |
| 10  | `GLOSSARY.md` / shared language                                 | `domain-modeling`                                        | No glossary. Terms agents must decode: semantic token, accent, three-axis theming, routing mode, the `pages` configuration, demo data, `soon` entry, scope and type tags. Most are defined in `docs/guide` already.                                                                                     | S    | **Skip**, revisit (see below)                         |
| 11  | Git guardrail hook                                              | `git-guardrails-claude-code`                             | Branch protection on `main` and Husky (commitlint, lint-staged) already hold the line; `AGENTS.md` forbids `--no-verify`. A hook that blocks every `git push` would break `open-pr`.                                                                                                                    | S    | **Skip**                                              |
| 12  | Vendor generic skills (tdd, diagnosing-bugs, grilling, handoff) | the catalogue                                            | superpowers already supplies brainstorming, TDD, debugging, plans. Copies here would be maintenance with no repo-specific content.                                                                                                                                                                      | –    | **Skip** (install the plugin per developer if wanted) |
| 13  | Router skill (`ask-matt`)                                       | `ask-matt`                                               | Eight skills, all named in `CLAUDE.md`. Cognitive load is low.                                                                                                                                                                                                                                          | –    | **Skip**                                              |
| 14  | Per-skill docs pages and `.out-of-scope/`                       | `.agents/writing-docs.md`, `SCOPE.md`                    | A curated public catalogue needs these; a project with eight internal skills does not.                                                                                                                                                                                                                  | –    | **Skip**                                              |

### 1. Mechanical rule → deterministic check

The rule that most defines this kit is enforced by a checkbox. Today the tree is clean (a search for
palette utilities and `dark:` colour overrides outside `libs/tokens`, specs and stories finds
nothing), which is exactly when a check is cheapest: it locks the state in with zero fixes.

- **Colour literals.** A `scripts/check-tokens.mjs`, the same shape as `check-architecture.mjs`:
  scan `apps/*/src` and `libs/ui/src` `.ts`/`.html`, excluding `*.spec.ts`, `*.stories.ts` and
  `libs/tokens`, for Tailwind palette utilities (`bg-white`, `text-slate-500`, …) and `dark:`
  colour variants; print file:line; wire into `npm run verify`. No new dependency.
- **OnPush and signals.** angular-eslint ships `prefer-on-push-component-change-detection` and
  `prefer-signals`; turn them on as errors in `eslint.config.mjs`. Confirm both exist in the
  installed version at apply time (`node_modules` is not installed in this worktree).
- Prove each check by failing it on a deliberate violation first.
- Worth an ADR (or an amendment to 0009): it adds a CI gate.

Once these land, the rule text in `AGENTS.md` can lose its examples and keep one line plus the
"missing token: add it to `libs/tokens`" instruction, which no check can express.

### 2. One source of truth

- Fix `verify/SKILL.md:8` now. Better: drop the number from both skills and point to ADR 0009, which
  is amended whenever a check becomes required. A count in three places goes stale the next time.
- The non-negotiable rules appear in `AGENTS.md`, `CONTRIBUTING.md`, `add-ui-component`,
  `add-dashboard-page` and the PR template. ADR 0014 accepts `AGENTS.md` for agents and
  `CONTRIBUTING.md` for people, so keep those two. The skills should state only what their task adds
  (where a token goes, which component to copy) and point to `AGENTS.md` for the rules.

### 3. Completion criteria

Add a short `## Done when` to each skill, every line checkable from a diff or a command's output.
For example, `add-ui-component`: exported from `libs/ui/src/index.ts`; a spec that exercises a
keyboard interaction or an `aria-*` state; a README and a `.stories.ts`; `npm run check:packages`
clean after `npx nx build ui`. `write-adr`: a row in `docs/adr/README.md`; `npm run docs:build`
passes. This replaces the "Finish" sections rather than adding to them.

### 4. Invocation

Set `disable-model-invocation: true` on `open-pr` and `dependabot-triage`, and rewrite their
descriptions for a human browsing slash commands. Trade-off: the agent will no longer reach for
`open-pr` on its own when "a change is ready to go up"; the user types `/open-pr`. The other six
stay model-invoked, since the agent should reach for `verify` and `add-ui-component` unprompted.
ADR 0014 says skills carry no Claude-specific mechanics; other agents ignore unknown frontmatter,
so this holds, but the ADR should mention it.

### 5. `AGENTS.md` no-op pass

Candidates to cut or move behind a pointer, to be confirmed line by line during apply:

- `Layout` block: restates the directory tree. Keep only what the tree does not say (which app is
  prerendered, where the e2e tests run).
- Commands block: keep `npm ci` and the strict-peer trap, `verify` plus `format:check`; the rest
  is in `package.json` and `CONTRIBUTING.md`.
- Rules enforced by lint after #1: one line each, no examples.
- Keep every entry under `Traps`: each records a failure someone hit, which is exactly what
  `writing-for-agents` says a document should cache.

Target: shorter, with every removed trap traceable to its new home.

### 6. PR body

Add **How it was checked** (before/after evidence: a failing then passing test, a screenshot) and
**Merge danger** (one-way or two-way door, blast radius in a word) to the template, and remove the
same instruction from `open-pr:39` so it lives in one place. Keep the checklist.

### 10. Shared language, revisit

Written against `8212f07`. Since then `main` gained `libs/shared/kernel` and
`libs/booking/domain` (#73, ADR 0021): SalesOrder, order lines, delivery slots, Money. That is a
real domain model, and `domain-modeling`'s case for a `GLOSSARY.md` (one word per concept, shared by
the code, the docs and the agent) now applies to it. Worth its own change when the next bounded
context lands, not part of the two pull requests below.

### 8. Two-axis review, deferred

The idea (review against standards and against the spec in separate subagents, so one cannot mask
the other) is sound, but the built-in `/code-review` covers the common case and this repo has no
issue tracker workflow to feed the Spec axis. Revisit if reviews keep missing spec gaps.

## Deepening survey

Hot spots from the last 60 commits touching `apps` and `libs`: `libs/ui/src/index.ts` (7), the
dashboard and landing `app.*` wiring (4 to 6 each), `pages.routes.ts`, `overview.ts`,
`mock/routes.ts`, the `site-links` trio. Changes are spread out; there is no ball of mud.

1. **The form field.** About nine fields across `auth/sign-in.ts`, `auth/sign-up.ts`,
   `auth/forgot-password.ts` and `pages/settings/profile-settings.ts` repeat the same ten lines:
   a label `for` an id, `[attr.aria-invalid]`, `[attr.aria-describedby]` pointing at an error id
   built by string, and an `@if` error paragraph. `forms/field-errors.ts` holds the logic but is
   shallow: callers still wire every attribute and id by hand. Deletion test: delete it and the
   complexity reappears in every form, so it earns its keep, but the interface could carry more.
   A deeper module (a directive or a small `ask-form-field` that takes the `FieldTree` and owns the
   ids and ARIA wiring) would give **locality** to an accessibility contract that is currently
   copied. Test surface: one spec on the module instead of the same assertions per form.
   **Worth exploring**, and it touches `libs/ui` if it goes there (a new component, through
   `add-ui-component`).
2. **`mock/routes.ts`** (411 lines, every endpoint in one file over `seed.ts`). Deep, with a small
   interface (`MockRoute[]`), and tested through it (`routes.spec.ts`). Not a candidate; splitting
   it by resource would only add files.
3. **The `fileReplacements` pairs** (`routing-mode`, `site-links`, `mock-backend`, `demo-data`).
   Each seam has two adapters, so each is a real seam in the `codebase-design` sense. Not a
   candidate.

## Recommended phase 3

One pull request, `chore(repo)` or split into two commits by concern:

1. #2 drift fix and single source of truth in the skills.
2. #3 `Done when` in all eight skills, replacing the `Finish` sections.
3. #4 `open-pr` and `dependabot-triage` user-invoked, with a sentence in ADR 0014.
4. #7 skill references phrased the same way everywhere.
5. #6 PR template sections.

A second pull request, with an ADR (or an amendment to 0009), because it adds a CI gate:

6. #1 `check:tokens` and the two angular-eslint rules, each shown failing on a violation first.
7. #5 the `AGENTS.md` pass, after #1, since some cuts depend on the rules being enforced.

Out of scope here: #9 is a code change and should go through a design discussion and
`add-ui-component` on its own branch.
