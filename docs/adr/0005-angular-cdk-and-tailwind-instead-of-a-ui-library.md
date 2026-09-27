# 0005. Angular CDK and Tailwind instead of a UI library

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact)
- **Deciders:** @nguyenan97

## Context

Most free Angular admin templates are a skin over Angular Material, PrimeNG or
Nebular. Every customisation then becomes a fight with someone else's theming API
and someone else's markup. The kit exists to avoid exactly that: adopters should
own the markup.

## Decision

Components are built from **Angular CDK primitives** (behaviour and accessibility:
roving tabindex, focus traps, overlays) and **Tailwind utilities**, with no UI
library dependency. A small `cn()` helper - `clsx` plus `tailwind-merge` - routes
every component's host classes so a consumer's classes win over a component's
defaults without forking it. This is a contributor rule: a dependency that brings
its own styling, theming layer or component markup is not accepted; small
single-purpose utilities are fine after an issue.

## Alternatives considered

- **Angular Material** - solid accessibility, but its theming API is the thing
  being avoided, and the markup is not the adopter's.
- **PrimeNG or Nebular** - the same trade with a different look.
- **A headless component library** - closer to the goal, but still a dependency
  with its own opinions. Worth revisiting if the component library grows faster
  than it can be maintained.

## Consequences

- No theming API to fight, and components can be edited in place.
- More code to write and maintain than wrapping a library would need.
- Accessibility correctness is the project's job. Template accessibility lint
  rules are errors, keyboard operation and focus visibility are review criteria,
  and behaviour is tested rather than just rendering.
- **What exists today.** `cn()` and `ThemeSwitcher` are implemented. `@angular/cdk`
  is **not yet a dependency** - no component needs a CDK primitive yet - so the
  README's "builds on the Angular CDK" describes the intent, not the current
  `package.json`. It becomes true with the first overlay, menu or dialog.
  _Amended 2026-09-27:_ `@angular/cdk` is now a dependency. The first user is the
  dashboard shell, not `libs/ui`: its mobile drawer traps focus with `CdkTrapFocus`
  and follows the `lg` breakpoint with `BreakpointObserver`. A component in `libs/ui`
  that uses the CDK declares it as a peer dependency of the package
  ([0016](0016-packages-declare-and-ship-what-they-need.md)).
  _Amended again the same day:_ `libs/ui` now builds `Dialog` on the CDK's `Dialog`, `Menu`
  on its menu and `Tabs` on its `FocusKeyManager`, and declares `@angular/cdk` as a peer
  dependency, so the status drops "partly implemented". The library is still far from the
  forty components the roadmap plans.

## References

- [`libs/ui/src/lib/utils/cn.ts`](../../libs/ui/src/lib/utils/cn.ts)
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) - "No new UI-library dependency" and "Adding a component"
- [0004](0004-semantic-design-tokens-and-three-axis-theming.md)
