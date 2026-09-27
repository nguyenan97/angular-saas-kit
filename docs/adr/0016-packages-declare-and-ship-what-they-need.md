# 0016. Packages declare what they import and ship what they promise

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

`libs/tokens` and `libs/ui` are meant to be lifted out and published
([0002](0002-nx-monorepo-with-two-apps-and-shared-libraries.md)). Both had ng-packagr builds that
succeeded, and neither package worked:

- the built `ui` manifest declared only Angular peers, while its code imports `clsx`,
  `tailwind-merge` and `@angular-saas-kit/tokens`, so an installer could not resolve them;
- the built `tokens` package held the compiled `ThemeService` and nothing else. The stylesheets,
  which are half of what the package is for, were not in it;
- the tokens entry stylesheet declared `@source '../../ui/src'`, a path that only means something
  inside this monorepo, and made every consumer of the tokens scan `libs/ui`. The landing page,
  which uses no shared component, carried the `ui` utilities in its CSS for that reason.

A green build proved none of it, because nothing looked at what the build produced.

## Decision

- **Each package declares what its code imports.** `ui` lists `clsx` and `tailwind-merge` as
  dependencies (named in `allowedNonPeerDependencies`, which ng-packagr requires) and
  `@angular-saas-kit/tokens` as a peer, so the app and the components share one `ThemeService`.
  `tokens` lists `tailwindcss` as a peer, because its stylesheet imports it.
- **Each package ships its stylesheets, through `exports`.** `tokens` copies its entry and its two
  stylesheets with ng-packagr `assets` and exports `./styles.css`. `ui` ships a one-line
  `styles.css` (`@source './fesm2022'`) that points Tailwind at the compiled components. Both mark
  CSS as a side effect, and both carry a `LICENSE`, a README and the usual manifest fields.
- **A consumer declares its own Tailwind sources.** The tokens entry stylesheet declares none, so it
  works from anywhere, `node_modules` included. The dashboard declares `@source` for `libs/ui`; the
  landing page, which uses none of it, no longer scans it. Both apps exclude `*.spec.ts` with
  `@source not`, because a string in a test is otherwise generated as a utility.
- **A check guards it.** `scripts/check-packages.mjs` reads what was built and fails when the code or
  a stylesheet imports something the manifest does not declare, when a file the manifest points at
  or a stylesheet reaches is missing, when there is no `LICENSE`, or when `npm pack` would leave a
  promised file out. It runs after the build in CI (the `build` leg) and in `npm run verify`.

## Alternatives considered

- **Leave it until the first release** - the defects are invisible until someone installs the
  package, and a release is the worst time to find them.
- **Rely on the build to write the dependencies** - the built `ui` manifest did not gain
  `@angular-saas-kit/tokens` on its own, and a manifest that depends on the tool's behaviour is not
  one to trust. The source manifests are explicit.
- **Keep the `@source` in the tokens stylesheet and rewrite it when packing** - a second, generated
  variant of the same file, to keep a convenience that was already leaking utilities into the landing
  page.
- **`sideEffects: false` as before** - it would let a bundler drop a stylesheet imported from
  JavaScript.
- **An `npm pack` and install test in a scratch app on every build** - the strongest check, and slow
  and heavy for what the static check already catches.

## Consequences

- The dashboard's production CSS is byte-for-byte what it was apart from the spec strings that no
  longer leak in (it is 664 bytes smaller and no longer contains `bg-red-500` or `bg-white`); the
  landing page's is 1.5 kB smaller.
- The architecture map lost an arrow: `tokens` no longer references `ui` in any way, and the map's
  check said so when the `@source` moved.
- **Validated by building the dashboard from the packed packages.** The built packages were copied
  into `node_modules`, and the dashboard's stylesheet imported `@angular-saas-kit/tokens/styles.css`
  and `@angular-saas-kit/ui/styles.css` by name. It compiled, and its selectors matched the workspace
  build's (with specs excluded) apart from `collapse`, a word from a comment in the dashboard's own
  spec, which that one-off stylesheet did not exclude. Nothing the components use was missing. That
  was a one-off check, not a test in the repository; the static check is what stays.
- **Nothing is published.** There is no release workflow, both packages are `0.0.1`, and
  `@angular-saas-kit/tokens` is peer-pinned at `^0.0.1`, which for a `0.0.x` version means exactly
  that one. A first release needs a versioning and publishing workflow (`nx release` is configured
  but unused) and an npm scope the maintainer owns.
- The peer range for Tailwind, `^4.3.0`, is the version the kit is built and tested with. It may be
  wider than that in practice; nobody has checked.
- A new runtime dependency of a component is one more place to remember: `package.json`,
  `allowedNonPeerDependencies`, then the check tells you if you forgot.

## References

- [`scripts/check-packages.mjs`](../../scripts/check-packages.mjs)
- [`libs/tokens/ng-package.json`](../../libs/tokens/ng-package.json), [`libs/ui/ng-package.json`](../../libs/ui/ng-package.json), [`libs/ui/assets/styles.css`](../../libs/ui/assets/styles.css)
- [Theming: from an installed package](../guide/theming.md#from-an-installed-package)
