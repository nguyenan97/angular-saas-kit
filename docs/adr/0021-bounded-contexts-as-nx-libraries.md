# 0021. Bounded contexts as Nx libraries

- **Status:** Accepted
- **Date:** 2026-10-17
- **Deciders:** @nguyenan97

## Context

The kit is adding a second demo, `suite`, with several business domains (Booking, then SCM,
Logistics and ERP) that must stay separable as they grow. A folder convention alone drifts; this
repository already enforces boundaries with Nx tags
([0015](0015-enforce-module-boundaries-with-nx-tags.md)).

## Decision

Each bounded context is a set of Nx libraries under `libs/<context>/`, one per layer: `domain`
(plain TypeScript), `contracts` (what other contexts may import), `data-access` and `feature-*`.
All four layers exist for Booking (`booking-domain`, `booking-contracts`, `booking-data-access`,
`booking-feature-orders`), on `shared-kernel`; the `suite` app mounts them.

- **Tags:** every library keeps `type:lib`, takes `scope:<context>`, and adds a `layer:` tag.
- **Lint:** `layer:domain` may depend only on `layer:domain`, `layer:contracts` only on
  `layer:domain`, `layer:data-access` on those two and `mock-api` (tagged `role:mock-backend`), `layer:feature` on
  data access, domain, contracts and shared libraries, and a context only on
  itself and `scope:shared`. Domain and contracts libraries also refuse `@angular/*` and `rxjs`
  imports.
- **Shared kernel:** the value types (`Money`, quantities, `Result`) and the event bus that every
  context uses live in `shared-kernel`, in the `shared` scope and the domain layer.
- **Operations:** domain operations are pure functions. Each returns a `Result`; a successful state
  change returns a transition: the new state plus the domain events it raised. Placing an order
  also returns the booked slot, and the caller saves both. Cancelling a placed or confirmed order
  emits `OrderCancelled` with the `slotId`; the caller releases the slot with `releaseSlot` and
  saves it with the order.
- **Aggregate shape:** `SalesOrder` is a discriminated union by `status` (draft, placed or
  confirmed, cancelled), so a field that exists only after placing is not optional on a draft.
- **Failures:** a business failure (an empty order, a full slot, an invalid transition) is an error
  in the `Result`. Malformed data that no valid caller produces (a slot date that is not a date,
  mixed currencies in one sum, an arithmetic overflow) throws.

## Alternatives considered

- **Folders inside one library** - rules are only a convention, and lint cannot see a reach across
  them.
- **One library per context** - a domain model could import its own UI or data access, so the layer
  rule would have nothing to enforce.
- **Exceptions for business failures** - callers cannot see from the signature which failures are
  expected, and the compiler does not make them handle each one.

## Consequences

- Rules are unit-tested without TestBed and run in milliseconds. The mock backend and the UI can
  share one model, and a context cannot quietly reach into another.
- A context costs up to four libraries, each with its own configuration. Cross-context work goes
  through contracts and events, which is slower to write than a direct import.
- The union forces every caller to narrow on `status` before reading a placed-only field.
- Two kinds of failure to keep apart: callers handle `Result` errors, and a throw is a bug or
  corrupt data, not a flow to catch.
- The domain trusts its input: build an order only through the library's factories and operations,
  or validate it when loading it from storage.

## References

- [Spec: the suite and the Booking domain](../superpowers/specs/2026-10-17-suite-booking-design.md)
- [Plan 1: the kernel and the Booking domain](../superpowers/plans/2026-10-17-suite-1-kernel-and-booking-domain.md)
- [`libs/shared/kernel`](../../libs/shared/kernel/README.md) and
  [`libs/booking/domain`](../../libs/booking/domain/README.md)
