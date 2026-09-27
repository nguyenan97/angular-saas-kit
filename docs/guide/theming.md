# Theming

Every colour in the kit resolves through a semantic token, so restyling never means
touching a component. The theme has three independent axes, all set on the `<html>`
element:

```html
<html class="dark" data-accent="violet" data-radius="lg"></html>
```

| Axis   | Set by                                      | Values                        |
| ------ | ------------------------------------------- | ----------------------------- |
| Mode   | the `dark` class                            | light, dark, system           |
| Accent | `data-accent`                               | blue, violet, emerald, orange |
| Radius | `data-radius`, derived from `--radius-base` | none, sm, md, lg              |

Those three attributes are the whole theme API. Nothing needs rebuilding when they change.
The reasoning is in [ADR 0004](../adr/0004-semantic-design-tokens-and-three-axis-theming.md).

## Changing the theme from code

`ThemeService` owns the state as signals, sets the attributes for you, and remembers the
choice in `localStorage`.

```ts
import { Component, inject } from '@angular/core';
import { ThemeService } from '@angular-saas-kit/tokens';

@Component({
  selector: 'ask-example',
  template: `
    <button type="button" (click)="theme.toggleMode()">
      {{ theme.isDark() ? 'Light' : 'Dark' }} mode
    </button>
    <button type="button" (click)="theme.setAccent('emerald')">Emerald</button>
  `,
})
export class Example {
  protected readonly theme = inject(ThemeService);
}
```

| Member                                    | Kind    | Meaning                                                       |
| ----------------------------------------- | ------- | ------------------------------------------------------------- |
| `mode()`, `accent()`, `radius()`          | signals | What was chosen. `mode` can be `system`.                      |
| `resolvedMode()`, `isDark()`              | signals | `system` resolved against the OS. Read this to react to dark. |
| `setMode()`, `setAccent()`, `setRadius()` | methods | Change one axis.                                              |
| `toggleMode()`                            | method  | Light and dark. An explicit choice, so it leaves `system`.    |
| `reset()`                                 | method  | Back to `system`, `blue`, `md`.                               |

While the mode is `system`, the service follows `prefers-color-scheme` live.

The `ThemeSwitcher` component from `@angular-saas-kit/ui` is a ready-made picker for all
three axes: `<ask-theme-switcher />`.

## No flash on load

An inline script in each app's `index.html` applies the stored theme before the first
paint. Without it, a dark-mode user would see a light page flip to dark on every reload.

That script is a copy of the `THEME_INIT_SCRIPT` constant exported from
`@angular-saas-kit/tokens`, because an inline script cannot import. A unit test
(`theme-init.spec.ts`) fails when a copy drifts, so if you change the storage shape or the
defaults, change all three places together.

## Server rendering

The landing page is prerendered, so `ThemeService` is constructed on the server too. Every
DOM and storage access is behind a platform check. The server renders the default theme, and
the inline script plus hydration correct it in the browser.

## Writing a component against the tokens

Components never name a colour. They name the role it plays:

```text
Yes:  <div class="bg-card text-card-foreground border-border">
No:   <div class="bg-white text-slate-900 border-slate-200 dark:bg-slate-900">
```

| Token                                                                 | Use it for                                          |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `background`, `foreground`                                            | The page and its text.                              |
| `card`, `popover` (each with `-foreground`)                           | Raised surfaces.                                    |
| `primary`, `secondary`, `accent` (each with `-foreground`)            | Actions and emphasis. `primary` follows the accent. |
| `muted`, `muted-foreground`                                           | Quiet surfaces and secondary text.                  |
| `destructive`, `success`, `warning`, `info` (each with `-foreground`) | Status.                                             |
| `border`, `input`, `ring`                                             | Outlines, form fields and the focus ring.           |
| `chart-1` to `chart-5`                                                | Chart series.                                       |

Each becomes Tailwind utilities: `bg-card`, `text-muted-foreground`, `border-border`,
`ring-ring`. Corner radius comes from `rounded-sm` to `rounded-2xl`, all derived from one
`--radius-base`, and layout has `h-topbar` and the sidebar widths. If the token you need
does not exist, add it in the same pull request and say why.

