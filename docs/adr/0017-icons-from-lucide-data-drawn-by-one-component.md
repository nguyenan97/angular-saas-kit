# 0017. Icons: Lucide's data, drawn by one component

- **Status:** Proposed
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

The component library needs icons: the sort arrows in a table header, the close
button of a dialog, the entries of the sidebar. When the workspace was scaffolded,
`lucide-angular` was ruled out because it caps its Angular peer range at 21, and the
plan was hand-written inline SVG components. It still caps it: `lucide-angular@1.0.0`
declares `@angular/core` `13.x - 21.x`, and the repository resolves peer dependencies
strictly ([0009](0009-strict-ci-gates-and-a-protected-main.md)).

Hand-drawing icons does not scale past a handful, and copying another set's path data
into the repository means carrying its licence notice by hand. The `lucide` package
itself is framework-free: each icon is exported as data, a list of SVG elements and
their attributes on a 24 x 24 grid. It has no dependencies, is ISC licensed and
declares `sideEffects: false`, and its icons (2,114 exports in 1.48, aliases included)
use seven SVG elements between them (`path`, `circle`, `rect`, `line`, `ellipse`,
`polyline`, `polygon`).

## Decision

We draw icons with one component, `ask-icon`, which renders a Lucide icon's data
(or any drawing in the same shape) as inline SVG from its template, element by
element. `lucide` is a runtime dependency of `@angular-saas-kit/ui`, declared in its
`package.json` and `ng-package.json` ([0016](0016-packages-declare-and-ship-what-they-need.md)).
An app imports the icons it uses from `lucide` and passes them in:

```ts
import { Menu } from 'lucide';
// <ask-icon [icon]="Menu" />
```

An icon is decorative by default (`aria-hidden="true"`); given a `label` it becomes
`role="img"` with that name.

## Alternatives considered

- **`lucide-angular`** - its peer range stops at Angular 21, so a strict install fails.
- **`@lucide/angular`** - supports Angular 22 (`>=17`), but it is a second component
  API next to the kit's own, with its own selectors, inputs and accessibility defaults,
  and it ties the kit's Angular upgrades to another package's peer range again.
- **Hand-written icons** - fine for five, not for the fifty a dashboard needs, and a
  drawing copied from an icon set brings a licence notice to keep with it.
- **An icon font or a sprite sheet** - a font is announced unpredictably and needs its
  own CSS; a sprite needs a build step and an asset path in every consumer.
- **Rendering the SVG from an HTML string** - needs `innerHTML` and a sanitiser bypass.
  The template covers the seven elements, renders on the server and trusts nothing.

## Consequences

- Any Lucide icon is available, and a bundle carries only the icons it imports:
  three icons bundled and minified come to 560 bytes, licence comments included.
- A consumer of the published package imports from `lucide` directly, so the kit's
  icon API is the data shape, not a list of names the kit maintains.
- An icon that used an SVG element outside the seven would render incomplete. The
  component's test draws one of each, and a Lucide release that adds an element needs a
  line in the template.
- The installed `lucide` package is about 22 MB unpacked, for the ESM, CommonJS and UMD
  builds of every icon. It is a download cost for developers, not a bundle cost.

## References

- [`libs/ui/src/lib/icon/icon.ts`](../../libs/ui/src/lib/icon/icon.ts) and its README
- [0005](0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md) - no UI-library dependency
- [0016](0016-packages-declare-and-ship-what-they-need.md) - how the package declares `lucide`
