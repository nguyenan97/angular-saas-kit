---
name: write-adr
description: Write an architecture decision record in docs/adr - pick the number, fill the template, keep the index and links right, or supersede an older record. Use when a decision is expensive to reverse, when a newcomer would ask "why is it like this?", or when asked to record a decision.
---

# Write an ADR

The format and the reasoning are in `docs/adr/README.md` and `docs/adr/0001-record-architecture-decisions.md`.
Read one or two existing records (`0007`, `0013` are good models) before writing.

## When to use

A decision that is expensive to reverse, or that a newcomer would question; or a record to
supersede. The `solution-design` skill ends here.

## When not to use

A fact about the code (a guide), a version bump, or a small choice inside a spec (its decision
log).

## Is it an ADR?

Write one when a decision is **expensive to reverse**, or a newcomer would reasonably ask "why is it
like this?". A version bump is not one; a change of testing strategy is. If it is only a fact about
the code, it belongs in a guide, not an ADR.

## Steps

1. **Number.** `ls docs/adr` and take the next number, four digits.
2. **File.** Copy `docs/adr/template.md` to `docs/adr/NNNN-short-title.md`, kebab-case, the decision
   as a noun phrase (`0013-documentation-site-with-vitepress.md`). The first line is `# NNNN. Title`;
   the docs site builds its sidebar from that heading.
3. **Fill it.** Status `Accepted` in the pull request that carries the decision, since merging it
   is the acceptance; `Proposed` only for a record opened to discuss before any code, which is set
   to `Accepted` in the same pull request that acts on it. Four records stayed `Proposed` after
   merging, and `npm run check:docs` now compares the record with its index row.
   Context is facts and constraints, not opinions. Decision is one or two active-voice sentences plus
   the specifics. Alternatives say **why each lost**. Consequences state the **costs** honestly: a
   record with no downsides is not finished. Delete a section rather than leave it empty.
   Two sections are optional, after [MADR](https://adr.github.io/madr/): **Decision drivers** (the
   forces and quality targets the options are judged by) and **Confirmation** (how compliance is
   checked: a lint rule, a script, a test). Prefer a decision a machine can confirm.
4. **Index.** Add a row to the table in `docs/adr/README.md`, with the status.
5. **Check every claim.** Run the command or read the code before you state it. A record that says a
   thing works, or does not, must be right; several here were corrected after being checked.
6. **Links.** Relative, ending in `.md` (`../../libs/x.ts`, `0007-....md`); they work on GitHub and the
   site. `npm run docs:build` fails on a dead one.

## Changing a decision

An accepted record is not rewritten. Write a new ADR that supersedes it, set the old one's status to
`Superseded by [NNNN](NNNN-title.md)`, and link both ways. Typos, links, statuses and a dated
`_Amended YYYY-MM-DD:_` note for a small factual change are fine in place.

## Also update

- The C4 pages (the `update-architecture` skill) if the decision changes the shape of the workspace.
- The guide that describes the behaviour, if there is one.

## Done when

- The file is `docs/adr/NNNN-<title>.md` with the next free number, and its first line is
  `# NNNN. Title`.
- No section is empty, and Consequences names at least one cost.
- `docs/adr/README.md` has its row, with the same status as the record (`npm run check:docs`).
- Every claim about the code was checked by a command or a read, and `npm run docs:build` passes.
- It is in the same pull request as the change that needs it. Then the `verify` skill and `open-pr`.
