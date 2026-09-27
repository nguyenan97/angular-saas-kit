# Documentation

The documentation site is published at
**<https://nguyenan97.github.io/angular-saas-kit/docs/>**. This folder is its source, and
everything in it reads fine here on GitHub too.

| Folder                          | What is in it                                                         |
| ------------------------------- | --------------------------------------------------------------------- |
| [`guide/`](guide)               | Getting started, theming, components, the mock API, deploying and CI. |
| [`architecture/`](architecture) | The C4 diagrams: context, containers, components, deployment.         |
| [`adr/`](adr)                   | Architecture decision records: why the kit is built the way it is.    |
| [`reference/`](reference)       | Every script and Nx target, and the workspace layout.                 |
| [`superpowers/`](superpowers)   | Working documents: the design and plan of the CI hardening.           |
| [`.vitepress/`](.vitepress)     | The site's configuration and theme.                                   |

## Working on the docs

```bash
npm run docs:dev      # live reload at http://localhost:5173/angular-saas-kit/docs/
npm run docs:build    # what CI builds
```

- **Write links relative and end them in `.md`**, so they work on GitHub and on the site. A
  link that leaves `docs/` (to `../../libs/...`, say) is turned into a link to the file on
  GitHub when the site is built.
- **`README.md` becomes `index`.** A folder's `README.md` is what GitHub shows, and the site
  serves it as the folder's index page.
- **Diagrams are Mermaid** in a fenced block tagged `mermaid`. GitHub renders them, and the
  site draws them in the browser. Keep the `init` line at the top of a C4 diagram: it spaces
  the boxes so arrow labels stay clear of them.
- **Alerts** such as `> [!WARNING]` work on GitHub and on the site.
- **A new architecture decision** goes in [`adr/`](adr/README.md#writing-one). **A change to
  the shape of the workspace** updates [`architecture/c4-containers.md`](architecture/c4-containers.md),
  and CI checks it.
