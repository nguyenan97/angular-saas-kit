<div align="center">

# Angular SaaS Kit

**A free, production-ready admin dashboard and landing page for Angular 22.**
Signals-first, zoneless, Tailwind v4, and not locked to any UI library.

**[Live demo](https://nguyenan97.github.io/angular-saas-kit/demo/)** ·
[Docs](https://nguyenan97.github.io/angular-saas-kit/docs/) ·
[Landing page](https://nguyenan97.github.io/angular-saas-kit/)

[![CI](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/ci.yml)
[![CodeQL](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/codeql.yml/badge.svg)](https://github.com/nguyenan97/angular-saas-kit/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031.svg)](https://angular.dev)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2.svg)](https://github.com/sponsors/nguyenan97)

</div>

> **Status: early.** The design system, both apps and the CI gates are in
> place. The component library and the remaining dashboard pages are being
> built in the open — see [Roadmap](#roadmap). Stars and issues at this stage
> genuinely shape what gets built first.

---

## Why this one

Angular has plenty of free admin templates. Almost all of them make one of
three trades this kit refuses to make.

- **No UI-library lock-in.** Most free Angular templates are a skin over
  Angular Material, PrimeNG or Nebular — so every customisation becomes a
  fight with someone else's theming API. This kit builds on the Angular CDK
  (behaviour and accessibility primitives) and Tailwind. You own the markup.
- **Genuinely zoneless.** No `zone.js` anywhere. State is signals, change
  detection is `OnPush` throughout. This is not a v17 template with the
  version number bumped.
- **A theme system, not a colour variable.** Three independent axes — mode,
  accent, radius — swap at runtime with no rebuild, because every component
  references semantic tokens rather than colour values.
- **A landing page in the same design system.** Marketing sites are where
  most dashboards get re-designed from scratch. Here both apps share one
  token set and one component library.
- **Accessibility as a gate, not a nice-to-have.** Template a11y rules are
  lint errors, focus is visible by default, and `prefers-reduced-motion` is
  respected out of the box.

## Quick start

```bash
git clone https://github.com/nguyenan97/angular-saas-kit.git
cd angular-saas-kit
npm ci

npx nx serve dashboard             # http://localhost:4200
npx nx serve landing --port=4201   # http://localhost:4201
```

Both dev servers default to port 4200, so give the second one a port if you run them together.

Requires **Node 22+** and **npm 11+**. Older npm versions hit a dependency
resolution bug on this tree.

## What's in the box

| Package          | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `apps/dashboard` | The admin application                                     |
| `apps/landing`   | Marketing site, SSR + prerendered                         |
| `libs/tokens`    | Design tokens, Tailwind theme mapping, `ThemeService`     |
| `libs/ui`        | Shared component library (npm package, not yet published) |
| `libs/mock-api`  | In-memory backend with realistic latency                  |
| `docs`           | Guides, C4 diagrams and decision records (VitePress)      |

## Documentation

The [documentation site](https://nguyenan97.github.io/angular-saas-kit/docs/) has the
guides: [getting started](./docs/guide/getting-started.md), [theming](./docs/guide/theming.md),
[components](./docs/guide/components.md), the [mock API](./docs/guide/mock-api.md),
[deploying](./docs/guide/deploying.md) and [CI](./docs/guide/ci.md). Its source is
[`docs/`](./docs/README.md), which reads fine on GitHub too.

## Architecture

The shape of the workspace is drawn with the [C4 model](./docs/architecture/README.md)

- [context](./docs/architecture/c4-context.md),
  [containers](./docs/architecture/c4-containers.md),
  [components](./docs/architecture/c4-components.md) and
  [deployment](./docs/architecture/c4-deployment.md) - and the reasoning behind it is
  in the [architecture decision records](./docs/adr/README.md). CI checks that the
  container map matches the code.

## Theming

Every colour in the kit resolves through a semantic token, so restyling never
means touching a component.

```html
<html class="dark" data-accent="violet" data-radius="lg"></html>
```

Those three attributes are the entire theme API. `ThemeService` sets them
from signals and persists the choice:

```ts
private readonly theme = inject(ThemeService);

this.theme.setAccent('emerald');
this.theme.toggleMode();

// Read it back anywhere - it's a signal.
this.theme.isDark();
```

Components never reference a colour. They reference the role it plays:

<!-- prettier-ignore -->
```text
Yes:  <div class="bg-card text-card-foreground border-border">
No:   <div class="bg-white text-slate-900 border-slate-200 dark:bg-slate-900">
```

Adding a fifth accent is one CSS block in
`libs/tokens/src/lib/styles/tokens.css` and one entry in `ACCENTS`. Nothing
else changes.

## Roadmap

- [x] Nx monorepo, Angular 22 zoneless, Tailwind v4
- [x] Token system — 3 axes, dark mode, no flash on load
- [x] CI: lint, typecheck, format, unit tests with coverage, bundle budgets; CodeQL scanning; `main` protected by required checks
- [x] Live demo on GitHub Pages — landing at the root, dashboard demo under `/demo/`, deployed from `main`
- [ ] Component library — ~40 components on the CDK
- [ ] Dashboard pages — analytics, orders, customers, products, settings, auth
- [ ] Landing sections — pricing, FAQ, testimonials, blog
- [x] Published docs — guides, C4 architecture and decision records, on GitHub Pages
- [ ] Storybook
- [ ] Figma file with matching variables

## Contributing

Issues and PRs are welcome — especially component requests, accessibility
findings and real-world usage feedback. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Sponsors

This kit is MIT and will stay that way. If it saves you a week of work,
[sponsorship](https://github.com/sponsors/nguyenan97) pays for the demo
hosting, the Figma seat, and the time to keep it current with Angular.

<!-- sponsors -->

_Your logo could be here._

<!-- /sponsors -->

## License

[MIT](./LICENSE) © Nguyen An
