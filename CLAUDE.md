@AGENTS.md

## Claude Code

The shared instructions above are the source of truth; this file only adds what is specific to
Claude Code.

- Project skills live in `.claude/skills/`. Use them for the tasks they name instead of
  improvising: `verify`, `add-ui-component`, `add-dashboard-page`, `write-adr`,
  `update-architecture`, `write-docs`, `write-spec`, `plan-tasks`, `solution-design`, `test-first`, `refactor`, `domain-modeling`, `open-pr`,
  `dependabot-triage`, `review-change`, `retro`. Each ends in a
  `## Done when` list: a step is finished when every line of it holds, not before.
- `open-pr`, `dependabot-triage`, `review-change` and `retro` are hidden from the model
  (`skillOverrides` in `.claude/settings.json` makes them `user-invocable-only`): the first two
  push, merge and close pull requests, the last two report on work the user names. Do not start
  one on your own. When the user has asked for what one does (to open or merge a pull request,
  review a branch, run a retro), or has granted autonomous mode for the task
  (`docs/guide/development-process.md`), read its `SKILL.md` and follow it; that is what "then
  `open-pr`" means in the other skills. For `review-change`, give the file to a separate agent:
  the writer does not review its own change.
- `docs/superpowers/` holds design and plan documents from earlier work. Read them for
  background, but the ADRs and the code win where they disagree.
- Git worktrees under `.claude/worktrees/` are ignored by git. Check `git branch --show-current`
  before you commit.
