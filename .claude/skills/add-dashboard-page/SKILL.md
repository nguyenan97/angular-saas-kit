---
name: add-dashboard-page
description: Add a page to the admin dashboard (apps/dashboard) - a lazy route, a standalone OnPush component on semantic tokens, the sidebar entry and tests. Use when asked to build a dashboard page such as analytics, orders, customers, products or settings.
---

# Add a dashboard page

The dashboard is a client-side SPA: `apps/dashboard/src/app`. Today it has one real page,
`Overview` (`pages/overview.ts`). Five more are listed in the sidebar as "soon": plain text,
not links.

## The pieces

| What              | Where                   | Notes                                                                                                                                         |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The page          | `pages/<name>.ts`       | Standalone, `OnPush`, selector `ask-<name>`, signals for state.                                                                               |
| The route         | `app.routes.ts`         | Lazy: `loadComponent: () => import('./pages/<name>').then((m) => m.<Name>)`, and a `title`. Put it before the `**` redirect.                  |
| The sidebar entry | `nav` array in `app.ts` | The planned pages are there with `soon: true`. Remove `soon` when the page is real, and the entry becomes a link; add an item for a new page. |
| A test            | `pages/<name>.spec.ts`  | Zoneless; see `app.spec.ts` for the setup.                                                                                                    |

## Rules

- **Semantic tokens only** (`bg-card`, `text-muted-foreground`, `text-success`, `text-destructive`).
  No colour literals. Check the page in light and dark and with all four accents.
- **Signals, not RxJS state.** Keep RxJS at the edges (HTTP).
- **Accessibility is a gate.** Headings in order (one `h1` per page), labelled controls, tables with
  headers, visible focus, live regions for async results.
- Use components from `@angular-saas-kit/ui` where one exists. If you need one that does not, use the
  `add-ui-component` skill instead of building it inline in the page.

## Titles and headings

The route's `title` is the page's name. `PageTitle` (`page-title.ts`, a `TitleStrategy`) shows it
in the topbar as the page's one `h1` and sets the document title, so a page does not render an `h1`
of its own: its headings start at `h2`.

## Layout

Below the `lg` breakpoint the sidebar is a drawer, so a page gets the full width of a phone. Check
the page at 375 px as well as on a desktop, and let wide content (a table, say) scroll inside its own
container rather than the page.

## Data

Nothing in the dashboard fetches anything yet, and the mock API (`libs/mock-api`) is not wired in.
If the page needs data, read `docs/guide/mock-api.md`: register routes, install the interceptor
next to `provideHttpClient` in `app.config.ts`, and keep it out of production builds (a file
replacement, like `routing-mode.ts`). Do not present fake numbers as real ones; the docs and the
PR must say the data is mocked.

## The demo site

The Pages demo runs the dashboard with hash routing (`routing-mode.pages.ts`), so a new route must
work as `#/<path>`. `npm run pages && npm run pages:preview` serves it at
`http://localhost:8123/angular-saas-kit/demo/`; click through to the new page and reload it.

## Finish

`npx nx test dashboard`, then the `verify` skill, then `open-pr`. If the page changes what the
dashboard is (a new dependency on a library, say), update `docs/architecture` (see
`update-architecture`).
