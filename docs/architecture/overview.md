# Architecture overview

The whole architecture on one page, in the order of a shortened [arc42](https://arc42.org)
template. Each section is a few lines and a link to where the detail lives: the C4 pages for the
shapes, the [decision records](../adr/README.md) for the reasons, [`CONSTRAINTS.md`](../../CONSTRAINTS.md)
for the numbers.

## 1. Goals

A free, MIT-licensed Angular 22 admin dashboard and landing page that a team can start a product
from and keep for years: zoneless and signals-first, on a design system of semantic tokens that
reskins along three axes set on the html element, accessible by default, with every quality rule checked by machine.

| Quality goal    | What it means here                                                              | Held by                                          |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Accessibility   | Keyboard operable, visible focus, announced state; no serious axe violation     | template a11y lint, `accessibility.spec.ts`      |
| Themeability    | Components name roles, never colours; light and dark, four accents, four radii  | `npm run check:tokens` (ADR 0004, 0022)          |
| Maintainability | Module boundaries by tag, a C4 map that matches the code, small checked changes | lint, `check:architecture`, `CONSTRAINTS.md`     |
| Performance     | Initial bundle under 350 kB per app (error at 500 kB), lazy pages               | build budgets                                    |
| Supply chain    | Pinned actions, strict installs, reviewed new dependencies                      | zizmor, dependency review, gitleaks (0024, 0026) |

## 2. Constraints

- Angular 22, zoneless, `OnPush` and signals only ([ADR 0003](../adr/0003-zoneless-signals-first-onpush-components.md)).
- No UI-library dependency; the Angular CDK and Tailwind only ([ADR 0005](../adr/0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)).
- One Nx workspace, npm, one lockfile ([ADR 0002](../adr/0002-nx-monorepo-with-two-apps-and-shared-libraries.md)).
- One maintainer, so no required review approval; branch protection and CI gates instead
  ([ADR 0009](../adr/0009-strict-ci-gates-and-a-protected-main.md)).
- Static hosting on GitHub Pages for the demo ([ADR 0011](../adr/0011-github-pages-demo-site.md)).

## 3. Context

Developers who use the kit, their end users, GitHub (CI, Pages) and npm. See
[System context](c4-context.md).

## 4. Solution strategy

- **A prerendered landing page and a client-side dashboard** ([ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md)).
- **Semantic tokens and three theme axes** in `libs/tokens`, consumed by every component
  ([ADR 0004](../adr/0004-semantic-design-tokens-and-three-axis-theming.md)).
- **A small component library** in `libs/ui`, built as a package ([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)).
- **An in-memory mock API** instead of a backend, outside production builds only
  ([ADR 0006](../adr/0006-in-memory-mock-api-instead-of-a-backend.md)).
- **Bounded contexts as Nx libraries** with a pure domain layer, for the business features to come
  ([ADR 0021](../adr/0021-bounded-contexts-as-nx-libraries.md)).

## 5. Building blocks

The apps and libraries and who uses whom: [Containers](c4-containers.md), checked against the code
by `npm run check:architecture`. What is inside each: [Components](c4-components.md). The
libraries' own READMEs give their public API.

## 6. Runtime

No dynamic view is drawn yet: the interesting runtime path (a dashboard page calling the mock API
through `HttpClient`) is described in the [mock API guide](../guide/mock-api.md). A sequence
diagram comes with the first flow that crosses a real network boundary.

## 7. Deployment

A laptop, CI and GitHub Pages: [Deployment](c4-deployment.md). The landing page can also run on
its Node server ([Deploying](../guide/deploying.md)); nothing runs in production for users.

## 8. Cross-cutting concepts

- **Theming**: the [theming guide](../guide/theming.md); the init script lives in three places,
  kept equal by a test.
- **Accessibility**: native elements before ARIA roles, the CDK for focus management, axe in the
  browser tests ([components guide](../guide/components.md)).
- **State**: `signal` and `computed`; RxJS only at the edges; `httpResource` for data.
- **Testing**: Vitest through the Angular builder, Playwright in Chromium ([testing guide](../guide/testing.md)).
- **Process**: [the development process](../guide/development-process.md), with its gates.

## 9. Decisions

Twenty-odd records, each with the alternatives that lost: the [ADR index](../adr/README.md).

## 10. Quality requirements

Every enforced rule with its number and its command is in [`CONSTRAINTS.md`](../../CONSTRAINTS.md);
the quality goals in section 1 point into it.

## 11. Risks and technical debt

| Item                                                              | Effect                                                  | Plan                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| No backend, auth or observability                                 | The dashboard runs on mock data; nothing to operate     | Evolution path below; each arrives with an ADR      |
| `braces` advisory through Storybook's webpack builder             | `npm audit` reports 9 high, dev-only                    | Exception in `CONSTRAINTS.md`, review by 2027-01-17 |
| Initial bundles within a few kB of the 350 kB warning             | The next large dependency trips the budget              | Lazy routes and `@defer`; the `refactor` skill      |
| `overrides` for `nx`'s pinned `undici` and other transitive fixes | Must be dropped when upstream catches up                | Checked at each Dependabot triage                   |
| One maintainer                                                    | No second human reviewer; Scorecard marks Code-Review 0 | Independent agent review in the process (ADR 0025)  |

## 12. Glossary

Each bounded context has its own: [Booking](../../libs/booking/GLOSSARY.md),
[shared kernel](../../libs/shared/GLOSSARY.md).

## Evolution path (planned, not built)

- **Backend.** The dashboard already talks to `/api` through `HttpClient` with the shapes in
  `apps/dashboard/src/app/data/models.ts`; the mock interceptor answers today. A real server
  replaces the interceptor, not the pages, behind the same shapes, and gets its own container on
  the C4 map, a deployment page and a runbook.
- **Authentication.** The sign-in and sign-up pages are forms on the mock. A real identity provider
  arrives with an ADR, a STRIDE review (the `solution-design` and `security-review` skills) and the
  OWASP ASVS authentication and session chapters as its checklist.
- **Observability.** Logs, metrics and traces arrive with the first server; until then there is
  nothing to observe beyond CI.
- **Release.** `libs/ui` and `libs/tokens` publish with provenance and an SBOM when an npm scope
  exists; the `Security scans` workflow already produces the SBOM.
