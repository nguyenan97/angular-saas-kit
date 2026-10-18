# Skills

Runbooks for the recurring jobs in this repository, one folder each with a `SKILL.md` in the
[Agent Skills](https://agentskills.io/specification) format. Any agent, or a person, can follow
them. Each says when to use it and ends in a `## Done when` list; `npm run check:docs` keeps the
frontmatter to the spec and this list complete.

The lifecycle they serve is in [the development process](../../docs/guide/development-process.md),
and the rules they all assume are in [`AGENTS.md`](../../AGENTS.md) and
[`CONSTRAINTS.md`](../../CONSTRAINTS.md).

## By phase

| Phase           | Skill                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Inception       | [`write-spec`](write-spec/SKILL.md)                                                                                 |
| Domain modeling | [`domain-modeling`](domain-modeling/SKILL.md)                                                                       |
| Solution design | [`write-adr`](write-adr/SKILL.md), [`update-architecture`](update-architecture/SKILL.md)                            |
| Plan            | [`plan-tasks`](plan-tasks/SKILL.md)                                                                                 |
| Build           | [`add-ui-component`](add-ui-component/SKILL.md), [`add-dashboard-page`](add-dashboard-page/SKILL.md)                |
| Any phase       | [`verify`](verify/SKILL.md), [`write-docs`](write-docs/SKILL.md), [`dependabot-triage`](dependabot-triage/SKILL.md) |
| Review          | [`review-change`](review-change/SKILL.md)                                                                           |
| Ship            | [`open-pr`](open-pr/SKILL.md)                                                                                       |
| Learn           | [`retro`](retro/SKILL.md)                                                                                           |

## By who starts them

- **User-invoked**: `open-pr`, `dependabot-triage`, `review-change`, `retro`. They push, merge,
  close pull requests or report on work the person names, so an agent runs them only when the person
  asks, by name or by a standing instruction such as autonomous mode. In Claude Code,
  `skillOverrides` in [`.claude/settings.json`](../settings.json) hides them from the model.
- **Model-invoked**: every other skill. An agent reaches for one when its task matches the skill's
  description; a skill that needs another names it ("the `verify` skill").
