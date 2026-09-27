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

3. Done. `ThemeSwitcher` iterates `ACCENTS`, so the new swatch appears on its own.

A new radius works the same way: an entry in `RADII` and a `[data-radius='xl']` block that
sets `--radius-base`.

## Using the tokens in a new app or library

A stylesheet that wants the theme imports the shared entry file and tells Tailwind where its
own templates are. This is the whole of the dashboard's `styles.css`:

```css
@import '../../../libs/tokens/src/styles.css';

@source './';
```

The shared entry switches off Tailwind's automatic file scanning (`source(none)`), so that
each app ships only its own utilities. That is why every app declares its own `@source`. The
shared entry declares one for `libs/ui` on behalf of everyone.