The colour definitions are in `libs/tokens/src/lib/styles/tokens.css` and the mapping onto
Tailwind is in `theme.css`, next to it. Colours are OKLCH, so lightness stays even when an
accent is swapped.

## Contrast

The pairs a component may combine meet WCAG AA in both modes and with every accent, and
`libs/tokens/src/lib/contrast.spec.ts` fails a change that breaks that:

| Pair                                                                                      | At least |
| ----------------------------------------------------------------------------------------- | -------- |
| Text on its surface: `foreground` on `background`, `card-foreground` on `card`, and so on | 4.5:1    |
| `muted-foreground` on `background`, `card` and `muted`                                    | 4.5:1    |
| A colour's `-foreground` on the colour: a filled button or badge                          | 4.5:1    |
| `primary` and each status colour as text on `background` and `card`: a link, a delta      | 4.5:1    |
| The focus ring (`ring`) and form-field borders (`input`) on `background` and `card`       | 3:1      |

The last two rows are why the light-mode status colours are fairly dark: one value has to carry
white text in a badge and also be readable as text on a white card. `border` is for decoration
(cards, dividers) and is not held to 3:1; a form field uses `border-input`, which is.

Pick a new value against the test, not by eye: `npx nx test tokens`. The test sees a colour
outside sRGB the way a browser shows it, with its chroma reduced, and it cannot check a
translucent token, so the checked tokens are opaque.

## Adding an accent

Adding a fifth accent is one CSS block per mode and one array entry. Nothing else changes.

1. Add the name to `ACCENTS` in `libs/tokens/src/lib/theme.types.ts`.
2. In `libs/tokens/src/lib/styles/tokens.css`, add a light block and a dark block that set
   the three tokens an accent controls:

   ```css
   [data-accent='rose'] {
     --primary: oklch(0.586 0.253 17.585);
     --primary-foreground: oklch(0.985 0 0);
     --ring: oklch(0.586 0.253 17.585);
   }

   .dark[data-accent='rose'],
   .dark [data-accent='rose'] {
     --primary: oklch(0.645 0.246 16.439);
     --primary-foreground: oklch(0.145 0 0);
     --ring: oklch(0.645 0.246 16.439);
   }
   ```

3. Run `npx nx test tokens`. The contrast test iterates `ACCENTS` too, so the new accent is
   checked in both modes (the values above pass).
4. Done. `ThemeSwitcher` iterates `ACCENTS`, so the new swatch appears on its own.

A new radius works the same way: an entry in `RADII` and a `[data-radius='xl']` block that
sets `--radius-base`.

## Using the tokens in a new app or library

A stylesheet that wants the theme imports the shared entry file and tells Tailwind where the
classes it has to generate are: the app's own templates, and the components it uses. This is
the dashboard's `styles.css`:

```css
@import '../../../libs/tokens/src/styles.css';

@source './';
@source '../../../libs/ui/src';

/* Tests are not part of the app; their strings must not become utilities. */
@source not './**/*.spec.ts';
@source not '../../../libs/ui/src/**/*.spec.ts';
```

The shared entry switches off Tailwind's automatic file scanning (`source(none)`), so that
each app ships only its own utilities, and it declares no sources of its own. That is why every
app declares its `@source`s, and why the landing page, which uses no shared component, does
not carry the dashboard's utilities.

The `@source not` lines matter more than they look. Without them, a string in a spec file, such
as the `bg-white` in a test of class merging, is picked up as a class name and ends up in the
production CSS.

### From an installed package

Once the packages are published, an app outside this workspace imports the same things by name.
`@angular-saas-kit/tokens` is the tokens stylesheet, and `@angular-saas-kit/ui/styles.css` is a
one-line stylesheet that points Tailwind at the compiled components:

```css
@import '@angular-saas-kit/tokens/styles.css';
@import '@angular-saas-kit/ui/styles.css';

@source './';
```

Tailwind CSS 4.3 or newer is a peer dependency of the tokens package, because the stylesheet
imports it. This setup was checked once by building the dashboard from the packed packages
instead of the workspace sources: every utility the components use was generated, and the
result matched the workspace build
([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)).
