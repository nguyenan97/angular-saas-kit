# 0010. Dependabot grouping and ignored major versions

- **Status:** Accepted
- **Date:** 2026-09-26
- **Deciders:** @nguyenan97

## Context

Dependabot opens weekly npm pull requests and monthly GitHub Actions ones. On this
tree they failed in two repeating ways.

1. **The Angular set was split across two PRs.** The `dev-minor` group
   (`dependency-type: development`) took the dev-only Angular and Nx packages
   (`@angular/build`, `cli`, `compiler-cli`, `@angular-devkit/*`, `@nx/*`), leaving
   the runtime `@angular/*` packages in the `angular` group. `@angular/compiler`
   and `@angular/compiler-cli` peer-depend on each other's exact version, so neither
   half installed on its own. The same pair appeared on 12, 19 and 26 September.
2. **Some major versions cannot land.** Vitest 5 was proposed for `@vitest/*`, but
   `@angular/build` (peer `^4.0.8`), `@nx/vitest` (`^3 || ^4`) and
   `@analogjs/vitest-angular` (up to `^4`) do not support it, so `npm ci` failed
   with `ERESOLVE`. `@types/node` 26 was proposed for a repository whose minimum
   Node is 22, which would let code that only runs on newer Node compile.

## Decision

In [`.github/dependabot.yml`](../../.github/dependabot.yml):

- The `dev-minor` group excludes `@angular/*`, `@angular-devkit/*`, `angular-eslint`,
  `@nx/*` and `nx`, so they can only travel in the `angular` and `nx` groups.
- Major updates are ignored for `vitest`, `@vitest/*` and `@types/node`. The Vitest
  entries are dropped once all three tools widen their peer range; `@types/node`
  stays on the minimum supported Node.

_Amended 2026-10-03:_ the first run after this change kept `@angular/build`, `cli` and
`compiler-cli` with the rest of Angular, in one PR
([#51](https://github.com/nguyenan97/angular-saas-kit/pull/51)). `@schematics/angular`, which
ships with `@angular/cli` at the same version and matches neither pattern, still went to
`dev-minor` ([#52](https://github.com/nguyenan97/angular-saas-kit/pull/52)), so each PR
installed a nested copy of the other's version. Both groups now name it.

Dependabot security updates are enabled, and PRs are triaged before merging: a PR
that fails `npm ci` is never merged, and unsupported bumps are closed with the
reason.

## Alternatives considered

- **Merge red PRs and fix forward** - breaks `npm ci` for everyone; only the CI gates
  ([0009](0009-strict-ci-gates-and-a-protected-main.md)) prevent it.
- **One big group for everything** - hides which bump broke the build.
- **Turn Dependabot off and upgrade by hand** - loses the security updates.

## Consequences

- Angular packages move together in one PR, so a bump either installs or is visibly
  red for a single reason. Whether the grouping now behaves as intended is only
  proven by the next Monday run; the `dev-minor` group already dropped from 36
  updates to 3.
- A security update can propose a fix that is worse than the alternative. The
  advisory in `uuid` came only through `@angular-devkit/build-angular`, which
  nothing used, and Dependabot proposed upgrading it to 22.2 (red on every job)
  rather than removing it. Read the dependency chain before accepting the fix
  ([#23](https://github.com/nguyenan97/angular-saas-kit/pull/23)).
- **npm keeps a lockfile entry that any edge still points at, optional peers
  included.** Removing a dependency from `package.json` can leave its whole subtree
  in the lockfile, so the entries used only by it have to be pruned as well.
- `nx` pins `smol-toml` to an exact vulnerable version and no fixed Nx release
  exists yet, so an npm `overrides` entry forces `^1.7.1`. It must be dropped once
  Nx ships a fix. _Amended 2026-10-03:_ Nx 23.2.1 also pins `axios` 1.18.1 and
  `brace-expansion` 5.0.9, with advisories fixed in 1.20.0 and 5.0.12, so `overrides`
  forces `axios` to `^1.20.0` and, inside `nx` only, `brace-expansion` to `^5.0.12`. A
  global `brace-expansion` override would force 5.x on the 2.x copy that `test-exclude`
  needs. Drop all three when Nx ships the fixes.
- _Amended 2026-10-03:_ the `verdaccio` local registry, the `local-registry` target the
  workspace generator added, was used by nothing and brought 16 advisories. It is gone,
  with its 266 lockfile entries. Testing a publish locally can bring it back, pinned to
  a release without them.
- Merging Dependabot PRs one after another means an "Update branch" each, and
  `@dependabot rebase` when a lockfile conflicts.

## References

- [#17](https://github.com/nguyenan97/angular-saas-kit/pull/17), [#16](https://github.com/nguyenan97/angular-saas-kit/pull/16), [#23](https://github.com/nguyenan97/angular-saas-kit/pull/23)
