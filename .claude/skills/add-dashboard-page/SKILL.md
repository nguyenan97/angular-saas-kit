---
name: add-dashboard-page
description: Add a page to the admin dashboard (apps/dashboard) - a lazy route, a standalone OnPush component on semantic tokens, the sidebar entry and tests. Use when asked to build a dashboard page such as analytics, orders, customers, products or settings.
---

# Add a dashboard page

The dashboard is a client-side SPA: `apps/dashboard/src/app`. Its real pages are Overview,
Orders, Customers, Products and Settings, in `pages/`. Analytics is listed in the sidebar as
"soon": plain text, not a link. For a searchable, sortable, paged list, use `listQuery`
(`data/list-query.ts`), as `orders/orders.ts` does: it holds the state as signals and makes the
request.

## The pieces

| What              | Where                   | Notes                                                                                                                                         |
| ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The page          | `pages/<name>.ts`       | Standalone, `OnPush`, selector `ask-<name>`, signals for state.                                                                               |
| The route         | `pages/pages.routes.ts` | Lazy: `loadComponent: () => import('./<name>').then((m) => m.<Name>)`, and a `title`. Put it before the `**` redirect.                        |
| The sidebar entry | `nav` array in `app.ts` | The planned pages are there with `soon: true`. Remove `soon` when the page is real, and the entry becomes a link; add an item for a new page. |
| A test            | `pages/<name>.spec.ts`  | Zoneless. `overview.spec.ts` shows a page that fetches; `settings.spec.ts` one that does not.                                                 |

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

Fetch with `httpResource` (stable in Angular 22): a signal for the value, the loading state and
the error, and no RxJS in the page. `HttpClient` is provided in `pages/pages.routes.ts`, not in
`app.config.ts`, so it stays out of the initial bundle; keep it there.

- **The API.** Its shapes are in `data/models.ts` (money in cents, dates as ISO strings) and the
  mock answers them from `mock/routes.ts` over the seeded data in `mock/seed.ts`. A new endpoint
  goes in `mock/routes.ts` with a test in `mock/routes.spec.ts`; `docs/guide/mock-api.md` lists
  what exists. The production build has no mock (`mock-backend.production.ts`), so never import
  from `mock/` in a page.
- **Every state.** Show placeholders and `aria-busy` while loading, an error with a retry
  (`resource.reload()`), and an empty state. Read `value()` only outside the error branch: it
  throws when the resource has failed.
- **Test it** with `provideHttpClientTesting()` and `HttpTestingController`: `TestBed.tick()` sends
  the requests, `expectOne(...).flush(...)` answers them. See `overview.spec.ts`.
- **Say it is demo data.** The topbar's "Demo data" label covers the pages; the PR and the docs
  must say the numbers are mocked too.

## The demo site

The Pages demo runs the dashboard with hash routing (`routing-mode.pages.ts`), so a new route must
work as `#/<path>`. `npm run pages && npm run pages:preview` serves it at
`http://localhost:8123/angular-saas-kit/demo/`; click through to the new page and reload it.

## Finish

`npx nx test dashboard`, then the `verify` skill, then `open-pr`. If the page changes what the
dashboard is (a new dependency on a library, say), update `docs/architecture` (see
`update-architecture`).
