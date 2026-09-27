# 0002. One Nx workspace: two apps and shared libraries

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact; the structure dates from the scaffold)
- **Deciders:** @nguyenan97

## Context

The kit ships two applications - an admin dashboard and a marketing landing page -
that have to look like one product. Around them sits reusable code: design tokens,
UI components and a mock backend. `libs/tokens` and `libs/ui` are meant to be
publishable to npm, and adopters should be able to lift either app on its own.

## Decision

One Nx workspace, npm, a single lockfile.

- **Apps:** `dashboard`, `landing`, plus `dashboard-e2e` (Playwright).
- **Libraries:** `tokens` (design tokens, theme service), `ui` (components),
  `mock-api` (HTTP interceptor).
- Libraries are consumed inside the workspace through TypeScript path aliases
  (`@angular-saas-kit/*` -> each library's `src/index.ts`), so no build step
  sits between an edit and the apps. `tokens` and `ui` also have ng-packagr
  builds for publishing; `mock-api` has none because it is not meant to ship.
- Projects carry `type:app|lib` and `scope:dashboard|landing|shared` tags.

## Alternatives considered

- **A repository per app** - the two apps would drift apart visually, and every
  design-system change becomes a versioned hand-off.
- **An Angular CLI multi-project workspace without Nx** - no computation cache and
  no `affected` graph, which is what keeps CI proportional to a change.
- **pnpm or Turborepo workspaces** - good task running, but no Angular-aware
  executors or generators.

## Consequences

- `nx affected` limits CI to the projects a change touches, and results are cached
  ([0009](0009-strict-ci-gates-and-a-protected-main.md)).
- One place for lint, test and format configuration.
- **Nx version coupling.** Its plugins pin transitive dependencies (`nx` pins
  `smol-toml` to an exact vulnerable version, which needed an npm override) and
  executors get deprecated: `@nx/vitest:test`, used by `mock-api`, is scheduled
  for removal in Nx 24.
- **The tags are declared but not enforced.** No `@nx/enforce-module-boundaries`
  rule is configured, so nothing stops an app importing another app or a library
  importing an app. Turning it on is a known follow-up.
- **The packages are not publish-ready.** The ng-packagr builds succeed, but the
  built `ui` manifest does not declare `clsx`, `tailwind-merge` or
  `@angular-saas-kit/tokens`, which its code imports, and the built `tokens` package
  contains no stylesheets. Nothing is published, so nothing is broken yet; both have
  to be fixed before a first release.

## References

- [`nx.json`](../../nx.json), [`tsconfig.base.json`](../../tsconfig.base.json)
- [C4 containers](../architecture/c4-containers.md)
- [#23](https://github.com/nguyenan97/angular-saas-kit/pull/23) - the `smol-toml` override
