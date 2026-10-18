---
name: domain-modeling
description: Build or change a bounded context's domain model the DDD way this repo uses - pure TypeScript in libs/<context>/domain, operations returning Result and domain events, terms in the context's GLOSSARY.md, an ADR with two alternatives for a hard-to-reverse decision. Use when adding a context, an aggregate, an operation, a domain event or a term, or when two words seem to name one concept.
---

# Model a domain

The rules are in `docs/adr/0021-bounded-contexts-as-nx-libraries.md`; the Booking context
(`libs/booking/domain`) and the shared kernel (`libs/shared/kernel`) are the worked examples.

## When to use

Adding or changing a bounded context, an aggregate, an operation, a domain event or a term; or when two words seem to name one concept.

## When not to use

- UI or data access with no domain rule in it: the `add-*` skills.
- Recording a decision with no model change: `write-adr`.

## The shape

- **Libraries per layer** under `libs/<context>/`: `domain`, `contracts`, `data-access`,
  `feature-*`, each with `type:lib`, `scope:<context>` and its `layer:` tag. Lint enforces who may
  import whom; if it rejects an import, the design is wrong, not the rule.
- **The domain is plain TypeScript**: no Angular, no RxJS (lint refuses them), no I/O, no clock.
  Time comes in as a `now: Date` argument.
- **Operations are pure functions** that return `Result<T, DomainError>` from the shared kernel. A
  business refusal is an `err` with a `DomainErrorCode`; a broken invariant in stored data throws.
  A state change returns a transition: the new state and the events it raised, for the caller to
  save and publish.
- **Values are types**: `Money` in integer minor units, `Quantity` as a branded number. A new value
  concept gets a constructor that validates and returns a `Result`.
- **Contexts talk through contracts and events**, never through each other's `domain`.

## The glossary

Each context has `libs/<context>/GLOSSARY.md`; shared-kernel terms are in `libs/shared/GLOSSARY.md`.
An entry is the term in bold, one or two sentences of meaning (no implementation detail), and the
words to avoid for it. When the code, a spec or a person uses two words for one concept, pick one,
record it, and rename the code in the same change. A term means one thing in one context; the same
word in two contexts gets an entry in each.

## When it needs an ADR

When the decision is hard to reverse, would surprise a newcomer, and had a real alternative: an
aggregate boundary, an event's shape once another context consumes it, a consistency rule across
contexts. The ADR names at least two alternatives and why each lost (the `write-adr` skill).

## Test it

Test first, at the public functions in `src/index.ts`, with the builders in the library's
`testing.ts` and a fixed `NOW`. Name each test after the behaviour, as a scenario reads ("cancelling
a placed order releases its slot"). Coverage thresholds in the library's `vite.config.mts` fail
the run below the bar in `CONSTRAINTS.md`.

## Done when

- `npx nx lint <project>` and `npx nx test <project>` pass for every domain library touched, with
  the coverage thresholds unchanged or raised.
- Every new operation returns a `Result`, takes time as an argument, and has a test for each error
  code it can return.
- Every new term is in the context's `GLOSSARY.md`, and no renamed concept keeps its old name in
  the code.
- A decision that is hard to reverse has an ADR with two alternatives.
- A new library or a new dependency between libraries is on the C4 map (the
  `update-architecture` skill).
