# Prompt: adopt the best of mattpocock/skills into angular-saas-kit

Paste everything below the line into a fresh agent session at the repo root, on a new branch.

---

You are improving this repository's agent environment (`AGENTS.md`, `CLAUDE.md`, `.claude/skills/`,
guardrails) by borrowing ideas from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).
Work in three phases. Stop at the end of phase 2 and wait for my go-ahead before phase 3.

## Ground rules

- This repo's `AGENTS.md`, ADRs (`docs/adr/`, especially 0009 and 0014) and code win over anything in
  mattpocock/skills. Do not re-litigate an accepted ADR; if an idea contradicts one, say which and why
  it might still be worth reopening.
- Borrow **patterns**, not files. Generic skills (grilling, tdd, diagnosing-bugs, handoff, prototype)
  are better installed per developer as a plugin (`claude plugin install
mattpocock-skills@claude-plugins-official`) than vendored here, where they would need maintaining.
  The superpowers plugin already covers brainstorming, TDD and debugging for this user; do not
  duplicate it. A project skill earns its place only if it encodes something specific to this repo.
- No name may collide with a harness command (`code-review`, `review`, `init`, `simplify`,
  `security-review`). mattpocock records this trap in `.out-of-scope/harness-name-collisions.md`.
- Every change obeys this repo's rules: Conventional Commits, `docs` as a type, docs updated in the
  same PR, `npm run verify` and `npm run format:check` green.

## Phase 1: research (read-only)

Read from primary sources, not memory (`gh api repos/mattpocock/skills/contents/<path> -H "Accept:
application/vnd.github.raw"`):

- `README.md`, `AGENTS.md`, `SCOPE.md`, `GLOSSARY.md`, `.agents/invocation.md`, `.agents/writing-docs.md`
- `skills/productivity/writing-for-agents/SKILL.md` and `SKILL-MECHANICS.md`
- `skills/engineering/{retro,code-review,pr,codebase-design,improve-codebase-architecture,domain-modeling,tdd,diagnosing-bugs}/SKILL.md`
- `skills/misc/git-guardrails-claude-code/` and `skills/in-progress/setup-ts-deep-modules/`
- `.out-of-scope/*.md`

Then read this repo's side: `AGENTS.md`, `CLAUDE.md`, every `.claude/skills/*/SKILL.md`,
`docs/adr/0014-*.md`, `.github/pull_request_template.md`, `CONTRIBUTING.md`, the ESLint configs and
`scripts/check-*.mjs`.

## Phase 2: analysis (write it up, change nothing)

Write `docs/superpowers/specs/2026-10-17-agent-environment-review.md` with one row per candidate:
idea, source file in mattpocock/skills, what it changes here, evidence from this repo (a file and
line), cost, and a verdict of **Adopt**, **Adapt**, or **Skip** with a one-line reason. Rank by value.
Evaluate at least these candidates, and add any others you find:

1. **Mechanical rule → deterministic check** (`retro`). `AGENTS.md` states rules that only a reviewer
   or the PR checklist enforce today, starting with "components never name a colour". For each
   non-negotiable rule, say whether lint, a script or CI already enforces it; for each one that is
   mechanical but unenforced, propose the cheapest check (a custom ESLint rule, a
   `scripts/check-*.mjs` wired into `verify`).
2. **The no-op test and context load** (`writing-for-agents`). `AGENTS.md` loads into every session.
   Run the no-op test sentence by sentence: what changes no behaviour, what is duplicated in a skill or
   in `CONTRIBUTING.md`, what applies to one session in ten and belongs behind a pointer. Propose the
   cut as a diff, and keep every trap that has bitten someone.
3. **User-invoked vs model-invoked** (`.agents/invocation.md`). Skills with outward-facing or
   hard-to-reverse effects (`open-pr` merges, `dependabot-triage` closes and merges PRs) should be
   reachable only when typed: `disable-model-invocation: true`, with a human-facing description.
   Decide per skill, and check that ADR 0014's "no Claude-specific mechanics" still holds (frontmatter
   is ignored by other agents, so it should).
4. **Completion criteria** (`writing-for-agents`, `.agents/writing-docs.md`). mattpocock's skills end
   in checkable "Done when" lists; ours do not. Propose one per skill, each item checkable from the
   diff or a command's output.
5. **PR body shape** (`pr`). Summary as the smallest visual, before/after Evidence, Merge Danger
   (one-way or two-way door, blast radius). Decide how it merges with `.github/pull_request_template.md`
   and the `open-pr` skill without duplicating the checklist.
6. **Two-axis review** (`code-review`). Standards (this repo's rules plus the Fowler smell baseline)
   and Spec (the issue or plan), as separate subagents. Decide whether a project skill under a
   non-colliding name (for example `review-change`) adds enough over the built-in `/code-review`
   when its Standards source is `AGENTS.md` plus `CONTRIBUTING.md`.
7. **Shared language** (`domain-modeling`, `GLOSSARY.md`). List the terms agents in this repo must
   already decode (semantic token, three-axis theming, accent, routing mode, the `pages`
   configuration, mock API, `ask-` prefix, scope and type tags). Decide whether a root `GLOSSARY.md`
   pays for itself, or whether the terms belong in `docs/guide` behind a pointer.
8. **Skill hygiene for this repo**: dependencies phrased as "call the Skill tool with X" rather than
   prose mentions; one source of truth for each rule (a skill points to `AGENTS.md` or an ADR rather
   than restating it); a check that every skill named in `CLAUDE.md` exists, and the reverse.
9. **Git guardrails** (`git-guardrails-claude-code`). A `PreToolUse` hook that blocks `git push` to
   `main`, `--no-verify` and force pushes. Weigh it against the protections branch protection and
   Husky already give.
10. **Deep modules** (`codebase-design`, `improve-codebase-architecture`). Run the survey on the hot
    spots from `git log` over the last 60 commits (`libs/ui`, `apps/dashboard`) and list at most three
    deepening candidates with the deletion test applied. Report only; refactoring code is out of
    scope for this prompt.

End the document with the recommended phase-3 set: the Adopt and Adapt items that fit in one
reviewable PR, plus any that need their own PR or an ADR (adding a lint rule or a hook is a decision
worth an ADR under `write-adr`).

## Phase 3: apply (after my go-ahead)

- One concern per commit, with Conventional Commit scopes (`repo` for agent files, `ci` for checks).
- For a new check, first show it failing on a deliberate violation, then passing on the clean tree.
- Edit skills with the no-op test applied to your own additions: a skill must get shorter or stay
  the same length unless it gains a real step.
- Update `docs/adr/0014-*.md` (or write a new ADR superseding parts of it) where the conventions for
  agent instructions change, and `CONTRIBUTING.md` where contributors see the change.
- Run the `verify` skill, then the `open-pr` skill. The PR body says what was taken from
  mattpocock/skills, what was skipped, and why.

## Done when

- The analysis document exists with a verdict and evidence for every candidate above.
- Every Adopt item in the agreed set is applied, or listed in the PR as deferred with a reason.
- `AGENTS.md` is shorter than before, and no trap that it listed was lost (each one now lives in
  `AGENTS.md`, a skill, an ADR or an automated check, and the PR says which).
- `npm run verify` and `npm run format:check` pass, and the PR is open against `main`.
