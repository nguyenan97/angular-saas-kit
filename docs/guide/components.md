# Components

> [!NOTE]
> **Early.** `libs/ui` has the basics a dashboard page needs, listed below. A library of
> around forty components on the Angular CDK is the main item on the
> [roadmap](https://github.com/nguyenan97/angular-saas-kit#roadmap), and this page is the
> contract every one of them is held to.

## What exists

| Component                                                     | Selector                             | What it is                                       |
| ------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| [Alert](../../libs/ui/src/lib/alert/README.md)                | `ask-alert`                          | A message that stays on the page                 |
| [Avatar](../../libs/ui/src/lib/avatar/README.md)              | `ask-avatar`                         | A picture, or initials                           |
| [Badge](../../libs/ui/src/lib/badge/README.md)                | `ask-badge`                          | A short status or count                          |
| [Button](../../libs/ui/src/lib/button/README.md)              | `button[askButton]`, `a[askButton]`  | Styles a native button or link                   |
| [Card](../../libs/ui/src/lib/card/README.md)                  | `ask-card` and its parts             | A raised surface; the parts are directives       |
| [Checkbox](../../libs/ui/src/lib/checkbox/README.md)          | `input[askCheckbox]`                 | Styles a native checkbox                         |
| [Chart](../../libs/ui/src/lib/chart/README.md)                | `ask-chart`                          | A line or bars in SVG, with the data as a table  |
| [Dialog](../../libs/ui/src/lib/dialog/README.md)              | `DialogService` and the parts        | A modal dialog, on the CDK's `Dialog`            |
| [Icon](../../libs/ui/src/lib/icon/README.md)                  | `ask-icon`                           | An inline SVG icon, from Lucide's data           |
| [Input and Label](../../libs/ui/src/lib/input/README.md)      | `input[askInput]`, `label[askLabel]` | Style native text fields, selects and labels     |
| [Menu](../../libs/ui/src/lib/menu/README.md)                  | `[askMenuTrigger]`, `[askMenu]`, ... | A menu of actions, on the CDK's menu             |
| [Pagination](../../libs/ui/src/lib/pagination/README.md)      | `ask-pagination`                     | Previous and next for a paged list               |
| [Radio](../../libs/ui/src/lib/radio/README.md)                | `input[askRadio]`                    | Styles a native radio, grouped by a fieldset     |
| [Switch](../../libs/ui/src/lib/switch/README.md)              | `input[askSwitch]`                   | A checkbox drawn as a switch, `role="switch"`    |
| [Skeleton](../../libs/ui/src/lib/skeleton/README.md)          | `ask-skeleton`                       | A loading placeholder                            |
| [Table and SortHeader](../../libs/ui/src/lib/table/README.md) | `table[askTable]`, `ask-sort-header` | Styles a native table; a sortable column header  |
| [Tabs](../../libs/ui/src/lib/tabs/README.md)                  | `ask-tabs`, `ask-tab`                | Tabs, with the CDK's roving focus                |
| ThemeSwitcher                                                 | `ask-theme-switcher`                 | The three theme axes, as groups of native radios |

Each has a README next to its source with usage, an API table and accessibility notes. The
`cn()` helper is exported too.

The keyboard behaviour of `Dialog`, `Menu` and `Tabs` (focus traps, arrow keys, roving focus)
comes from the Angular CDK and is unit-tested; it is proved in a real browser as the dashboard
pages start to use them.

## Storybook

Every component has stories, published at
[/storybook/](https://nguyenan97.github.io/angular-saas-kit/storybook/) next to the demo:

```bash
npm run storybook        # http://localhost:4400
```

- **The toolbar is the theme.** Mode, accent and radius set the same class and data attributes on
  the html element that `ThemeService` sets, so every story shows what a theme change does.
- **The Accessibility panel runs axe** on the story you are looking at. Every story has none of
  its violations; keep it that way.
- **Stories run zoneless**, like the apps, on the same tokens and Tailwind sources.

A story lives next to its component, as `<name>.stories.ts`. It imports what its template uses
with `moduleMetadata`, and a story that needs state (a sorted table, an open dialog) declares a
small host component in the same file, with an `ask-story-` selector. Stories are left out of the
npm package (`tsconfig.lib.json`) and out of the apps' CSS (`@source not` in each app's
stylesheet), as tests are. Why Storybook brings back the webpack builder is in
[ADR 0020](../adr/0020-storybook-on-the-angular-webpack-builder.md).

## The rules

These are the things the kit is _for_. A pull request that breaks one will be asked to
change, however good the rest of it is.

**Components never name a colour.** No `bg-white`, no `text-slate-500`, no `dark:` colour
overrides. Use the semantic token: `bg-card`, `text-muted-foreground`, `border-border`. See
[Theming](theming.md).

**Accessibility is a gate.** Interactive elements are reachable and operable by keyboard,
focus is visible, and state is announced. Template accessibility lint rules are errors, not
warnings. Prefer a native element to an ARIA role: a group of `<input type="radio">` gets the
arrow keys and a single tab stop from the browser, while `<button role="radio">` gets neither
and leaves the component to build both, which is how the `ThemeSwitcher` once got it wrong.
If a component needs a roving tabindex or a focus trap, use the Angular CDK instead of
rolling one.

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
- Module boundaries are errors: an app imports libraries, a shared library imports only shared
  libraries, nothing imports an app, and there are no cycles
  ([ADR 0015](../adr/0015-enforce-module-boundaries-with-nx-tags.md)).
- Template accessibility rules (`alt-text`, `valid-aria`, `label-has-associated-control`,
  `click-events-have-key-events`, `interactive-supports-focus`) are errors.

## Adding a component

A component in `libs/ui` is done when it has:

- signal inputs and outputs: `input()`, `output()`, `model()`
- host classes merged through `cn()`, so consumers can override them
- keyboard support and the ARIA attributes its WAI-ARIA pattern requires
- unit tests for the behaviour and the accessibility contract, not just "it renders"
- a short README next to it: usage, an API table, accessibility notes

**Styling a native element? Make it a directive on that element.** `Button`, `Input` and
`Table` are directives (`button[askButton]`, `input[askInput]`, `table[askTable]`), so the
button keeps its keyboard behaviour, the field keeps working with forms and autofill, and the
table keeps its semantics. A component that wraps the element would have to rebuild all of
that.

### Why `cn()`

Plain string concatenation does not work with Tailwind: `"p-2" + "p-4"` leaves both classes
in the list, and the winner is decided by stylesheet order, not by the caller. `cn()` runs
`clsx` and then `tailwind-merge`, which drops the earlier conflicting utility, so a consumer
can always override a component's default.

### A worked example

The kit's `Badge`, in `libs/ui/src/lib/badge/badge.ts`, shortened here to three of its
seven variants:

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

It is exported from `libs/ui/src/index.ts`, as every component must be:

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

> [!NOTE]
> **Built as packages, not published yet.** `@angular-saas-kit/ui` and
> `@angular-saas-kit/tokens` build as npm packages with ng-packagr. Each declares what its
> code imports, ships its stylesheets and a license, and `npm run check:packages` fails when
> that stops being true ([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)).
> No release workflow publishes them yet, and both are `0.0.x`, so adopt the kit by cloning it,
> which is what [getting started](getting-started.md) does. For the day they are published,
> [Theming](theming.md#from-an-installed-package) shows how an app imports them.

### If your component needs a new package

A runtime dependency of a component in `libs/ui` (the way `cn()` needs `clsx` and
`tailwind-merge`) has to be declared in `libs/ui/package.json`, and named in
`allowedNonPeerDependencies` in `libs/ui/ng-package.json`, or the built package would import
something it does not declare. `npm run check:packages` catches the omission after a build.
