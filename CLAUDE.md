@AGENTS.md

## Claude Code

The shared instructions above are the source of truth; this file only adds what is specific to
Claude Code.

- Project skills live in `.claude/skills/`. Use them for the tasks they name instead of
  improvising: `verify`, `add-ui-component`, `add-dashboard-page`, `write-adr`,
  `update-architecture`, `write-docs`, `open-pr`, `dependabot-triage`.
- `docs/superpowers/` holds design and plan documents from earlier work. Read them for
  background, but the ADRs and the code win where they disagree.
- Git worktrees under `.claude/worktrees/` are ignored by git. Check `git branch --show-current`
  before you commit.
