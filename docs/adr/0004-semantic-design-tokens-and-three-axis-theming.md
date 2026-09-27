# 0004. Semantic design tokens and three-axis theming

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact; the token system dates from the scaffold)
- **Deciders:** @nguyenan97

## Context

The kit is meant to be reskinned by adopters without editing components. Most
Angular templates make that a fight: colours are hard-coded, or bound to a
component library's own theming API. The kit also renders on the server (the
landing page is prerendered), so a theme has to survive server rendering and must
not flash the wrong colours on load.

## Decision

Components never name a colour. They use **semantic tokens** - `background`,
`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`,
`destructive`, `success`, `warning`, `info`, `border`, `input`, `ring` and
`chart-1..5` - which are CSS custom properties defined in
[`libs/tokens/src/lib/styles/tokens.css`](../../libs/tokens/src/lib/styles/tokens.css)
and mapped onto Tailwind v4 utilities with `@theme inline`
([`theme.css`](../../libs/tokens/src/lib/styles/theme.css)). `inline` keeps the
`var()` reference intact, which is what lets a runtime attribute swap restyle the
page with no rebuild.

Theming has **three independent axes**, all set on `<html>`:

| Axis   | Mechanism                                   | Values                        |
| ------ | ------------------------------------------- | ----------------------------- |
| Mode   | `.dark` class                               | light, dark, system           |
| Accent | `data-accent`                               | blue, violet, emerald, orange |
| Radius | `data-radius`, derived from `--radius-base` | none, sm, md, lg              |

Colours are OKLCH so lightness stays perceptually even when an accent is swapped.
`ThemeService` owns the state as signals, persists it to `localStorage` under
`ask.theme.v1`, follows `prefers-color-scheme` while the mode is `system`, and
guards every DOM and storage access so it is safe during server rendering.

An inline script in each app's `index.html` applies the stored theme before first
paint. It is deliberately a copy of `THEME_INIT_SCRIPT` (an inline script cannot
import), and `theme-init.spec.ts` fails if the copies drift.

## Alternatives considered

- **Tailwind `dark:` variants inside each component** - every component would name
  colours, and a new accent would mean editing all of them.
- **Prebuilt CSS themes swapped by stylesheet** - one request and one flash per
  switch, and the axes multiply (2 x 4 x 4 files).
- **A JS theme object or CSS-in-JS** - runtime cost, and it fights Tailwind.
- **Angular Material theming** - ties the kit to a component library
  ([0005](0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)).

## Consequences

- Adding an accent is one CSS block in `tokens.css` and one entry in `ACCENTS`;
  nothing else changes.
- Reskinning needs no rebuild and no component edits.
- "No colour literals in components" is enforced by review and the pull request
  checklist, not by a lint rule. A rule would be a cheap, worthwhile addition.
- The duplicated inline script is a drift risk that a test, not the compiler,
  guards.
- OKLCH needs a current browser; that is acceptable for a kit that targets Angular 22.
- _Amended 2026-09-27:_ contrast is part of the token contract. Text pairs meet WCAG AA
  (4.5:1) and the focus ring and input borders 3:1, in both modes and with every accent,
  and `contrast.spec.ts` checks it. Meeting it darkened the light-mode `success` and
  `warning` (which now carries white text), the light emerald and orange accents,
  `muted-foreground` and `input`, and lightened the dark violet accent
  ([Theming](../guide/theming.md#contrast)).

## References

- [`libs/tokens/src/lib/theme.service.ts`](../../libs/tokens/src/lib/theme.service.ts), [`theme-init.ts`](../../libs/tokens/src/lib/theme-init.ts)
- [`libs/ui/src/lib/theme-switcher/theme-switcher.ts`](../../libs/ui/src/lib/theme-switcher/theme-switcher.ts) - exercises all three axes
- [`apps/dashboard-e2e/src/theme.spec.ts`](../../apps/dashboard-e2e/src/theme.spec.ts)
