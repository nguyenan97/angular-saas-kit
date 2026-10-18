# Development process

How a change goes from an idea to `main` in this repository, whether a person or an AI agent writes
it. The process is sized to the change: a typo does not get a spec, and a new bounded context does
not skip one. The reasoning is in [ADR 0023](../adr/0023-a-development-process-with-a-written-quality-bar.md).

> [!NOTE]
> The kit has no backend, no authentication and no production observability. This process makes
> the code ready to grow them; it does not mean they exist.

## Size the change first

| The change                                                               | Phases                            |
| ------------------------------------------------------------------------ | --------------------------------- |
| A typo, a dependency bump, a one-file fix                                | Build, Verify, Ship               |
| A component, a page, a script, a CI step                                 | Plan, Build, Verify, Review, Ship |
| A feature, a public API, a new bounded context, anything hard to reverse | Every phase                       |

When unsure, take the larger size. A spec that turns out to be two lines costs little; a feature
built on a misunderstanding costs the feature.

## The phases

| Phase      | Produces                                                                            | How                                                                | Ends when                                        |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| **Define** | A spec: goal, non-goals, requirements, scenarios, open questions                    | the `write-spec` skill                                             | The person who asked approves it                 |
| **Model**  | Terms in the context's `GLOSSARY.md`; an ADR for a decision that is hard to reverse | the `domain-modeling` and `write-adr` skills                       | Both are in the same pull request as the code    |
| **Plan**   | Tasks of a few files each, each naming its check and the scenario it covers         | a plan in `docs/superpowers/plans/`                                | The person approves it                           |
| **Build**  | Code and its tests, one slice at a time                                             | the `add-ui-component` and `add-dashboard-page` skills, test first | Each slice passes and is committed               |
| **Verify** | Every check in [`CONSTRAINTS.md`](../../CONSTRAINTS.md) passing                     | the `verify` skill                                                 | `npm run verify` and `npm run format:check` pass |
| **Review** | Findings on four axes: spec, standards, security, accessibility                     | the `review-change` skill                                          | No blocking finding is left                      |
| **Ship**   | A pull request with evidence and a merge-danger call                                | the `open-pr` skill                                                | The required checks pass and a person merges it  |
| **Learn**  | A mistake turned into a check, a skill edit or a rule                               | the `retro` skill                                                  | The fix lands in its own pull request            |

Three more serve any phase: `update-architecture` and `write-docs` keep the C4 diagrams and the
guides true in the same pull request as the change, and `dependabot-triage` takes the dependency
updates. The skills are in [`.claude/skills`](../../.claude/skills). They are plain Markdown runbooks, so any
agent, or a person, can follow them.

## Specs and scenarios

A spec states requirements as `SHALL` sentences, each with at least one scenario:

```markdown
### Requirement: Cancel a placed order

A placed or confirmed order SHALL be cancellable with a reason, and its delivery slot SHALL be
released.

#### Scenario: Cancel with a reason

- **WHEN** the customer cancels a placed order with the reason "Wrong address"
- **THEN** the order is cancelled and its slot has one more free place
```

The scenario is the acceptance check for the task that implements it, and the name of its test.

## How DDD, TDD and BDD fit together

They are three layers of one design, not three processes:

- **Domain-driven design** shapes the code. Each bounded context is a set of Nx libraries; its
  `domain` library is plain TypeScript, its operations are pure functions that return a `Result`,
  and contexts talk through contracts and domain events
  ([ADR 0021](../adr/0021-bounded-contexts-as-nx-libraries.md)). The context's `GLOSSARY.md` names
  the concepts that the code, the specs and the tests share.
- **Test-driven development** drives the domain and the components: a failing test at the public
  function or the component's inputs and keyboard behaviour, then the code that passes it.
- **Behaviour-driven development** drives the user flows: a spec's scenarios become
  `Given/When/Then` steps in a `.feature` file. The suite app's browser tests will run them with
  `playwright-bdd`; that is planned, not built.

So a requirement traces to a scenario, and a scenario to a test.

## The quality bar

[`CONSTRAINTS.md`](../../CONSTRAINTS.md) lists every check a change must pass, the command that
runs it, and the exceptions with an owner and a date. Its floor names what review rejects even
when CI is green: a silenced lint rule, a skipped test, an assertion removed, a threshold lowered.
Tightening the bar is an ordinary change. Loosening it needs a reason in the pull request.

## Working with AI agents

- The agent reads `AGENTS.md`, then `CONSTRAINTS.md`, then the skill for the task.
- The person approves the spec and the plan, and merges. The agent does not merge without being
  asked.
- A check the agent cannot run is reported as not run, never as passed.
- A correction that would be needed again becomes a check or a skill edit (the `retro` skill), so
  the next agent does not need it.
