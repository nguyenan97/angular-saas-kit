---
name: plan-tasks
description: Break an approved spec into small, independent, verifiable tasks - vertical slices of one to five files, each with the scenario it covers, the command that proves it and the tasks that block it - and write the plan with its dependency graph in docs/superpowers/plans. Use after write-spec, when asked to plan or split work, or when a task looks too big for one session.
---

# Plan the tasks

## When to use

- After the `write-spec` skill, before Build, for a change of the middle size or larger.
- When a task in hand turns out to be too big for one session, or touches more than it should.

## When not to use

- A change small enough to need no spec: it is one task already.
- Writing the requirements themselves: that is `write-spec`. A plan with no spec behind it has
  nothing to trace its tasks to.

## 1. Read

The spec, the code it touches, and `CONSTRAINTS.md`. Look for a refactor that would make the
change easy, and plan it first, in its own task: make the change easy, then make the easy change.

## 2. Slice vertically

Each task is a thin path through every layer it needs (domain, data, UI, tests), that works and
can be checked on its own: not "all the models", then "all the pages". The exception is a wide
mechanical change (a rename across the workspace): plan it as expand, migrate in batches, contract,
so that every task leaves `main` green.

## 3. Size each task

A task is ready when an agent can do it without guessing. It names:

| Field          | What it says                                                                           |
| -------------- | -------------------------------------------------------------------------------------- |
| **Files**      | One to five files it creates or changes                                                |
| **Covers**     | The spec's scenario (or finding) it makes true                                         |
| **Proves it**  | The command whose output shows it works: a test name, `npx nx test <project>`, a check |
| **Blocked by** | The tasks that must merge first, or none                                               |
| **Branch**     | `<type>/<scope>-<slug>`, the type and scope from `AGENTS.md`                           |

It is **too big** when it touches more than two projects, needs more than one architectural
decision, cannot be finished in one agent session without compacting its context (about an hour),
or has no command that can prove it. Split it until none of these hold.

## 4. Mark what can run in parallel

Two tasks can run at the same time, each on its own branch and worktree, when neither blocks the
other and they change no file in common. Mark them `[P]`. Two tasks that both edit a list (the skill
lists, `CONSTRAINTS.md`, an index) are not parallel, however small the edit.

## 5. Write the plan

`docs/superpowers/plans/YYYY-MM-DD-<topic>.md`: a link to the spec, a Mermaid `flowchart` of the
blocking edges, a table of the tasks with the fields above, and the definitions both ends share:

- **Definition of Ready**: every field above is filled in.
- **Definition of Done**: the task's proving command passes; `npm run verify` and
  `npm run format:check` pass; the docs it touches are updated in the same pull request; no new
  `TODO`; an independent review has no blocking finding left; the required checks are green.

## Done when

- The plan exists at the path above, links its spec, and has a dependency graph.
- Every task has files (five at most), the scenario it covers, a proving command and its blockers.
- No task is too big by the rules in step 3.
- Every `[P]` task shares no file and no blocking edge with another open `[P]` task.
- Every requirement in the spec is covered by at least one task.
