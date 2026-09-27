# Workspace layout

One Nx workspace, npm, a single lockfile. The reasoning is in
[ADR 0002](../adr/0002-nx-monorepo-with-two-apps-and-shared-libraries.md), and the picture is
the [container diagram](../architecture/c4-containers.md).

```text
apps/
  dashboard/        Admin application: a client-side single-page app
  dashboard-e2e/    Playwright browser tests for the dashboard
  landing/          Marketing page: prerendered, with an optional Node server build
libs/
  tokens/           Design tokens, Tailwind theme mapping, ThemeService
  ui/               Shared components: ThemeSwitcher and the cn() helper
  mock-api/         In-memory HTTP interceptor with realistic latency
docs/
  guide/            The guides on this site
  reference/        These reference pages
  architecture/     C4 diagrams
  adr/              Architecture decision records
  .vitepress/       Configuration and theme of this site
scripts/            Build and check scripts for the demo site and the architecture map
.github/
  workflows/        ci.yml, codeql.yml, pages.yml
  ISSUE_TEMPLATE/   Bug, component request and accessibility forms
  dependabot.yml    Dependency update policy
```

## Projects and tags

Every project carries a `type:` and a `scope:` tag.

| Project         | Tags                          | Depends on                              |
| --------------- | ----------------------------- | --------------------------------------- |
| `landing`       | `type:app`, `scope:landing`   | `tokens`                                |
| `dashboard`     | `type:app`, `scope:dashboard` | `tokens`, `ui`                          |
| `tokens`        | `type:lib`, `scope:shared`    | none in code; its stylesheet scans `ui` |
| `ui`            | `type:lib`, `scope:shared`    | `tokens`                                |
| `mock-api`      | `type:lib`, `scope:shared`    | none; nothing depends on it yet         |
| `dashboard-e2e` | none                          | `dashboard`                             |

Lint turns the tags into rules with `@nx/enforce-module-boundaries`, so a wrong import fails
`npm run lint`:

- an app may depend only on libraries (`type:lib`), and nothing imports an app;
- a shared library may depend only on shared libraries;
- the dashboard and the landing page may depend on their own scope and on shared code, never
  on each other;
- a buildable library (`tokens`, `ui`) may depend only on other buildable libraries;
- projects may not depend on each other in a circle.

`npm run check:architecture` keeps the table above true to the code, including the stylesheet
references that lint cannot see. See
[ADR 0015](../adr/0015-enforce-module-boundaries-with-nx-tags.md).

## Import aliases

Libraries are consumed inside the workspace through TypeScript path aliases in
`tsconfig.base.json`, so there is no build step between an edit and the apps:

| Alias                        | Points at                    |
| ---------------------------- | ---------------------------- |
| `@angular-saas-kit/tokens`   | `libs/tokens/src/index.ts`   |
| `@angular-saas-kit/ui`       | `libs/ui/src/index.ts`       |
| `@angular-saas-kit/mock-api` | `libs/mock-api/src/index.ts` |

Code imports a library through its alias. The one place a relative path crosses projects is a
stylesheet: a CSS `@import` cannot use a TypeScript alias, so each app reaches the shared
stylesheet with `@import '../../../libs/tokens/src/styles.css'`.

## Conventions

- **Selectors** carry the `ask` prefix: `ask-theme-switcher` for a component, `askTooltip` for
  a directive. The linter enforces it.
- **Strict TypeScript** (`strict`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
  and friends) and strict Angular templates.
- **Standalone, `OnPush`, signal-based components**, and no `zone.js`.
- **Tests** sit next to the code as `*.spec.ts`; browser tests live in `apps/dashboard-e2e`.
- **Formatting** is Prettier, applied by a hook on commit and checked in CI: single quotes,
  trailing commas, 80 columns (100 for HTML).
