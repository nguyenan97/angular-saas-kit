# @angular-saas-kit/tokens

Design tokens, the Tailwind v4 theme mapping and `ThemeService` for the
[Angular SaaS Kit](https://github.com/nguyenan97/angular-saas-kit).

Every colour resolves through a semantic token (`bg-card`, `text-muted-foreground`,
`border-border`), and a theme has three independent axes set on `<html>`: colour mode, accent and
corner radius. Changing an axis needs no rebuild.

> **Pre-1.0.** Nothing is published to npm yet, so `0.0.x` may change without notice. Today the
> way to use the kit is to clone the repository.

## Requirements

Angular 22 and Tailwind CSS 4.3 or newer (`tailwindcss` is a peer dependency: the stylesheet
imports it).

## Use

In your global stylesheet:

```css
@import '@angular-saas-kit/tokens/styles.css';

/* Where Tailwind should look for the classes your templates use. */
@source './';
```

The entry stylesheet switches off Tailwind's automatic file scanning, so declare each place that
holds classes with `@source`, as above.

In your app, `ThemeService` owns the theme as signals and remembers the choice:

```ts
import { inject } from '@angular/core';
import { ThemeService } from '@angular-saas-kit/tokens';

const theme = inject(ThemeService);
theme.setAccent('emerald');
theme.toggleMode();
theme.isDark(); // a signal
```

To avoid a flash of the wrong theme on load, paste `THEME_INIT_SCRIPT` (exported from the package)
into a `<script>` in the `<head>` of your `index.html`, before any stylesheet paints.

## Documentation

The guides, the architecture and the decision records are at
<https://nguyenan97.github.io/angular-saas-kit/docs/>. Start with
[theming](https://nguyenan97.github.io/angular-saas-kit/docs/guide/theming.html).

MIT licensed.
