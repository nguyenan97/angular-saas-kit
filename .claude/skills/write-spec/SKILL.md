---
name: write-spec
description: Write the spec for a change before code - goal, non-goals, SHALL requirements with WHEN/THEN scenarios, quality targets, assumptions and a decision log - in docs/superpowers/specs, then review it against a checklist. Use when asked to design, specify or plan a feature, a page, a bounded context or a public API, or when a request is too vague to build.
---

# Write a spec

## When to use

- A change of the middle size or larger in the sizing table of
  `docs/guide/development-process.md`: a component, a page, a script, a feature, a public API, a
  bounded context, anything hard to reverse.
- A request too vague to build: write the spec to find out what is being asked.

## When not to use

- A typo, a dependency bump, a one-file fix: say it needs no spec and go to Build.
- Breaking an existing spec into tasks: that is the `plan-tasks` skill.

## Before you write

- Read the code, the ADRs in the area and the context's `GLOSSARY.md`. Use the glossary's words;
  a concept with no entry gets one (the `domain-modeling` skill).
- Ask what you cannot read: one question at a time, each with your recommended answer. In
  autonomous mode (`development-process.md`) do not ask: take the answer you would have recommended
  and write it down under **Assumptions**.

## The file

`docs/superpowers/specs/YYYY-MM-DD-<topic>.md`, starting with `# Title` and a line with the date
and the status (`draft`, `approved`). Sections, in this order, each deleted if empty:

1. **Goal**: what changes for whom, in two or three sentences, and why now.
2. **Non-goals**: what a reader might expect that this does not do.
3. **Requirements**: each a `### Requirement: <name>` with one `SHALL` sentence, and under it one
   or more `#### Scenario: <name>` with `- **WHEN** ...` and `- **THEN** ...` (and `- **AND** ...`).
   A requirement with no scenario cannot be tested; add one or cut the requirement.
4. **Quality targets**: the non-functional requirements this change must meet, each with a number
   and the command that measures it (an initial bundle under 350 kB from the build output; no
   serious axe violation; a response under 200 ms once there is a server). Write `None beyond
CONSTRAINTS.md` when that is true.
5. **Design**: the projects and files touched, with their Nx tags; data flow; what the user sees,
   with every state (loading, empty, error); the alternatives you rejected, and why. A change that
   is hard to reverse goes through the Solution design phase: an ADR with two alternatives
   (the `write-adr` skill).
6. **Testing**: which scenarios become unit tests, which become browser tests, and what is
   checked by hand.
7. **Assumptions**: each question you answered yourself, numbered, with the answer.
8. **Decision log**: a table of the smaller decisions: what, why, and the source (a finding, a
   document, a command's output).
9. **Open questions**: what still needs the person. None may be left when the status says
   `approved`.

State what exists and what is planned; the spec must not describe the mock API as a backend.

## Review it

Before setting the status to `approved`, check every line and put the list at the end of the spec
under **Self-review**, ticked:

- [ ] The goal says what changes, for whom, and why now.
- [ ] Every requirement is one `SHALL` sentence with at least one `WHEN/THEN` scenario.
- [ ] Every scenario can fail: a test could be written that passes only when it holds.
- [ ] Every quality target has a number and a command.
- [ ] Nothing claims what is not built (a backend, auth, a published package).
- [ ] Every decision is in the log with a source, and each hard-to-reverse one has an ADR.
- [ ] Every assumption is one the person could reverse without rewriting the spec.
- [ ] No open question is left.

Outside autonomous mode the person approves it after that; in autonomous mode the ticked list is
the gate.

## Done when

- The file exists at the path above with the sections in order and no empty section.
- Every requirement has a `SHALL` sentence and at least one `WHEN/THEN` scenario.
- Every term a reader could misread is in the context's `GLOSSARY.md`.
- The self-review list is at the end, every line ticked, and the status says `approved`.
- A decision in it that is hard to reverse has an ADR (the `write-adr` skill), or the spec says why
  it does not need one. Then the `plan-tasks` skill.
