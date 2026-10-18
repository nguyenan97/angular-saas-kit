# AGENTS.md

For AI coding agents. People read [CONTRIBUTING.md](CONTRIBUTING.md); this is the short version,
with the traps.

## What this is

A free, MIT-licensed admin dashboard and landing page for Angular 22: zoneless, signals-first,
Tailwind v4, on a semantic-token design system. An Nx monorepo, npm, one lockfile. It is early:
the docs say what exists and what is only planned, and so should you.

**Before writing code, read [`CONSTRAINTS.md`](CONSTRAINTS.md)**: every check a change must pass,
and the floor review rejects. Do not weaken it to make a change pass. How a change is sized and
taken from spec to merge is in [`docs/guide/development-process.md`](docs/guide/development-process.md).

## Commands

Node 22+ and npm 11+. Install with `npm ci`, never `npm install`, unless you are adding a
dependency. The repo `.npmrc` resolves peer dependencies strictly, like CI; do not work around an
`ERESOLVE` with `--legacy-peer-deps`.

```bash
npx nx test <project>      # one project, by its Nx name (npx nx show projects)
npm run verify             # lint + test + build + typecheck + the check:* scripts
npm run format:check       # Prettier; a commit hook formats staged files for you
npm run pages              # the whole Pages site into _site/; then npm run pages:preview
```

The other scripts (dev servers, docs, Storybook) are in `package.json`. `verify` is what CI runs,
apart from the format check. Run both before you say a change is done.

## Layout

```text
apps/dashboard      admin SPA (client-side)          apps/landing   marketing page (prerendered)
apps/dashboard-e2e  Playwright (CI: Chromium)         libs/tokens    design tokens, ThemeService
libs/ui             components (a README each), cn() libs/mock-api  in-memory HTTP interceptor
libs/shared/kernel    domain value types, Result, event bus (plain TS, no app uses it yet)
libs/booking/domain  Booking domain: SalesOrder, lines, slots (plain TS, no app uses it yet)
docs/               guides, C4 diagrams (architecture/), ADRs (adr/), the VitePress site
scripts/            assemble/preview the Pages site; the check:* scripts that verify runs
```

Import a library through its `@angular-saas-kit/*` alias (`tsconfig.base.json`). Lint enforces the
module boundaries from each project's `type:`, `scope:` and, in a bounded context, `layer:` tags:
apps import libs, shared libs import only shared libs, nothing imports an app, no cycles (ADR 0015,
0021). If lint rejects an import, the import is wrong; do not loosen the rule. A new project needs
its tags.

## Rules that are not negotiable

- **Components take colours from semantic tokens** (`npm run check:tokens` rejects the rest).
  Missing token: add it to `libs/tokens` in the same change and say why.
- **Accessibility is a gate.** Keyboard operable, visible focus, announced state. Template a11y
  lint rules are errors. Prefer a native element to an ARIA role (`input type="radio"`, not
  `button role="radio"`: the browser supplies the arrow keys and the single tab stop). Reach for the
  Angular CDK before hand-rolling a focus trap.
- **Signals, not RxJS state.** `signal`/`computed`, RxJS only at the edges; no `zone.js`.
- **Selectors:** `ask-` prefix, kebab-case for components; `ask` prefix, camelCase for directives.
- **No new UI-library dependency** (Material, PrimeNG and the like). The CDK and small utilities are fine.
- **Merge host classes through `cn()`** so a consumer can override a component's defaults.
- **Do not claim what is not built.** The mock API serves the dashboard outside production
  builds only; no packages are published; and the component library is small (the list is in
  `docs/guide/components.md`), not the forty the roadmap plans. Docs and PR text must match
  the code.

## Commits, PRs and `main`

- **Conventional Commits.** The scope, if any, is one of `ui`, `tokens`, `mock-api`, `dashboard`,
  `landing`, `ci`, `deps`, `repo`. `docs` is a type, not a scope. The PR title becomes the squash
  commit, so it follows the same rules.
- `main` is protected: the required checks (ADR 0009) must pass and the branch must be up to date.
  Work on a branch and open a PR; never push to `main`, never `--no-verify`.
- Update `docs/` in the same PR as the change it describes.

## Traps

- **New project or a dependency between projects:** update `docs/architecture/c4-containers.md`
  and the projects table in `docs/reference/workspace.md`. `npm run check:architecture` compares
  both with the code (imports, CSS `@import`/`@source`,
  `implicitDependencies`), and CI runs it. A stylesheet's `@import` and `@source` count, and lint cannot see them.
- **Build-specific behaviour** goes through `fileReplacements`, as the `pages` configuration does
  (`routing-mode.ts`, `site-links.ts`). Put shared types in their own file, or the replacement
  file becomes their source.
- **Nx does not merge comma-separated configurations** for this executor: `-c production,pages`
  silently builds plain production. The `pages` configuration stands alone.
- **The theme init script lives in three places** (`THEME_INIT_SCRIPT` and each app's
  `index.html`); `theme-init.spec.ts` fails when they drift. Change all three.
- **Coverage instrumentation breaks `__dirname`** in specs; use `workspaceRoot` from `@nx/devkit`.
- **CI runs on Linux.** A script test must hold on a case-sensitive file system with `/`
  separators; an assertion that only Windows or macOS produces fails CI (`check-docs.test.mjs` did once).
- **The landing Node server answers 400 to everything** until `NG_ALLOWED_HOSTS` is set.
- **`libs/ui` and `libs/tokens` build as npm packages** (not published yet). A runtime dependency of a
  component goes in `libs/ui/package.json` and in `allowedNonPeerDependencies` in its
  `ng-package.json`; a file a package promises must ship. `npm run check:packages` checks the built
  output, after a build. The tokens stylesheet declares no `@source`: each app declares its own,
  and excludes `*.spec.ts` and `*.stories.ts` with `@source not`, or test strings become utilities.
- **Docs links are relative and end in `.md`**, so they work on GitHub and on the site. A
  folder's `README.md` becomes its index page. `docs/superpowers` is working material, not published.
- **A new or changed `uses:` in a workflow** is pinned to a full commit SHA with the version in a
  comment, and a checkout sets `persist-credentials: false`; zizmor fails the PR otherwise.
- **Dependency changes:** keep `package-lock.json` in sync with npm 11, and run `npm audit`. A
  Dependabot PR that fails `npm ci` is never merged.

## Where the reasoning is

Architecture decision records: [`docs/adr`](docs/adr/README.md). C4 diagrams:
[`docs/architecture`](docs/architecture/README.md). Guides: [`docs/guide`](docs/guide/getting-started.md).
A bounded context's words: its `GLOSSARY.md` (`libs/booking/GLOSSARY.md`, `libs/shared/GLOSSARY.md`).
Repeatable tasks have skills in [`.claude/skills`](.claude/skills/README.md), listed there by phase and
written to be read by any agent.
