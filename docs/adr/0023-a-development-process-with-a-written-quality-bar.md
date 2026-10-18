# 0023. A development process with a written quality bar

- **Status:** Accepted
- **Date:** 2026-10-17
- **Deciders:** @nguyenan97

## Context

The kit is growing from a dashboard demo into a multi-context business application (the suite,
[0021](0021-bounded-contexts-as-nx-libraries.md)), and AI agents write much of its code. The
checks were strong (seven required gates, [0009](0009-strict-ci-gates-and-a-protected-main.md)) but
the process around them was implicit: where a spec goes and what it contains, when a change needs
one, how a requirement is traced to a test, what review looks at beyond CI, and what counts as
lowering the bar were all in people's heads or scattered across `AGENTS.md`, `CONTRIBUTING.md`, the
skills and the PR template.

The most-used agent-workflow projects (superpowers, spec-kit, addyosmani/agent-skills, OpenSpec,
BMAD, AWS AI-DLC, Trail of Bits' skills) converge on the same habits: agree on a spec with concrete
scenarios before code, work in small tested slices, keep the quality bar written and machine-checked,
put human approval at phase boundaries, review on separate axes, and turn corrections into durable
rules. The research is in `docs/superpowers/specs/2026-10-17-sdlc-and-security-review.md`.

## Decision

- **One process, sized to the change**: Define, Model, Plan, Build, Verify, Review, Ship, Learn,
  described in [the development process guide](../guide/development-process.md). A small change
  skips the early phases; a feature or a new bounded context goes through all of them.
- **`CONSTRAINTS.md`** at the root is the quality bar: every enforced check with its command, the
  ratchets, the exceptions with an owner and a date, and a floor that review rejects even when CI
  is green (suppressions, skipped tests, removed assertions, lowered thresholds). Nobody weakens it
  to make a change pass.
- **Specs** state requirements as `SHALL` sentences with `WHEN/THEN` scenarios (the OpenSpec form).
  A scenario is the acceptance check of the task that builds it and becomes a `Given/When/Then`
  step in the suite's `.feature` files when those exist.
- **Domain coverage is a ratchet in code**: `shared-kernel` and `booking-domain` fail their tests
  below 98% lines, 95% branches and 100% functions.
- **Four project skills** carry the process: `write-spec` and `domain-modeling` (model-invoked),
  `review-change` and `retro` (user-invoked). Generic discipline (brainstorming, TDD, debugging,
  plans) stays with the agent's own tooling; the skills say how it is done here.

## Alternatives considered

- **Install spec-kit, OpenSpec, BMAD or AI-DLC.** Each brings its own folders, a runtime (Python,
  Bun or a native binary) and a vocabulary that would compete with `docs/adr`, `docs/superpowers`
  and the existing skills. AI-DLC alone has 33 stages. Their ideas fit in four skills and one file.
- **Keep the bar in `AGENTS.md`.** It loads into every session and is written for agents; people
  read `CONTRIBUTING.md`. A separate file is read at the moment it matters and reviewed when it
  changes.
- **Role personas** (product, architect, QA agents). With one maintainer, the review axes give the
  separation that matters without the ceremony.

## Consequences

- A feature costs a spec and a plan before code. For a small change the sizing table says to skip
  them, and the cost of judging the size wrongly falls on the person who approved the plan.
- `CONSTRAINTS.md` duplicates the commands that `package.json`, the configs and CI run. It is the
  place that says why, and it can drift: a change that adds, removes or moves a check updates it in
  the same pull request.
- The floor is checked by review, not by a tool. An agent that reviews its own change can miss what
  it did; `review-change` reads the diff against the floor line by line for that reason.
- The coverage thresholds fail a change that adds untested domain code, which is the intent, and
  also one that only adds a defensive branch nobody can reach. The fix is a test or a simpler
  design, not a lower number.

## References

- [`CONSTRAINTS.md`](../../CONSTRAINTS.md), [the process guide](../guide/development-process.md)
- [`.claude/skills`](../../.claude/skills): `write-spec`, `domain-modeling`, `review-change`, `retro`
- [0014](0014-agent-instructions-in-agents-md-and-skills.md), the conventions for agent instructions
