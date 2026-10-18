# 0027. The agent decides and merges by default

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** @nguyenan97
- **Supersedes:** [0025](0025-an-ai-first-lifecycle-with-self-checked-gates.md)

## Context

[0025](0025-an-ai-first-lifecycle-with-self-checked-gates.md) set up the AI-first lifecycle: its
phases, self-checked gates and an independent review. It kept one person-in-the-loop default: an
agent stopped after Inception and Plan, asked the person to choose wherever a question was open,
and did not merge, unless the person granted autonomous mode in words for a named task.

In practice the stops were approvals of work the gates had already checked. A batch of fixes from
the scan of 2026-10-18 (#98 to #102) went through the same loop five times: the agent wrote the
change, the gates passed, an independent agent reviewed it, and the agent then waited for "do the
next one" and "merge it". The owner asked for the agent to decide everything itself and to need
no choice or approval from a person.

## Decision

- **Autonomous mode is the default** for every task in this repository. The agent carries the work
  through every phase, answers its own open questions, and squash-merges a pull request once its
  gates pass. It does not stop to ask the person to choose, approve a spec or a plan, or allow a
  merge.
- **Decisions are recorded, not asked.** Where a choice is open, the agent takes the option the
  evidence supports; if two are equal, the simpler, the easier to reverse and the one with fewer new
  dependencies. An ADR for a choice that is hard to reverse, a row in the spec's decision log for
  the rest, an assumption in the spec for each question it answered itself.
- **The gates stay, and replace the approvals**: the spec's self-review, `npm run verify` and
  `npm run format:check`, an independent review (another agent or session) with no blocking finding
  left, every required check green and the branch up to date with `main`.
- **The limits no instruction lifts stay** (in [the development process](../guide/development-process.md)):
  no lowered bar, no bypassed check, no push to `main`, no settings, secrets, branch protection or
  publishing, no data sent outside GitHub. A step that needs one of those, or a permission the agent
  does not have, goes in the report's "Needs a person" list; the agent goes on with the rest.
- **The person can still step in.** Words in the task ("stop after the spec", "do not merge")
  narrow it for that task. Reading the reports and merged pull requests afterwards replaces
  approving them beforehand.
- 0025's lifecycle, its phases, skills, sizing and `CONSTRAINTS.md` carry over unchanged.

## Alternatives considered

- **Keep 0025: autonomous mode only when granted per task.** It keeps a person able to stop a
  misunderstanding before code. It lost because the owner asked to be out of the loop, and the
  approval in practice re-read what a gate had already checked.
- **Autonomous by default, but a person merges.** Keeps a final human check on what lands on
  `main`. It lost for the same reason: the merge was the step the owner wanted to stop doing, and
  every required check plus an independent review already gate it.
- **Let the agent lift the limits too** (settings, secrets, publishing). Faster still. It lost
  because those are the actions a revert does not undo, and the hosts the agent runs in hold them
  to a person anyway.

## Consequences

- Work no longer waits on a person: a batch runs to the end and reports.
- A misunderstanding can reach `main` before a person reads it. The cost is bounded by small
  pull requests, one purpose each, the independent review and revert; the person reads the report.
- The independent review is now the only review before merge, so its quality matters more: it is
  a mandatory gate, run by an agent that did not write the change.
- The user-invoked skills (`open-pr`, `dependabot-triage`, `review-change`, `retro`) stay hidden
  from the model, so they do not start from a description match; the instructions now tell the agent
  to run them as part of every task.
- A tool or host may still ask the person to confirm an action. This record does not change those
  prompts; it changes what the repository's own instructions ask for.

## References

- [The development process](../guide/development-process.md), [`AGENTS.md`](../../AGENTS.md),
  [`CONSTRAINTS.md`](../../CONSTRAINTS.md)
- [`.claude/skills`](../../.claude/skills/README.md): `write-spec`, `open-pr`, `review-change`, `retro`,
  `dependabot-triage`
- [0025](0025-an-ai-first-lifecycle-with-self-checked-gates.md), [0014](0014-agent-instructions-in-agents-md-and-skills.md)
