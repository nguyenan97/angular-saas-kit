# 0011. A demo site on GitHub Pages

- **Status:** Accepted
- **Date:** 2026-09-26
- **Deciders:** @nguyenan97

## Context

A UI kit is judged by looking at it. The project needs a public demo that costs
nothing to host, deploys itself, and lets a reviewer see what a change does to the
landing page and the dashboard. There is no backend to host, and both apps can be
built to static files.

## Decision

Deploy one site to GitHub Pages at `https://nguyenan97.github.io/angular-saas-kit/`:
the landing page at the root and the dashboard under `/demo/`. Pages is served by
GitHub Actions, not from a branch.

_Amended 2026-09-27:_ the documentation site is built into the same artifact under
`/docs/` ([0013](0013-documentation-site-with-vitepress.md)).

- Both apps get a `pages` build configuration. The landing page builds with
  `outputMode: static` and a `/angular-saas-kit/` base href; the dashboard builds
  with a `/angular-saas-kit/demo/` base href.
- **Hash routing for the demo.** Pages cannot rewrite an unknown path to
  `index.html`, so a refresh on a path-based deep link would 404. The Pages build
  swaps in `withHashLocation()` through `fileReplacements`; every other build keeps
  path-based URLs.
- The landing page's "Live demo" link is compiled in only for this build, so
  `nx serve landing` never shows a dead link. It is relative, so it survives a move
  to a custom domain.
- A static `404.html` answers unknown paths.
- `scripts/assemble-pages.mjs` builds `_site` and fails when a `<base href>` is wrong
  or a page references a file that is not there - the way a Pages deploy turns green
  and serves a blank page. `npm run pages:preview` serves `_site` the way Pages does.
- Every pull request runs the build and the checks; only `main` deploys, through the
  official `upload-pages-artifact` and `deploy-pages` actions.

## Alternatives considered

- **Vercel, Netlify or Cloudflare Pages** - richer features, including previews, but
  another account and another secret to manage for a demo.
- **Deploying from a `gh-pages` branch** - allows per-PR preview folders through a
  third-party action that needs `contents: write`, and puts build output in git.
- **Path routing plus a `404.html` redirect trick** - works, but is a hack that
  breaks silently when the redirect script and the base href disagree.
- **Storybook as the demo** - the component library is not built yet.

## Consequences

- The demo is always what `main` contains, with nothing to keep in sync by hand.
- **No live previews for pull requests.** Pages has one production environment. Each
  PR gets the same build and check and attaches the built site as a downloadable
  artifact instead. If review volume grows, a preview tool can be added deliberately.
- Nx does not merge comma-separated configurations for this executor
  (`-c production,pages` built plain production), so the `pages` configuration stands
  alone and repeats `outputHashing`.
- The demo shows what exists: static placeholder data. It picks up the mock API when
  a page starts fetching ([0006](0006-in-memory-mock-api-instead-of-a-backend.md)).
  _Amended 2026-09-27:_ it has: the `pages` configuration keeps the mock backend, and
  the demo says "Demo data" in its topbar.
- The site lives under a repository path, which is why every base href is explicit.
  A custom domain would move it to the root and only `SITE_BASE` and the two base
  hrefs would change.

## References

- [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml), [`scripts/`](../../scripts)
- [C4 deployment](../architecture/c4-deployment.md)
- [#25](https://github.com/nguyenan97/angular-saas-kit/pull/25)
