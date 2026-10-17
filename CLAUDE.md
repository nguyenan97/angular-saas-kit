@AGENTS.md

## Claude Code

The shared instructions above are the source of truth; this file only adds what is specific to
Claude Code.

- Project skills live in `.claude/skills/`. Use them for the tasks they name instead of
  improvising: `verify`, `add-ui-component`, `add-dashboard-page`, `write-adr`,
  `update-architecture`, `write-docs`, `open-pr`, `dependabot-triage`. Each ends in a
  `## Done when` list: a step is finished when every line of it holds, not before.
- `open-pr` and `dependabot-triage` push, merge and close pull requests, so they run only when the
  user types them. When the user has already asked you to open or merge a pull request, read
  `.claude/skills/open-pr/SKILL.md` and follow it; that is what "then `open-pr`" means in the
  other skills.
- `docs/superpowers/` holds design and plan documents from earlier work. Read them for
  background, but the ADRs and the code win where they disagree.
- Git worktrees under `.claude/worktrees/` are ignored by git. Check `git branch --show-current`
  before you commit.
