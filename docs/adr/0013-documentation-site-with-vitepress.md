# 0013. A documentation site with VitePress

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

The guides, the C4 diagrams and these records are Markdown in `docs/`, and they read well
on GitHub. What GitHub does not give them is navigation, search and a home page, and a UI kit
that wants adopters needs somewhere to send them. The site has to deploy on the Pages site
that already exists ([0011](0011-github-pages-demo-site.md)), with no new host, account or
secret, and the pages have to stay readable on GitHub: the Markdown is the source, and a
reader browsing the repository must not meet broken links or raw markup.

## Decision

- **VitePress 2 (currently `2.0.0-alpha.20`)**, built from `docs/` and assembled into the
  Pages artifact under `/docs/` by `scripts/assemble-pages.mjs`, which checks its references
  like it checks the other two parts. `npm run pages` builds it, so every pull request builds
  it and only `main` deploys it.
- **The pages are written for both renderers.** Links are relative and end in `.md`, and
  alerts use GitHub's `> [!WARNING]` syntax. Three small build-time rules bridge the gap, in
  `docs/.vitepress/config.mts`: a folder's `README.md` is served as its index page; a
  relative link that leaves `docs/` (to `../../libs/...`) becomes a link to the file on
  GitHub; and `docs/superpowers` is not published.
- **Mermaid is drawn in the browser by a component in the theme** (`Mermaid.vue`, about a
  hundred lines). It loads the `mermaid` package on demand, follows the site's dark mode,
  and shows the diagram's source until it has drawn. Wide diagrams fit the column and open
  at full size in a dialog.
- **The sidebar lists the ADRs by reading the files**, so a new record appears without
  touching the configuration. Search is VitePress's built-in local search.

## Alternatives considered

- **VitePress 1.6.4, the stable release** - it pins Vite 5 and esbuild 0.21, which npm audit
  flags with three advisories (one high) and no fix on that line, and it adds a second copy
  of Vite next to the workspace's own. The 2.0 alpha uses the same Vite 8 as the rest of the
  tree and audits clean.
- **`vitepress-plugin-mermaid`** - a dependency that has to track both VitePress and
  Mermaid. The component is small enough to own.
- **Docusaurus, Astro Starlight, MkDocs Material** - capable, but a different toolchain (or,
  for MkDocs, a different language) to maintain for what is a set of Markdown pages.
- **Drawing the diagrams at build time** - needs a headless browser in CI for a result the
  reader's browser produces for free.
- **The GitHub wiki** - not versioned with the code it describes.
- **Storybook** - the right home for a component catalogue, and the roadmap has one. There is
  no component library to catalogue yet.

## Consequences

- **VitePress 2 is an alpha.** Its API can change between releases. Dependabot proposes each
  one and CI builds the site on every pull request, so a break shows up before it ships. If
  it ever becomes a burden, the fallback is 1.x once its Vite dependency is fixed.
- Diagrams need JavaScript on the site. Without it the reader gets the diagram's source, and
  GitHub still renders it.
- Mermaid brings about a hundred packages and a core chunk of around 650 kB. It is a dev
  dependency, and the chunk loads only on the pages that have a diagram.
- Mermaid's C4 layout sizes its rows from the screen width, so a browser that reports no
  screen collapses every diagram into one column. Real browsers are fine.
- The docs build adds about fifteen seconds to the Pages job, and a docs-only pull request
  still runs it, because CI has no path filters ([0009](0009-strict-ci-gates-and-a-protected-main.md)).
- The navigation is maintained by hand, except for the decisions. A new guide page needs an
  entry in `config.mts`.
- Forking means changing the repository name in `config.mts` too; the deploying guide lists
  every place.

## References

- [`docs/.vitepress/config.mts`](../../docs/.vitepress/config.mts), [`Mermaid.vue`](../../docs/.vitepress/theme/Mermaid.vue), [`scripts/assemble-pages.mjs`](../../scripts/assemble-pages.mjs)
- [`docs/README.md`](../../docs/README.md) - how to write the pages
