# Level 3: Components

What is inside each container. Every arrow is an import, a registration or a
reference that exists in the source today. Helper functions and private types are
left out: this is the map, not the index.

- [tokens](#tokens) - the theme, and the heart of the kit
- [dashboard](#dashboard)
- [landing](#landing)
- [ui](#ui)
- [mock-api](#mock-api)

## tokens

Owns the design tokens and the runtime that switches them. Everything else in the kit
reads from here ([ADR 0004](../adr/0004-semantic-design-tokens-and-three-axis-theming.md)).
The blue boxes are the components; the grey one is the code that uses them.

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Component
  title Components: tokens

  Component(init, "THEME_INIT_SCRIPT", "TypeScript string", "Source text of the blocking script that applies the stored theme before first paint")
  Container_Ext(apps, "landing and dashboard", "Angular apps", "Inject the service, import the stylesheet, keep a copy of the script in index.html")
  Component(entry, "styles.css", "CSS entry", "Imports Tailwind with scanning off, then the two stylesheets. Declares no sources: each consumer does")
  Component(types, "Theme types", "TypeScript", "COLOR_MODES, ACCENTS, RADII, DEFAULT_THEME and the storage key ask.theme.v1")
  Component(service, "ThemeService", "Angular service, signals", "Holds mode, accent and radius. Effects apply them to the html element and save them to localStorage")
  Component(sheets, "tokens.css and theme.css", "CSS", "Semantic tokens as OKLCH custom properties with the dark, accent and radius rules; and their mapping onto Tailwind utilities")

  Rel(apps, init, "Keep a copy of", "checked by a test")
  Rel(apps, entry, "Import")
  Rel(apps, service, "Inject")
  Rel(init, types, "Reads the key from")
  Rel(service, types, "Reads defaults from")
  Rel(entry, sheets, "Imports")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| Component           | Source                                                                                                                                                                   | Notes                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThemeService`      | [`theme.service.ts`](../../libs/tokens/src/lib/theme.service.ts)                                                                                                         | `providedIn: 'root'`. Constructed on the server too, so every DOM and storage access is behind a platform check. The server renders the default theme; the browser corrects it on hydration.                                                                                     |
| Theme types         | [`theme.types.ts`](../../libs/tokens/src/lib/theme.types.ts)                                                                                                             | The axes are `const` tuples, so a picker iterates the same list the types come from.                                                                                                                                                                                             |
| `THEME_INIT_SCRIPT` | [`theme-init.ts`](../../libs/tokens/src/lib/theme-init.ts)                                                                                                               | An inline script cannot import, so each app's `index.html` holds a hand-kept copy. `theme-init.spec.ts` fails when a copy drifts. Change all three together.                                                                                                                     |
| Stylesheets         | [`styles.css`](../../libs/tokens/src/styles.css), [`tokens.css`](../../libs/tokens/src/lib/styles/tokens.css), [`theme.css`](../../libs/tokens/src/lib/styles/theme.css) | Order matters: Tailwind, then the raw variables, then the mapping. `source(none)` switches off Tailwind's automatic scan, so each app ships only its own utilities: it declares its own `@source`s, and the entry declares none, so it works installed under `node_modules` too. |

## dashboard

A client-side single-page app ([ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md)).
No server, no hydration, no data layer yet.

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Component
  title Components: dashboard

  Container_Ext(tokens, "tokens", "Angular library and CSS", "ThemeService and the shared stylesheet")
  Container_Ext(ui, "ui", "Angular library", "ThemeSwitcher")

  Container_Boundary(dashboard, "dashboard") {
    Component(shell, "App", "Standalone component, OnPush, Angular CDK", "Sidebar (a rail from lg up, a modal drawer below), topbar with the menu button, the page title and a dark-mode button, router outlet, theme panel")
    Component(main, "main.ts", "Bootstrap", "Starts App with appConfig")
    Component(config, "appConfig", "Application providers", "Global error listeners, the router and the title strategy")
    Component(title, "PageTitle", "TitleStrategy, signals", "Turns the title of each route into the topbar heading and the document title")
    Component(overview, "Overview", "Standalone component, lazy", "Four stat cards with static numbers; exercises the tokens on a real surface")
    Component(routes, "appRoutes", "Route table", "The empty path lazy-loads Overview; any other path redirects to it")
    Component(mode, "routerFeatures", "routing-mode.ts", "Empty by default; the Pages build swaps in withHashLocation")
  }

  Rel(shell, tokens, "Toggles the theme")
  Rel(shell, ui, "Embeds the switcher")
  Rel(main, shell, "Bootstraps")
  Rel(main, config, "Bootstraps with")
  Rel(shell, overview, "Shows through the outlet")
  Rel(shell, title, "Reads the title from")
  Rel(config, routes, "Registers")
  Rel(config, title, "Registers")
  Rel(config, mode, "Spreads")
  Rel(routes, overview, "Lazy-loads")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| Component        | Source                                                                                                                                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App`            | [`app.ts`](../../apps/dashboard/src/app/app.ts), [`app.html`](../../apps/dashboard/src/app/app.html)                                             | From the `lg` breakpoint up (`BreakpointObserver`) the sidebar is a rail beside the content; below it, a drawer over it. The open drawer traps focus (`CdkTrapFocus`), makes the content column inert and closes on Escape, its Close button, the backdrop or a followed link, handing focus back to the menu button. Widths are the layout tokens. The five planned pages are text with a "soon" badge, not links. |
| `PageTitle`      | [`page-title.ts`](../../apps/dashboard/src/app/page-title.ts)                                                                                    | A `TitleStrategy`: the router calls it after every navigation. It keeps the title in a signal for the topbar `h1`, so a page starts its own headings at `h2`, and sets the document title.                                                                                                                                                                                                                          |
| `appRoutes`      | [`app.routes.ts`](../../apps/dashboard/src/app/app.routes.ts)                                                                                    | Every route has a `title`. The `**` redirect sends an unknown path to Overview.                                                                                                                                                                                                                                                                                                                                     |
| `Overview`       | [`overview.ts`](../../apps/dashboard/src/app/pages/overview.ts)                                                                                  | Placeholder. Nothing here fetches data, so the [mock API](#mock-api) is not involved.                                                                                                                                                                                                                                                                                                                               |
| `routerFeatures` | [`routing-mode.ts`](../../apps/dashboard/src/app/routing-mode.ts), [`routing-mode.pages.ts`](../../apps/dashboard/src/app/routing-mode.pages.ts) | Swapped at build time by `fileReplacements` in the `pages` configuration, so the Pages demo gets hash URLs and every other build keeps path URLs ([ADR 0011](../adr/0011-github-pages-demo-site.md)).                                                                                                                                                                                                               |

## landing

The marketing page. It is built two ways from one source: static files for GitHub
Pages, or a server output that runs behind Node ([deployment](c4-deployment.md)).

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Component
  title Components: landing

  Container_Ext(tokens, "tokens", "Angular library and CSS", "ThemeService and the shared stylesheet")

  Container_Boundary(landing, "landing") {
    Component(config, "appConfig", "Application providers", "Client hydration with event replay, global error listeners, an empty router")
    Component(main, "main.ts", "Browser entry", "Starts App with appConfig")
    Component(shell, "App", "Standalone component, OnPush", "Header with GitHub link and dark-mode button, hero with call-to-action links, footer")
    Component(links, "SITE_LINKS", "site-links.ts", "The demo link: none by default; the Pages build swaps in demo/")
    Component(serverroutes, "serverRoutes", "Server route table", "Every path is prerendered")
    Component(serverconfig, "app.config.server.ts", "Application providers", "appConfig plus server rendering and the server routes")
    Component(servermain, "main.server.ts", "Server entry", "Starts App with the server config, for prerendering and server rendering")
    Component(express, "server.ts", "Express 5", "Serves static files, then hands every other request to Angular. Used by the server output only")
    Component(fallback, "404.html", "Static page", "What GitHub Pages serves for an unknown path")
  }

  Rel(shell, tokens, "Toggles the theme")
  Rel(main, config, "Bootstraps with")
  Rel(main, shell, "Bootstraps")
  Rel(shell, links, "Reads")
  Rel(servermain, serverconfig, "Bootstraps with")
  Rel(servermain, shell, "Bootstraps")
  Rel(serverconfig, config, "Extends")
  Rel(serverconfig, serverroutes, "Registers")
  Rel(express, servermain, "Renders through")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

| Component    | Source                                                                                                                                                                                                        | Notes                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App`        | [`app.ts`](../../apps/landing/src/app/app.ts), [`app.html`](../../apps/landing/src/app/app.html)                                                                                                              | The router has no routes: the page is the shell. The "Live demo" button renders only when `SITE_LINKS.demo` is set.                                                                                                 |
| `SITE_LINKS` | [`site-links.ts`](../../apps/landing/src/app/site-links.ts), [`site-links.pages.ts`](../../apps/landing/src/app/site-links.pages.ts), [`site-links.types.ts`](../../apps/landing/src/app/site-links.types.ts) | Swapped at build time like the dashboard's `routerFeatures`; the shared type lives in its own file so neither variant imports the other.                                                                            |
| `server.ts`  | [`server.ts`](../../apps/landing/src/server.ts)                                                                                                                                                               | Express 5 rejects a bare `/**` route, so the catch-all is `app.use` with no path. Refuses every request until `NG_ALLOWED_HOSTS` is set ([ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md)). |
| `404.html`   | [`404.html`](../../apps/landing/public/404.html)                                                                                                                                                              | Self-contained, with absolute links under `/angular-saas-kit/`.                                                                                                                                                     |

## ui

The components, the switcher and `cn`, and the reason `ui` depends on `tokens`.

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Component
  title Components: ui

  Container_Ext(dashboard, "dashboard", "Angular app", "Embeds the switcher")
  Component(switcher, "ThemeSwitcher", "Standalone component, OnPush", "Three fieldsets of native radio inputs for mode, accent and radius. Selector ask-theme-switcher")
  Component(kit, "Badge, Button, Card, Icon, Input, Label, Table, SortHeader", "Components and directives, OnPush", "Semantic tokens only. The ones that style a native element are directives on it")
  Container_Ext(tokens, "tokens", "Angular library and CSS", "ThemeService and the theme constants")
  Component(cn, "cn", "Function", "clsx, then tailwind-merge: the last class wins, so a consumer can override a default")
  Container_Ext(lucide, "lucide", "npm package", "Icon drawings as data, on a 24 x 24 grid")

  Rel(dashboard, switcher, "Embeds")
  Rel(switcher, tokens, "Injects ThemeService")
  Rel(switcher, cn, "Builds classes with")
  Rel(kit, cn, "Build classes with")
  Rel(kit, lucide, "SortHeader takes its arrows from")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

`ThemeSwitcher` ([source](../../libs/ui/src/lib/theme-switcher/theme-switcher.ts)) knows no
colour value: it only calls `ThemeService`, which flips attributes on the html element.
That makes it the kit's proof that the token layer works. `cn`
([source](../../libs/ui/src/lib/utils/cn.ts)) is the helper every component funnels its
host classes through ([ADR 0005](../adr/0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)).

The other components are listed in the [components guide](../guide/components.md#what-exists),
each with a README next to its source. `Button`, `Input`, `Label`, `Table` and the card parts are
directives on the native element they style; `Icon` draws a Lucide icon's data as inline SVG
([ADR 0017](../adr/0017-icons-from-lucide-data-drawn-by-one-component.md)). Nothing in the
workspace uses them yet apart from their tests; the dashboard's pages will.

The package also ships a one-line stylesheet, `libs/ui/assets/styles.css`, that points
Tailwind at the compiled components (`@source './fesm2022'`) so an app that installs the
package gets the utilities they use. Nothing in the workspace imports it: the dashboard
points Tailwind at `libs/ui/src` directly. See
[ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md).

## mock-api

Built and tested, and used by nothing yet ([ADR 0006](../adr/0006-in-memory-mock-api-instead-of-a-backend.md)).

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Component
  title Components: mock-api

  Container_Boundary(mockapi, "mock-api") {
    Component(registry, "MOCK_ROUTES", "Array and registerMockRoutes", "Where an app registers its routes: method, path pattern and handler")
    Component(interceptor, "mockApiInterceptor", "HttpInterceptorFn", "Answers a request from a registered route after a delay, or passes it on to the network")
    Component(latency, "randomLatency", "Function", "A delay between 200 and 600 ms, so loading states are actually rendered")
  }

  Rel(interceptor, registry, "Looks up routes in")
  Rel(interceptor, latency, "Delays with")

  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

A route path may carry `:name` segments, which arrive in the handler as `params`.
A request that matches no route goes to `next(req)`, so the interceptor is safe to add
to an app that already talks to a real API
([source](../../libs/mock-api/src/lib/mock-api.interceptor.ts)).

Next: [deployment](c4-deployment.md).
