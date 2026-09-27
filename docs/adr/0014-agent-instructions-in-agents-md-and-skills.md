# 0014. Agent instructions in AGENTS.md, with skills for the recurring jobs

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

AI coding agents edit this repository often, and this repository is full of things an agent cannot
see from the code alone: the CI gates and why they exist, a coverage quirk that breaks `__dirname`, a
Node server that answers 400 to everything, three copies of one script, a lockfile that npm keeps
entries in for reasons nobody would guess. Without written guidance each agent rediscovers these, or
does not. The tools disagree about where guidance lives: `AGENTS.md` for a growing set of them,
`CLAUDE.md` for Claude Code, `.cursor/rules` and `.github/copilot-instructions.md` for others.

## Decision

- **One source of truth: `AGENTS.md`** at the root, short and specific: the commands, the layout, the
  rules that are not negotiable, the traps. `CLAUDE.md` imports it (`@AGENTS.md`) and adds only what is
  Claude Code specific. No per-tool copies.
- **Skills for the recurring jobs**, as `.claude/skills/<name>/SKILL.md`: `verify`, `add-ui-component`,
  `add-dashboard-page`, `write-adr`, `update-architecture`, `write-docs`, `open-pr`,
  `dependabot-triage`. Each is a checklist with the exact commands, written so that any agent, or a
  person, can follow it.
- The instructions state what is **true today**, including what is unfinished, and tell the agent to do
  the same. An agent that is told the mock API is wired up will write code that assumes it.

## Alternatives considered

- **Instructions only in `CONTRIBUTING.md`** - written for people, long, and not where agents look first.
- **A file per tool** - each drifts on its own, and the same rule gets three phrasings.
- **No skills, only the one file** - the file would either grow into a manual that is loaded every
  time, or omit the procedures that agents most often get wrong.
- **Enforce everything with hooks and lint instead** - the right home for what can be enforced, and
  most of it already is (CI, commitlint, the architecture check). Instructions cover the rest.

## Consequences

- **The instructions can rot.** They describe commands, paths and gaps that change. Nothing checks
  them: the architecture map has a CI check, `AGENTS.md` has a reviewer. A change that moves a command
  or closes a gap it lists should update it in the same pull request.
- **They are advice, not enforcement.** An agent can ignore them. The required CI checks and the
  protected `main` are what actually hold the line ([0009](0009-strict-ci-gates-and-a-protected-main.md)).
- The skills are written for Claude Code's skill format but contain no Claude-specific mechanics, so
  another agent can read them as plain runbooks.
- A person still owns the change. `CONTRIBUTING.md` says so: an agent's work goes through the same
  checks, and the submitter is responsible for it.

## References

- [`AGENTS.md`](../../AGENTS.md), [`CLAUDE.md`](../../CLAUDE.md), [`.claude/skills`](../../.claude/skills)
- [agents.md](https://agents.md) - the convention
