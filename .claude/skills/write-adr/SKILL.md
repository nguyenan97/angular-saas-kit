---
name: write-adr
description: Write an architecture decision record in docs/adr - pick the number, fill the template, keep the index and links right, or supersede an older record. Use when a decision is expensive to reverse, when a newcomer would ask "why is it like this?", or when asked to record a decision.
---

# Write an ADR

The format and the reasoning are in `docs/adr/README.md` and `docs/adr/0001-record-architecture-decisions.md`.
Read one or two existing records (`0007`, `0013` are good models) before writing.

## Is it an ADR?

Write one when a decision is **expensive to reverse**, or a newcomer would reasonably ask "why is it
like this?". A version bump is not one; a change of testing strategy is. If it is only a fact about
the code, it belongs in a guide, not an ADR.

## Steps

1. **Number.** `ls docs/adr` and take the next number, four digits.
2. **File.** Copy `docs/adr/template.md` to `docs/adr/NNNN-short-title.md`, kebab-case, the decision
   as a noun phrase (`0013-documentation-site-with-vitepress.md`). The first line is `# NNNN. Title`;
   the docs site builds its sidebar from that heading.
3. **Fill it.** Status `Proposed` while the pull request is open, then `Accepted` when it merges.
   Context is facts and constraints, not opinions. Decision is one or two active-voice sentences plus
   the specifics. Alternatives say **why each lost**. Consequences state the **costs** honestly: a
   record with no downsides is not finished. Delete a section rather than leave it empty.
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

- The [C4 pages](../update-architecture/SKILL.md) if the decision changes the shape of the workspace.
- The guide that describes the behaviour, if there is one.

Then the `verify` skill and `open-pr`. The ADR goes in the same pull request as the change that needs it.
