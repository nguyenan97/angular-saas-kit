# Components

> [!WARNING]
> **Early.** `libs/ui` is small on purpose today. It exports the `ThemeSwitcher` component
> and the `cn()` class helper. A component library of around forty components on the
> Angular CDK is the main item on the
> [roadmap](https://github.com/nguyenan97/angular-saas-kit#roadmap), and this page is the
> contract those components will be held to.

## The rules

These are the things the kit is _for_. A pull request that breaks one will be asked to
change, however good the rest of it is.

**Components never name a colour.** No `bg-white`, no `text-slate-500`, no `dark:` colour
overrides. Use the semantic token: `bg-card`, `text-muted-foreground`, `border-border`. See
[Theming](theming.md).

**Accessibility is a gate.** Interactive elements are reachable and operable by keyboard,
focus is visible, and state is announced. Template accessibility lint rules are errors, not
warnings. If a component needs a roving tabindex or a focus trap, use the Angular CDK
instead of rolling one.

**Signals, not RxJS state.** Component state is `signal` and `computed`. RxJS is fine at the
edges, such as HTTP and event streams, but it is not how a component holds its own state.
Every component is `OnPush`. See
[ADR 0003](../adr/0003-zoneless-signals-first-onpush-components.md).

**No new UI-library dependency.** The Angular CDK is welcome. A dependency that brings its
own styling, theming layer or component markup is not, because that is the thing this kit
exists to avoid. Small, single-purpose utilities are fine; open an issue first. See
[ADR 0005](../adr/0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md).

## Conventions the linter enforces

- Component selectors are elements with the `ask-` prefix in kebab-case: `ask-badge`.
- Directive selectors are attributes with the `ask` prefix in camelCase: `askTooltip`.
- `any` is an error, and a type-only import must be written as one.
- Template accessibility rules (`alt-text`, `valid-aria`, `label-has-associated-control`,
  `click-events-have-key-events`, `interactive-supports-focus`) are errors.

## Adding a component

A component in `libs/ui` is done when it has:

- signal inputs and outputs: `input()`, `output()`, `model()`
- host classes merged through `cn()`, so consumers can override them
- keyboard support and the ARIA attributes its WAI-ARIA pattern requires
- unit tests for the behaviour and the accessibility contract, not just "it renders"
- a short README next to it: usage, an API table, accessibility notes

### Why `cn()`

Plain string concatenation does not work with Tailwind: `"p-2" + "p-4"` leaves both classes
in the list, and the winner is decided by stylesheet order, not by the caller. `cn()` runs
`clsx` and then `tailwind-merge`, which drops the earlier conflicting utility, so a consumer
can always override a component's default.

### A worked example

A badge, in `libs/ui/src/lib/badge/badge.ts`:

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

type Variant = 'neutral' | 'success' | 'destructive';

const VARIANTS: Record<Variant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

@Component({
  selector: 'ask-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: '<ng-content />',
})
export class Badge {
  readonly variant = input<Variant>('neutral');

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(
      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
      VARIANTS[this.variant()],
      this.class(),
    ),
  );
}
```

Export it from `libs/ui/src/index.ts`:

```ts
export * from './lib/badge/badge';
```

Then use it. The consumer's `bg-primary` replaces the variant's `bg-success`; both are
never in the class list together:

```html
<ask-badge variant="success">Paid</ask-badge>
<ask-badge variant="success" class="bg-primary">Pinned</ask-badge>
```

Test what a consumer relies on, here that the override wins:

```ts
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

@Component({
  imports: [Badge],
  template: `<ask-badge variant="success" class="bg-primary">ok</ask-badge>`,
})
class Host {}

describe('Badge', () => {
  it('lets a consumer class win over the variant', async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const badge: HTMLElement = fixture.nativeElement.querySelector('ask-badge');
    expect(badge.classList.contains('bg-primary')).toBe(true);
    expect(badge.classList.contains('bg-success')).toBe(false);
  });
});
```

Run it with `npx nx test ui`. See [Testing](testing.md).

## Before you open the pull request

The [pull request template](https://github.com/nguyenan97/angular-saas-kit/blob/main/.github/pull_request_template.md)
is the checklist: no colour literals, keyboard reachable with visible focus, ARIA matching
the pattern, correct in light and dark with all four accents, tests for the behaviour.

## Using the components in your own app

Inside this workspace, import from the path alias:

```ts
import { ThemeSwitcher, cn } from '@angular-saas-kit/ui';
```

> [!WARNING]
> **Not published yet.** `@angular-saas-kit/ui` and `@angular-saas-kit/tokens` build as
> npm packages with ng-packagr, but they are not publish-ready: the built `ui` manifest
> does not declare `clsx`, `tailwind-merge` or `@angular-saas-kit/tokens`, and the built
> `tokens` package contains no stylesheets. Until that is fixed, adopt the kit by cloning
> it, which is what [getting started](getting-started.md) does.
