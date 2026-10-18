---
name: solution-design
description: Design a large or hard-to-reverse change before planning it - quality targets with numbers, context and constraints, two or more options with their trade-offs, the decision as an ADR, the C4 views it changes, a light STRIDE threat model when it touches data, the network or auth, and an evolution path for parts that do not exist yet. Use for a new bounded context, a public API, a backend, auth, a deployment target, or any choice a newcomer would question.
---

# Design the solution

## When to use

- After `write-spec`, for a change in the largest size of `docs/guide/development-process.md`: a
  bounded context, a public API, a new app or server, a deployment target, a dependency that shapes
  the code.
- When the spec's Design section names more than one reasonable way to do it.

## When not to use

- A change with one obvious way, inside an existing shape: the spec's Design section is enough.
- Recording a decision already made: that is just the `write-adr` skill.

## 1. Quality targets

Name the qualities this change must hold, each with a number and how it is measured, before
comparing options; the options are judged against them. Start from `CONSTRAINTS.md` and add what
the change needs:

| Quality         | Example target                                                      | Measured by                              |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| Performance     | Initial bundle under 350 kB; a list of 1,000 rows renders in 100 ms | build output; a browser test with timing |
| Accessibility   | No serious axe violation, light and dark                            | `accessibility.spec.ts`                  |
| Maintainability | No new cycle; the domain stays free of Angular and RxJS             | `npm run lint`                           |
| Security        | No new high advisory; inputs validated at the boundary              | dependency review; a test per rule       |

## 2. Context, constraints and options

The facts that force a decision, the constraints (the ADRs in force, the module boundaries, no new
UI library, what must not change), then **two options or more**. For each: how it meets each
target, what it costs now, and what it makes hard later. The cheapest option that meets every
target wins; with a tie, the one easier to reverse.

## 3. Record it

- **The decision** as an ADR (the `write-adr` skill), the losing options under Alternatives
  considered with why each lost.
- **The views** it changes (the `update-architecture` skill): Context for a new person or outside
  system, Containers for a new project or dependency, Components for what changes inside one, and a
  Dynamic view (a sequence diagram) when the order of calls between parts is the point. Deployment
  once there is a deployment beyond Pages.
- **The overview**: `docs/architecture/overview.md` (when it exists) for a quality goal, a
  constraint or a risk that changes.

## 4. Threat model, when data, the network or auth is touched

STRIDE, one line each for what the change adds: **S**poofing (who can pretend to be whom),
**T**ampering (what input or stored data can be altered), **R**epudiation (what must be logged),
**I**nformation disclosure (what leaks, to whom), **D**enial of service (what can be exhausted),
**E**levation of privilege (what grants more than it should). Each threat gets a mitigation and the
test or check that holds it, or is accepted in the ADR with a reason. The security axis of
`review-change` checks the result before the merge.

## 5. The evolution path, for what does not exist

The kit has no backend, no auth and no observability. A design that will need one says where it
will go and through which interface, and stays a plan: the contract (a TypeScript interface in a
`contracts` library, an HTTP shape in `data/models.ts`), the adapter that satisfies it today (the
mock API) and the one that will (a real client), and what has to be true before the switch. Write
it as planned; never describe it as built.

## Done when

- Every quality target has a number and a measuring command.
- The ADR names two options or more, why each loser lost, and at least one cost of the winner;
  `npm run check:docs` passes.
- Every C4 view the change affects is edited; `npm run check:architecture` and
  `npm run docs:build` pass.
- A change that touches data, the network or auth has a STRIDE line for each of the six letters.
- Anything not built is written as planned. Then the `plan-tasks` skill.
