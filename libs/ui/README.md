# @angular-saas-kit/ui

Accessible Angular components for the
[Angular SaaS Kit](https://github.com/nguyenan97/angular-saas-kit), styled only through the
semantic tokens of `@angular-saas-kit/tokens`. Signals-first, `OnPush`, no `zone.js`.

> **Pre-1.0.** It has the basics a dashboard page needs: `Badge`, `Button`, `Card`, `Chart`, `Dialog`,
> `Icon`, `Input` and `Label`, `Menu`, `Pagination`, `Table` and `SortHeader`, `Tabs`, the `ThemeSwitcher`, and
> the `cn()` class helper. The rest of the component library is on the roadmap. Nothing is
> published to npm yet, so `0.0.x` may change without notice.

## Requirements

Angular 22, Tailwind CSS 4.3 or newer, and `@angular-saas-kit/tokens` (a peer dependency, so the app
and the components share one `ThemeService`). `@angular/cdk` is a peer dependency too: `Dialog`,
`Menu` and `Tabs` are built on it, and it loads its own overlay styles. Icons are drawn from the
data in [`lucide`](https://lucide.dev), a dependency of this package: import the icons you use
from it.

## Use

In your global stylesheet, import the tokens and then this package's stylesheet, which tells
Tailwind where the components' classes are:

```css
@import '@angular-saas-kit/tokens/styles.css';
@import '@angular-saas-kit/ui/styles.css';

@source './';
```

Then use a component:

```ts
import { Component } from '@angular/core';
import { ThemeSwitcher } from '@angular-saas-kit/ui';

@Component({
  selector: 'app-settings',
  imports: [ThemeSwitcher],
  template: `<ask-theme-switcher />`,
})
export class Settings {}
```

`cn()` merges Tailwind classes with last-one-wins semantics (`clsx` then `tailwind-merge`), which
is how every component lets a consumer override its defaults.

## Documentation

The guides, the architecture and the decision records are at
<https://nguyenan97.github.io/angular-saas-kit/docs/>. Start with
[components](https://nguyenan97.github.io/angular-saas-kit/docs/guide/components.html).

MIT licensed.
