# 0025. An AI-first lifecycle with self-checked gates

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** @nguyenan97
- **Supersedes:** [0023](0023-a-development-process-with-a-written-quality-bar.md)

## Context

[0023](0023-a-development-process-with-a-written-quality-bar.md) set up a process sized to the
change, with `CONSTRAINTS.md` as the quality bar and a person approving each spec and each plan. An
agent did most of the work, but it stopped twice per feature for an approval that, in practice,
read a document the agent had already checked against its own list. Several phases had no skill or
no gate at all: solution design, planning, acceptance, the security gate (audit F7 in
`docs/superpowers/specs/2026-10-18-audit.md`). Review was not required to be independent of the
writer, so an agent could review its own diff.

The agent-workflow projects read for the spec (`docs/superpowers/specs/2026-10-18-ai-first-dev-process.md`)
agree that the gates matter more than who passes through them: AWS AI-DLC puts a verification gate
at each phase boundary; spec-kit has the agent check its spec against a checklist before planning;
superpowers and mattpocock both review with a different agent than the one that wrote the code.

## Decision

- **One lifecycle**: Inception, Domain modeling, Solution design, Plan, Build, Acceptance, Review,
  Security gate, Release, Operate, Learn, each with its input, its artifact in the repository, its
  skill and its gate, in [the development process](../guide/development-process.md). Release and
  Operate are marked not yet applicable. The sizing table and `CONSTRAINTS.md` carry over from 0023
  unchanged.
- **Self-checked gates.** A spec ends at its self-review checklist (`write-spec`), a plan at every
  task naming its files, scenario, proving command and blockers (`plan-tasks`, new). The person reads
  them afterwards, as they read the pull request.
- **Independent review.** `review-change` runs in a session or agent other than the writer's, and no
  change merges with a blocking finding.
- **Autonomous mode**, granted by the person in words for a named task: the agent carries the work
  through every phase and merges green pull requests, under limits that no instruction lifts (no
  lowered bar, no bypassed check, no push to `main`, no settings, secrets or publishing), and ends
  with a report in `docs/superpowers/reports/`.

## Alternatives considered

- **Keep 0023: a person approves each spec and plan.** Safe, and it puts a person in the loop at the
  two points where a misunderstanding is cheapest to fix. It lost because the approval read what a
  checklist already checks, and the person can still read the spec before Build outside autonomous
  mode, which stays the default.
- **Autonomous by default.** Faster for every task, and it removes the person's chance to stop a
  misunderstanding before code for work they did not hand over explicitly.
- **A framework (spec-kit, AI-DLC) with its own gates.** Each brings a runtime and a folder tree that
  would compete with `docs/adr` and the skills; 0023's reasoning still holds.

## Consequences

- A misunderstanding in a spec can reach code before a person sees it. The cost is bounded by the
  sizing (small pull requests, one purpose each) and by revert, and it is the price of not waiting.
- The independent review costs a second agent run per pull request.
- The process has more phases on paper. A small change still goes straight to Build; the sizing
  table, not the number of phases, decides the work.
- The limits of autonomous mode are prose. The ones a machine can hold already are (branch
  protection, required checks, push protection); the rest rely on the agent and on review.

## References

- [The development process](../guide/development-process.md), [`CONSTRAINTS.md`](../../CONSTRAINTS.md)
- [`.claude/skills`](../../.claude/skills/README.md): `write-spec`, `plan-tasks`, `review-change`, `retro`
- [0014](0014-agent-instructions-in-agents-md-and-skills.md), [0023](0023-a-development-process-with-a-written-quality-bar.md)
