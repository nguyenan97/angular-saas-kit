# Scripts and targets

## npm scripts

Run from the repository root with `npm run <name>`. Most of them are thin wrappers over Nx.

| Script               | Runs                                                                           | Use it to                                               |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `start`              | `nx serve dashboard`                                                           | Develop the dashboard.                                  |
| `start:landing`      | `nx serve landing`                                                             | Develop the landing page.                               |
| `build`              | `nx run-many -t build`                                                         | Build every project into `dist/`.                       |
| `test`               | `nx run-many -t test`                                                          | Run every project's unit tests with coverage.           |
| `lint`               | `nx run-many -t lint`                                                          | Lint every project.                                     |
| `typecheck`          | `tsc -p tsconfig.base.json --noEmit`                                           | Type-check the whole workspace, spec files included.    |
| `check:architecture` | `node scripts/check-architecture.mjs`                                          | Check the C4 container map against the code.            |
| `check:packages`     | `node scripts/check-packages.mjs`                                              | Check what the built `tokens` and `ui` packages ship.   |
| `format:check`       | `prettier --check .`                                                           | Check formatting.                                       |
| `verify`             | lint, test and build, then `typecheck`, `check:architecture`, `check:packages` | Run what CI runs, except the format check.              |
| `docs:dev`           | `vitepress dev docs`                                                           | Write these docs with live reload.                      |
| `docs:build`         | `vitepress build docs`                                                         | Build these docs into `docs/.vitepress/dist`.           |
| `pages`              | builds landing and dashboard with `-c pages`, then the docs, then assembles    | Build the whole demo site into `_site/` and check it.   |
| `pages:preview`      | `node scripts/preview-pages.mjs`                                               | Serve `_site/` the way GitHub Pages does, on port 8123. |
| `prepare`            | `husky`                                                                        | Install the git hooks. Runs on `npm ci`.                |

## Nx targets

Run with `npx nx <target> <project>`, for example `npx nx test ui`.

| Project         | Targets                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `dashboard`     | `build` (configurations `production`, `development`, `pages`), `serve`, `test`, `serve-static`, `lint`                         |
| `landing`       | `build` (the same three configurations; server output by default, static for `pages`), `serve`, `test`, `serve-static`, `lint` |
| `tokens`        | `build` (ng-packagr), `test`, `nx-release-publish`, `lint`                                                                     |
| `ui`            | `build` (ng-packagr), `test`, `nx-release-publish`, `lint`                                                                     |
| `mock-api`      | `test`, `lint`                                                                                                                 |
| `dashboard-e2e` | `e2e` (Playwright)                                                                                                             |

`lint` and `e2e` are inferred by Nx plugins from the ESLint and Playwright configuration files,
so they have no entry in a `project.json`. Two `build` configurations exist besides the
defaults:

- `production` is the default: optimised, hashed, with bundle budgets (a warning at 350 kB
  and an error at 500 kB for the initial bundle).
- `pages` is for the demo site: a base href, and file replacements for build-specific
  behaviour. It stands alone and is not combined with `production` (Nx does not merge
  comma-separated configurations for this executor).

Useful Nx commands:

```bash
npx nx graph                           # the live project graph, in the browser
npx nx affected -t lint test build     # only what your change reaches
npx nx show project dashboard          # every target of a project
```

## Git hooks

Installed by `husky` when you run `npm ci`.

| Hook         | Runs                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| `pre-commit` | `lint-staged`, which runs `prettier --write` on the staged files.                          |
| `commit-msg` | `commitlint`, which enforces [Conventional Commits](https://www.conventionalcommits.org/). |

The optional scope of a commit must be one of `ui`, `tokens`, `mock-api`, `dashboard`,
`landing`, `ci`, `deps`, `repo`. A new area of the codebase needs an entry in
`commitlint.config.mjs` before commits can mention it. The pull request title becomes the
commit on `main`, so it follows the same rules. See
[ADR 0012](../adr/0012-conventional-commits-and-squash-merges.md).

## Scripts in `scripts/`

| File                     | What it is                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `assemble-pages.mjs`     | Assembles `_site/` from the three builds and fails on a wrong base href or a missing file.                                          |
| `preview-pages.mjs`      | A small server that behaves like GitHub Pages under a repository path.                                                              |
| `check-architecture.mjs` | Compares the arrows in the container diagram with the imports and stylesheet references in the code.                                |
| `check-packages.mjs`     | Reads the built `tokens` and `ui` packages and fails when one imports what it does not declare or does not ship a file it promises. |
