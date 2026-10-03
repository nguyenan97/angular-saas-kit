# Deploying

The kit deploys three ways. The demo site on GitHub Pages is the one that is set up and
running; the other two are how you would take it further.

| Target                          | What runs where                                    | State                     |
| ------------------------------- | -------------------------------------------------- | ------------------------- |
| **GitHub Pages**                | Landing, dashboard demo and these docs, all static | Deployed from `main`      |
| **Any static host**             | The same static files, or just the dashboard       | Works; nothing deploys it |
| **A Node host for the landing** | The landing page with a small Express server       | Works; nothing deploys it |

## The demo site on GitHub Pages

One site at `https://nguyenan97.github.io/angular-saas-kit/`:

| URL           | What it is                                    |
| ------------- | --------------------------------------------- |
| `/`           | The landing page, prerendered to static files |
| `/demo/`      | The dashboard, a single-page app              |
| `/docs/`      | These docs                                    |
| `/storybook/` | The components in Storybook                   |

It is built and deployed by the `Pages` workflow, from `main` only. Every pull request also
runs the build and the site checks, and attaches the built site as a downloadable
`github-pages` artifact, but only `main` deploys. The reasoning, including why there are no
live previews for pull requests, is in
[ADR 0011](../adr/0011-github-pages-demo-site.md).

### What makes it work under a path

A project site lives under a repository path, so nothing can assume it is at the root:

- **Base hrefs.** Both apps get a `pages` build configuration with an explicit base href
  (`/angular-saas-kit/` for the landing page and `/angular-saas-kit/demo/` for the
  dashboard), and these docs build with `base: '/angular-saas-kit/docs/'`.
- **Hash routing for the dashboard.** Pages cannot rewrite an unknown path back to
  `index.html`, so a refresh on a path-based deep link would 404. The Pages build swaps in
  `withHashLocation()` with a file replacement, and every other build keeps path URLs.
- **A `404.html`** answers unknown paths.
- **A check that fails the build**, not the visitor. `scripts/assemble-pages.mjs` assembles
  `_site/` and fails when a `<base href>` is wrong or a page points at a file that is not
  there, which is how a Pages deploy turns green and serves a blank page.

### Review it locally

```bash
npm run pages           # builds everything with the `pages` configuration and checks _site
npm run pages:preview   # serves _site the way Pages does
```

Open `http://localhost:8123/angular-saas-kit/`. The preview serves everything under the
repository path, serves a folder from its `index.html`, and answers anything else with
`404.html` and a real 404 status.

## Deploy your own copy

1. Fork the repository, and in **Settings > Pages** set the source to **GitHub Actions**.
2. Change the repository name wherever it is spelled out. If your fork is called `my-kit`:

   | File                           | Change                                      |
   | ------------------------------ | ------------------------------------------- |
   | `scripts/assemble-pages.mjs`   | `SITE_BASE` to `/my-kit/`                   |
   | `scripts/preview-pages.mjs`    | `base` to `/my-kit/`                        |
   | `apps/landing/project.json`    | the `pages` `baseHref` to `/my-kit/`        |
   | `apps/dashboard/project.json`  | the `pages` `baseHref` to `/my-kit/demo/`   |
   | `apps/landing/public/404.html` | the two absolute links                      |
   | `docs/.vitepress/config.mts`   | `REPO`, `SITE` and `base` (`/my-kit/docs/`) |

3. Push to `main`. The workflow builds and deploys.

On a custom domain the site moves to the root, so only `SITE_BASE`, the base hrefs and the
docs `base` change. The "Live demo" and "Docs" links on the landing page are relative, so
they follow the move without an edit.

## Any static host

The Pages build is plain static files. For your own host, build without the `pages`
configuration and upload the `browser` folder:

```bash
npx nx build dashboard      # dist/apps/dashboard/browser
npx nx build landing        # dist/apps/landing/browser (plus a server folder)
```

> [!IMPORTANT]
> **The production dashboard has no mock API.** It calls `/api` on the host it is served
> from, so deploy it with a backend that answers there, in the shapes of
> `apps/dashboard/src/app/data/models.ts`. Without one its pages show their error states. The
> demo on GitHub Pages keeps the mock on purpose; see [Mock API](mock-api.md#in-the-dashboard).

The dashboard is a single-page app with path-based URLs, so the host must answer an unknown
path with `index.html`. `nx run dashboard:serve-static` does exactly that, locally, and is a
handy way to check a production build.

## The landing page behind Node

See [The landing page](landing-page.md#run-the-node-server). The one thing to know: set
`NG_ALLOWED_HOSTS`, or the server answers `400` to every request.
