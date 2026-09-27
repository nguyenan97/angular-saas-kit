# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-26
- **Deciders:** @nguyenan97

## Context

Decisions in this repository have lived in commit messages, pull request
descriptions and one design spec. A newcomer cannot tell which of them still
holds, and several were reversed or amended after review while the work was in
flight (for example a workflow path filter that would have left docs-only pull
requests unmergeable, and a CodeQL check that would have blocked every fork
PR). The reasoning behind a reversal is exactly what gets lost.

## Decision

We keep a numbered log of architecture decision records in `docs/adr`, in the
lightweight format of [`template.md`](template.md). One decision per file. An
accepted record is not rewritten when the decision changes: a new record
supersedes it and the old one gets a `Superseded by` status. Typos, links and
status changes are fine to edit in place.

Write an ADR when a decision is expensive to reverse, or when a newcomer would
reasonably ask "why is it like this?". The [index](README.md) explains how.

## Alternatives considered

- **A wiki** - drifts away from the code and is not reviewed with it.
- **Issues or discussions** - not versioned with the code they describe.
- **A single `ARCHITECTURE.md`** - describes the present, not why it became so.
- **Nothing** - the status quo; the cost is re-litigating decisions.

## Consequences

- Decisions are reviewed in the same pull request as the change that needs them,
  and `git log docs/adr` shows how thinking evolved.
- It takes discipline; an ADR nobody writes is worse than none, because the
  index looks complete when it is not.
- Records 0002-0008 were written after the fact, from the code and its history,
  and say so. They record what is true today, including what is unfinished.

## References

- Michael Nygard, [Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [`docs/superpowers/specs/2026-09-05-ci-security-hardening-design.md`](../superpowers/specs/2026-09-05-ci-security-hardening-design.md) - a design that was amended during implementation
