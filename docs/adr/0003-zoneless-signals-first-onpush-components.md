# 0003. Zoneless, signals-first, OnPush components

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact; the approach dates from the scaffold)
- **Deciders:** @nguyenan97

## Context

Angular can trigger change detection implicitly through zone.js, which patches
browser APIs, or explicitly through signals and `markForCheck`. Zone-based change
detection costs bundle size, makes stack traces harder to read and hides when
rendering happens. Angular now supports zoneless change detection as a first-class
mode. The kit wants to be a reference for current Angular, not a template with a
version number bumped.

## Decision

No zone.js. The apps configure no zone polyfill and tests use
`provideZonelessChangeDetection()`.

Components are `OnPush` and keep their state in signals (`signal`, `computed`,
`effect`), with the signal-based `input()`, `output()` and `model()` APIs. RxJS
stays at the edges - HTTP and event streams - and is not how a component holds
its own state. This is a contributor rule in [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Alternatives considered

- **zone.js with default change detection** - works with every third-party
  library, but rendering is implicit and slower.
- **`OnPush` on top of zone.js** - keeps the zone cost for half the benefit.
- **A state library such as NgRx signals** - a dependency for state that lives
  inside individual components anyway.

## Consequences

- _Amended 2026-09-27:_ forms follow the same rule. The dashboard's forms use Signal
  Forms (`@angular/forms/signals`, stable since Angular 22): the model is a signal, the
  validation rules are declared once, and a field's state (`touched`, `invalid`, `errors`)
  is read as signals in the template. Data comes in through `httpResource`.
- Reactivity is explicit and rendering is predictable; bundles are smaller and
  server rendering is simpler ([0007](0007-prerendered-landing-and-client-side-dashboard.md)).
- A library that relies on zone.js, or that mutates state outside signals, may not
  update the view. Adopters who bring such libraries have to adapt them.
- Tests wait for stability (`await fixture.whenStable()`) instead of calling
  `detectChanges()` and hoping.
- Contributors used to zone-based Angular have to learn the model; the rules in
  `CONTRIBUTING.md` are written for that.

## References

- [`libs/tokens/src/lib/theme.service.ts`](../../libs/tokens/src/lib/theme.service.ts) - an all-signal service
- [`apps/dashboard/src/app/app.spec.ts`](../../apps/dashboard/src/app/app.spec.ts) - the zoneless test setup
