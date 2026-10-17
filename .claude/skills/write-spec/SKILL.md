---
name: write-spec
description: Write the spec for a change before code - goal, non-goals, SHALL requirements with WHEN/THEN scenarios, open questions - in docs/superpowers/specs, and size the change first. Use when asked to design, specify or plan a feature, a page, a bounded context or a public API, or when a request is too vague to build.
---

# Write a spec

The process and the sizing table are in `docs/guide/development-process.md`. Size the change
first: a typo or a one-file fix needs no spec, so say so and go to Build.

## Before you write

- Ask what you cannot read. One question at a time, each with your recommended answer, until the
  goal, the users and the boundaries are clear. Read the code, the ADRs and the context's
  `GLOSSARY.md` for the rest.
- Use the glossary's words. A concept with no entry gets one (the `domain-modeling` skill).

## The file

`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, starting with `# Title` and a line with the
date and the status (`draft`, `approved`). Sections, in this order, each deleted if empty:

1. **Goal**: what changes for whom, in two or three sentences, and why now.
2. **Non-goals**: what a reader might expect that this does not do.
3. **Requirements**: each a `### Requirement: <name>` with one `SHALL` sentence, and under it one
   or more `#### Scenario: <name>` with `- **WHEN** ...` and `- **THEN** ...` (and `- **AND** ...`).
   A requirement with no scenario cannot be tested; add one or cut the requirement.
4. **Design**: the projects and files touched, with their Nx tags; data flow; what the user sees,
   with every state (loading, empty, error); the alternatives you rejected, and why.
5. **Testing**: which scenarios become unit tests, which become browser tests or `.feature`
   scenarios, and what is checked by hand.
6. **Open questions**: what still needs the person's decision. None may be left at approval.

State what exists and what is planned; the spec must not describe the mock API as a backend.

## Done when

- The file exists at the path above with the sections in order and no empty section.
- Every requirement has a `SHALL` sentence and at least one `WHEN/THEN` scenario.
- Every term a reader could misread is in the context's `GLOSSARY.md`.
- The person has approved it, the status line says `approved`, and no open question is left.
- A decision in it that is hard to reverse has an ADR (the `write-adr` skill), or the spec says why
  it does not need one.
