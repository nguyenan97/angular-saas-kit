# Level 2: Containers

The deployable pieces and the libraries between them. The arrows between workspace
projects are checked against the source by
[`scripts/check-architecture.mjs`](../../scripts/check-architecture.mjs), so this
page cannot quietly go stale ([how](README.md#keeping-them-true)). Where the apps are
deployed is on the [deployment](c4-deployment.md) page.

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Container
  title Containers: Angular SaaS Kit

  Person(visitor, "Adopter or visitor", "Uses the dashboard and the landing page")

  System_Boundary(kit, "Angular SaaS Kit (one Nx workspace)") {
    Container(landing, "landing", "Angular 22, prerendered", "Marketing page. Static output on Pages; a Node server build is also configured")
    Container(dashboard, "dashboard", "Angular 22, zoneless SPA", "Admin shell with an overview page on live data and a settings page; four more sections are planned")
    Container(e2e, "dashboard-e2e", "Playwright", "Browser tests for theming, the sidebar and the theme switcher's keyboard behaviour. Run in CI on Chromium")
    Container(tokens, "tokens", "Angular library and CSS", "Design tokens, Tailwind v4 theme mapping, ThemeService, anti-flash script")
    Container(ui, "ui", "Angular library", "Components on the semantic tokens: Button, Card, Table, Icon and the rest, the ThemeSwitcher, and cn()")
    Container(mockapi, "mock-api", "Angular library", "HTTP interceptor serving registered routes from memory. The dashboard uses it in development and in the demo")
  }

  Rel(visitor, landing, "Reads")
  Rel(visitor, dashboard, "Explores")
  Rel(landing, tokens, "Imports")
  Rel(dashboard, tokens, "Imports")
  Rel(dashboard, ui, "Imports")
  Rel(dashboard, mockapi, "Imports, outside production builds")
  Rel(ui, tokens, "Imports")
  Rel(e2e, dashboard, "Drives")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## The containers

| Container       | Kind        | Tags                          | Notes                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landing`       | application | `type:app`, `scope:landing`   | Prerendered, hydrates in the browser ([ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md)).                                                                                                                                                                                                                 |
| `dashboard`     | application | `type:app`, `scope:dashboard` | Client-side SPA; hash routing in the Pages build ([ADR 0011](../adr/0011-github-pages-demo-site.md)). Its pages and their `HttpClient` load lazily; the mock backend answers `/api` except in the production build.                                                                                                              |
| `tokens`        | library     | `type:lib`, `scope:shared`    | Built as an npm package that ships its stylesheets and passes `npm run check:packages`; nothing is published yet ([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)). Imports no other project, and its stylesheet references none ([ADR 0004](../adr/0004-semantic-design-tokens-and-three-axis-theming.md)). |
| `ui`            | library     | `type:lib`, `scope:shared`    | Built as an npm package that declares what it imports and passes `npm run check:packages`; nothing is published yet. Imports only `tokens` ([ADR 0005](../adr/0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)).                                                                                                        |
| `mock-api`      | library     | `type:lib`, `scope:shared`    | Not published. The dashboard imports it from a file that the production build replaces ([ADR 0006](../adr/0006-in-memory-mock-api-instead-of-a-backend.md)).                                                                                                                                                                     |
| `dashboard-e2e` | e2e         | none                          | Playwright, against `nx run dashboard:serve` on port 4200. Configured for Chromium, Firefox and WebKit; CI runs Chromium.                                                                                                                                                                                                        |

## Dependency direction

`landing` and `dashboard` depend on libraries, and `ui` depends on `tokens`:

```
landing ───┐
           ├──► tokens ◄── ui ◄── dashboard
dashboard ─┘
dashboard ───► mock-api   (development and the demo; the production build swaps it out)
```

Two kinds of edge are drawn on purpose, because `npx nx graph` shows only the first:

- **Imports**: TypeScript imports through the `@angular-saas-kit/*` path aliases.
- **Stylesheet references**: CSS `@import` and `@source` across project folders. Both
  apps get their design system through `@import '../../../libs/tokens/src/styles.css'`,
  and the dashboard also declares `@source '../../../libs/ui/src'` so that Tailwind emits
  the utilities the `ui` templates use. Each consumer declares its own sources: the
  tokens entry stylesheet declares none, which is what lets it work from anywhere,
  installed under `node_modules` included ([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)).

`dashboard-e2e` reaches `dashboard` through `implicitDependencies` in its
`project.json`.

## What the map guarantees, and what it does not

The check makes the map and the code agree, in both directions: a dependency in the
source that is not drawn fails CI, and so does one drawn that no longer exists. A new
edge therefore shows up in review as a change to this page.

The check does **not** forbid an edge; lint does, for TypeScript imports. The `type:` and
`scope:` tags on each project are turned into rules by `@nx/enforce-module-boundaries`: an
app may depend only on libraries, a shared library only on shared libraries, the dashboard
and the landing page only on their own scope and on shared code, and nothing may import
itself in a circle ([ADR 0015](../adr/0015-enforce-module-boundaries-with-nx-tags.md)).

Lint cannot see a stylesheet. The CSS references, such as the apps importing the tokens
stylesheet and the dashboard's `@source` for `ui`, are covered only by this map and its
check.

## A coupling the map does not draw

`libs/tokens/src/lib/theme-init.spec.ts` reads `apps/dashboard/src/index.html` and
`apps/landing/src/index.html` to prove each still carries the same anti-flash script as
`THEME_INIT_SCRIPT`. It is a test reading files, not an import, so it is not an edge;
it is why editing that script means editing three places
([components](c4-components.md#tokens)).

Next: [components](c4-components.md).
