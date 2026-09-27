# Getting started

Everything you need to run the kit, check a change and ship it.

## Requirements

- **Node 22 or newer** and **npm 11 or newer.** `.nvmrc` pins Node 22. Older npm hits a
  dependency-resolution bug on this dependency tree.
- Git.

## Install and run

```bash
git clone https://github.com/nguyenan97/angular-saas-kit.git
cd angular-saas-kit
npm ci

npm start                # the dashboard, http://localhost:4200
npm run start:landing    # the landing page
```

Use `npm ci`, not `npm install`. Installs resolve peer dependencies strictly, the way CI
does: the repository's `.npmrc` sets `legacy-peer-deps=false`. If `npm ci` reports
`ERESOLVE`, the tree has a real conflict. Don't paper over it with `--legacy-peer-deps`.

Both apps live-reload as you edit. The libraries (`tokens`, `ui`, `mock-api`) are consumed
through TypeScript path aliases, so an edit in `libs/tokens` or `libs/ui` shows up in the
running app at once, with no build step in between.

## The commands you will use

| Command                 | What it does                                                                      |
| ----------------------- | --------------------------------------------------------------------------------- |
| `npm start`             | Serves the dashboard.                                                             |
| `npm run start:landing` | Serves the landing page.                                                          |
| `npm test`              | Runs every project's unit tests, with coverage.                                   |
| `npm run lint`          | Lints every project. Template accessibility rules are errors.                     |
| `npm run build`         | Builds everything into `dist/`.                                                   |
| `npm run verify`        | Lint, test, build, workspace typecheck, then the architecture and package checks. |
| `npm run format:check`  | Checks formatting with Prettier. Commits are formatted for you by a hook.         |
| `npm run pages`         | Builds the whole demo site (landing, dashboard demo, these docs) into `_site/`.   |
| `npm run docs:dev`      | Serves these docs with live reload.                                               |

The full list, with the Nx targets behind each, is in
[Scripts and targets](../reference/scripts.md).

## Before you open a pull request

```bash
npm run verify
npm run format:check
```

That is what CI runs. A green local run is a green CI run. CI only builds and tests
the projects your change touches (`nx affected`), so it can be quicker than your local
run, never stricter. See [Continuous integration](ci.md) for what each check is for.

## What is where

| Path             | What it is                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/dashboard` | The admin application: a client-side single-page app.                                                            |
| `apps/landing`   | The marketing page: prerendered, with an optional Node server build.                                             |
| `libs/tokens`    | Design tokens, the Tailwind theme mapping and `ThemeService`.                                                    |
| `libs/ui`        | Shared components: `Badge`, `Button`, `Card`, `Icon`, `Input`, `Table`, `ThemeSwitcher`, and the `cn()` helper.  |
| `libs/mock-api`  | An in-memory HTTP interceptor with realistic latency. Built, not yet used.                                       |
| `docs`           | These docs, the [architecture diagrams](../architecture/README.md) and the [decision records](../adr/README.md). |

[Workspace layout](../reference/workspace.md) has the whole tree.

## Where to go next

- [Theming](theming.md): the three-axis theme, and how to add an accent.
- [Components](components.md): the rules, and how to add one.
- [Architecture](../architecture/README.md): how the pieces fit, drawn with the C4 model.
- [Decisions](../adr/README.md): why it is built this way.
