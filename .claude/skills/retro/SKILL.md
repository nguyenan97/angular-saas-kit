---
name: retro
description: After a session or a merged change, find what went wrong or cost too much and propose the cheapest durable fix for each - a check, a skill edit or an AGENTS.md line - most severe first.
---

# Retrospective

Look at the session the user names (the current one if they name none) and its pull requests.
The aim is the environment, not the code: what would make the next agent, or person, get it right
the first time.

## Find

For each of these, note where it happened and what it cost:

- A mistake a check could have caught (wrong colour, wrong import, a missed doc update).
- Information the agent had to hunt for, or got wrong, because nothing pointed to it.
- A correction the person had to make, or would have to make again.
- A skill step that was unclear, out of date or skipped.
- A check that was slow, flaky or silenced, or a gate that was bypassed.
- A line in `AGENTS.md`, `CLAUDE.md` or a skill that changed nothing (a no-op), or says what
  another file already says.

## Fix, cheapest durable first

| If the problem is                                                   | The fix is                                                                                                |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mechanical (a pattern, an import, a file that must change together) | A check: a lint rule, a `scripts/check-*.mjs`, a spec, wired into `verify` and listed in `CONSTRAINTS.md` |
| A procedure for one kind of task                                    | An edit to that task's skill                                                                              |
| A trap that applies to most tasks                                   | One line in `AGENTS.md`'s Traps                                                                           |
| A decision someone will want to re-open                             | An ADR                                                                                                    |
| A one-off                                                           | Nothing; say so                                                                                           |

Prefer deleting a no-op to adding a line. A new rule in prose for something a check could hold is
the wrong fix.

## Report

The candidates, most severe first: what happened, the evidence (a commit, a message, a file and
line), the proposed fix and where it goes. Do not apply them. Each accepted fix lands in its own
pull request.

## Done when

- Every candidate has evidence, a fix from the table, and a severity.
- No candidate proposes prose where a check would do.
- The report says which candidates you would skip, and why.
