---
name: add-ui-component
description: Add a component to the shared library (libs/ui) the way this kit requires - signal inputs, OnPush, semantic tokens, cn() host classes, keyboard and ARIA support, tests. Use when asked to add, build or port a UI component.
---

# Add a component to `libs/ui`

The contract is in `docs/guide/components.md` (worked example included) and `CONTRIBUTING.md`. Read
the guide first. `libs/ui` is small today (`ThemeSwitcher`, `cn()`), so there is little to copy;
`libs/ui/src/lib/theme-switcher/theme-switcher.ts` is the closest existing example.

## Before you write anything

- Is there a WAI-ARIA pattern for it? Read it, and note the keyboard interactions it requires.
- Does it need a focus trap, a roving tabindex, an overlay or a live region? Then use the **Angular
  CDK** (`@angular/cdk`, not yet a dependency: adding it is expected, and the component that needs
  it is the reason). Do not hand-roll these, and do not add another UI library.
- Does it need a colour the tokens do not have? Add a token to `libs/tokens` in the same change
  (`tokens.css` and `theme.css`) and say why in the PR.

## Build it

1. Create `libs/ui/src/lib/<name>/<name>.ts`. Class `PascalCase`, selector `ask-<name>`
   (kebab-case; the linter enforces the `ask` prefix), `changeDetection: OnPush`.
2. Inputs and outputs are `input()`, `output()`, `model()`. State is `signal` and `computed`; RxJS
   only at the edges. No `zone.js`, no `@Input()` decorators.
3. Colours are semantic tokens only: `bg-card`, `text-muted-foreground`, `border-border`. Never
   `bg-white`, `text-slate-500` or a `dark:` colour override.
4. Merge host classes through `cn()` from `../utils/cn`, with a `class` input last so the consumer
   wins (see the `Badge` example in the guide).
5. Keyboard and ARIA: reachable, operable, visible focus, state announced. Template a11y lint rules
   are errors.
6. Export it from `libs/ui/src/index.ts`.
7. If it imports a new runtime package, add that package to `libs/ui/package.json`. The published
   manifest does not declare `clsx`, `tailwind-merge` or `@angular-saas-kit/tokens` today, which is
   a known gap; do not widen it.

## Test it

`libs/ui/src/lib/<name>/<name>.spec.ts`, Vitest, zoneless:

```ts
await TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
}).compileComponents();
const fixture = TestBed.createComponent(Host);
await fixture.whenStable();
```

Test what a consumer or a keyboard user relies on: an override class wins, `aria-*` reflects state,
Enter/Space/arrow keys do what the pattern says. "It renders" is not a test. Run `npx nx test ui`.

## Document it

A short README next to the component: usage, an API table, accessibility notes. If the component is
part of the story users need, add it to `docs/guide/components.md`. The `ThemeSwitcher` is exercised
by the dashboard, so check it still works in the dashboard in light and dark and with all four accents.

## Finish

Run the `verify` skill, then `open-pr`. Tick the checklist in the pull request template honestly.
