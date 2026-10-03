# 0020. Storybook on the Angular webpack builder

- **Status:** Accepted
- **Date:** 2026-10-03
- **Deciders:** @nguyenan97

## Context

The roadmap promises Storybook for the components in `libs/ui`. An adopter wants to see every
component and every state without running the dashboard, and the kit's theme axes are easiest
to show on a page of components with a theme toolbar.

Storybook's Angular framework, `@storybook/angular` 10.6, builds stories with webpack through
`@storybook/builder-webpack5`. It requires `@angular-devkit/build-angular`, Angular's webpack
builder, and `@angular/platform-browser-dynamic` as peers. The workspace removed
`build-angular` once, because nothing used it and it carried an advisory
([0010](0010-dependabot-grouping-and-ignored-major-versions.md)). Analog's Vite framework for
Storybook peers on `@storybook/angular` too, so npm installs the same packages either way.

What Storybook adds to the dependency tree was measured before deciding:

- **On Angular 22.1** (2026-09-28), `build-angular` brought 5 moderate advisories through
  `webpack-dev-server`. On 22.2 they were gone, so Storybook waited for the move to 22.2.1.
- **On Angular 22.2.1** (2026-10-03), the install adds 443 packages, none with an install
  script. It brings two high advisories:
  - `webpack-dev-middleware` ([GHSA-g84c-rxfj-3j2c](https://github.com/advisories/GHSA-g84c-rxfj-3j2c)),
    in a 6.x copy nested under the webpack builder, fixed in 7.4.6.
  - `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)), which
    `webpack-dev-server` reaches through `http-proxy-middleware` and `micromatch`. It is
    fixed in no release: 3.0.3 is both the latest and affected.

## Decision

The components get Storybook 10.6, with `@storybook/angular` on the webpack builder:

- **Stories:** next to each component, as `<name>.stories.ts`.
- **Configuration:** `libs/ui/.storybook` holds the theme toolbar and the accessibility addon:
  - The toolbar's mode, accent and radius set the html element's class and data attributes, as
    `ThemeService` does.
  - The addon runs axe on each story.
- **Runs zoneless:** the default from Angular 21, which the targets also set.
- **Targets:** `ui:storybook` and `ui:build-storybook`, whose `browserTarget` points at
  `build-storybook`; Storybook 10 refuses to start without one.
- **Publishing:** `npm run pages` builds it into the Pages site under `/storybook/`. That
  makes the required `Build site` check a check that every story still builds.
- **The fixable advisory:** an npm override moves the webpack builder's `webpack-dev-middleware`
  to `^7.4.6`.
- **The unfixable one:** the `braces` advisory is accepted until `braces` ships a fix.

## Alternatives considered

- **A gallery page in the dashboard.** It needs no dependency, but it would rebuild Storybook's
  controls, isolation and accessibility panel by hand. It would also put a page in the demo that
  an adopter deletes first.
- **Analog's Vite framework.** It still requires `@storybook/angular` and therefore
  `build-angular`, with the same advisory chain, and adds a third-party framework between the
  kit and Storybook.
- **Wait for `braces` to be fixed.** The advisory had no fix two weeks after it was published,
  and there is no date. The code path is the dev server's matching of proxy patterns that the
  developer writes, not anything a visitor reaches.

## Consequences

- **The webpack builder is back, for Storybook only.** `build-angular`, webpack and
  `webpack-dev-server` sit in the dev tree; the apps keep building with `@angular/build`.
- **`npm audit` reports 9 high findings, all from the one `braces` advisory.**
  - They are counted once for each package on the path to it.
  - The Storybook dev server listens on `localhost`.
  - Dependabot proposes the fix when there is one, and then the audit should be clean again.
- **The `webpack-dev-middleware` override is temporary.** Drop it when
  `@storybook/builder-webpack5` depends on 7.4.6 or later.
- **Stories must stay out of what ships:**
  - The library build excludes them in `tsconfig.lib.json`.
  - Each app's stylesheet excludes them with `@source not`, as it excludes tests. Without that,
    a class used only in a story would end up in an app's CSS.
- **The Pages build takes longer**, by the time Storybook takes to build.
- **Stories are built, not tested.** CI proves that every story compiles. The accessibility
  panel is read by hand: every story had no violations when this was written.

## References

- [`libs/ui/.storybook`](../../libs/ui/.storybook/main.ts), the `storybook` and
  `build-storybook` targets in [`libs/ui/project.json`](../../libs/ui/project.json)
- [Components guide](../guide/components.md#storybook)
