# 0008. Vitest, through the Angular test builder, with coverage

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact; coverage added in [#6](https://github.com/nguyenan97/angular-saas-kit/pull/6))
- **Deciders:** @nguyenan97

## Context

Angular's own test story moved from Karma and Jasmine to Vitest. The kit wants unit
tests that run in Node with jsdom - fast enough for a pre-push habit - plus
coverage, and it wants the same runner for apps and libraries.

## Decision

Unit tests run on **Vitest** with **jsdom**, driven by:

- `@angular/build:unit-test` for `dashboard` and `landing`
- `@nx/angular:unit-test` for `tokens` and `ui` (its schema extends the Angular
  builder's, so the options are identical)
- `@nx/vitest:test` for `mock-api`, which is plain TypeScript with no Angular build

Coverage uses the `v8` provider with `lcov` and `text-summary` reporters, enabled
in each project's `test` target. Each target declares its `outputs`
(`coverage/<project>`) so an Nx cache hit restores the report. End-to-end tests
use Playwright (`dashboard-e2e`); they are not part of CI yet.

## Alternatives considered

- **Karma and Jasmine** - the previous default, needs a real browser, and is on its
  way out.
- **Jest** - it is still in `devDependencies` from the workspace generator, but no
  project's test target uses it.
- **Component tests in Playwright** - valuable later; too slow as the everyday loop.

## Consequences

- One runner and one config style everywhere, in Node.
- **Coverage instrumentation changes module-location APIs.** With coverage on,
  `__dirname` and `import.meta.dirname` resolve to the wrong directory in a spec
  file, which broke a test that climbed "four levels from here". Specs take the
  workspace root from `@nx/devkit` instead ([#6](https://github.com/nguyenan97/angular-saas-kit/pull/6)).
- The Angular builders expose no coverage output directory, so `outputs` names the
  default location (`coverage/<project>`) explicitly, and the Codecov step finds
  reports by search rather than by path.
- **Vitest 5 is not supported yet** by `@angular/build` (peer `^4.0.8`),
  `@nx/vitest` (`^3 || ^4`) or `@analogjs/vitest-angular` (up to `^4`), so major
  bumps are ignored ([0010](0010-dependabot-grouping-and-ignored-major-versions.md)).
- **Debt:** `@nx/vitest:test` is deprecated and removed in Nx 24. `mock-api` has to
  move to the inferred `@nx/vitest/plugin` before Nx is upgraded that far.
- Tests must run on Node 22 or newer (`engines`). On Node 20 the Vitest worker
  fails to start with `webidl.util.markAsUncloneable is not a function`.

## References

- [`vitest.config.mts`](../../vitest.config.mts), each project's `project.json`
- [0009](0009-strict-ci-gates-and-a-protected-main.md) - how CI runs them
