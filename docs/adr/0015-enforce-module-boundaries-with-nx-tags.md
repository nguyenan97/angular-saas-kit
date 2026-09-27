# 0015. Enforce module boundaries with Nx tags

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

Every project already carries a `type:` tag (`app` or `lib`) and a `scope:` tag (`dashboard`,
`landing` or `shared`), and [0002](0002-nx-monorepo-with-two-apps-and-shared-libraries.md) recorded that
nothing used them: an app could import another app, a shared library could import an app, and a
cycle between libraries would compile. The directions matter here. The two apps must not know
about each other, `tokens` and `ui` are meant to be lifted out and published, and a wrong edge is
cheap to add and expensive to remove later. A reviewer can miss an import; a linter does not.

## Decision

Turn the tags into rules with **`@nx/enforce-module-boundaries`**, configured once in the root
`eslint.config.mjs`, so it runs as part of `lint` on every project and therefore in CI.

- `type:app` and `type:lib` projects may depend only on `type:lib` projects: apps use libraries,
  and nothing imports an app.
- `scope:shared` may depend only on `scope:shared`; `scope:dashboard` and `scope:landing` may depend
  on their own scope and on shared code, never on each other.
- `enforceBuildableLibDependency`: a buildable library (`tokens`, `ui`) may depend only on other
  buildable libraries, because otherwise its package could not be built on its own.
- Circular dependencies between projects are errors (the rule's default).
- The plugin, `@nx/eslint-plugin`, is pinned to the same version as `nx`.

## Alternatives considered

- **Keep relying on review and the architecture map** - the map check ([`check-architecture.mjs`](../../scripts/check-architecture.mjs))
  makes a new edge visible, but it does not say the edge is wrong, and a reviewer has to notice.
- **Custom import restrictions with `no-restricted-imports`** - patterns for each forbidden path,
  written by hand and blind to the project graph.
- **A dependency-cruiser or Sheriff configuration** - capable tools, but a second model of the
  workspace next to the one Nx already has.

## Consequences

- A wrong TypeScript import fails `npm run lint` with a message naming the rule and the tags
  involved. Before this change, no existing import violated it; three deliberate violations
  (a buildable library importing a non-buildable one, a cycle, and an app importing another app by
  a relative path) and a wrong tag were each rejected.
- **Lint cannot see a stylesheet.** CSS references between projects, such as the apps importing
  the tokens stylesheet and the dashboard's `@source` for `ui`, are covered only by the
  architecture map and its check. The two are complements: lint forbids, the check records.
  (When this was written the tokens stylesheet itself scanned `libs/ui`, a dependency in the
  other direction that lint could not see. [0016](0016-packages-declare-and-ship-what-they-need.md)
  removed it.)
- A new project must be tagged, or it is outside the rules. Untagged projects (today only
  `dashboard-e2e`) are not constrained; give a new one both tags.
- Loosening a constraint to make an import pass defeats the point. If an import is rejected, the
  usual answer is that it belongs in a shared library.
- One more dev dependency (five packages) whose version has to move with Nx; it is in the `nx`
  Dependabot group.

## References

- [`eslint.config.mjs`](../../eslint.config.mjs)
- [Nx: enforce module boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [C4 containers](../architecture/c4-containers.md)
