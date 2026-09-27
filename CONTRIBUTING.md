# Contributing

Thanks for looking. This kit is early, so contributions have outsized
influence right now — particularly component work and accessibility findings.

## Setup

```bash
npm ci
npx nx serve dashboard
```

Node 22+, npm 11+. Older npm hits a dependency resolution bug on this tree.

Installs resolve peer dependencies strictly, the way CI does (the repo's
`.npmrc` sets `legacy-peer-deps=false`). If `npm ci` reports `ERESOLVE`, the
tree has a real conflict - don't paper over it with `--legacy-peer-deps`.

## Before you open a PR

```bash
npx nx run-many -t lint test build
npm run typecheck
npm run check:architecture
npm run check:packages     # after the build: what the tokens and ui packages would ship
npm run format:check
```

If you touched the theme or the dashboard shell, also run the browser tests
(`npx playwright install` once, then `npx nx e2e dashboard-e2e`).

CI runs the same lint, test and build (through `nx affected`, so only the
projects your change touches), a workspace typecheck, the architecture check, the
package check, a Prettier check, the browser tests (in Chromium; not a required check
yet) and CodeQL scanning. Tests collect coverage for every project. A
green local run is a green CI run.

`main` is protected: changes land through a pull request, `lint`, `test`,
`build`, `typecheck`, `format` and the site build (`Build site`, which also
catches a dead documentation link) must pass, and the branch has to be up to
date with `main` before it can merge.

## Reviewing the demo site

The landing page and the dashboard demo are deployed to GitHub Pages from
`main`. To see what your change does to them before it ships:

```bash
npm run pages           # builds both apps with the `pages` configuration and checks _site
npm run pages:preview   # serves _site the way Pages does, at http://localhost:8123/angular-saas-kit/
```

Every pull request also runs this build (the **Pages / Build site** check) and
uploads the result as a downloadable `github-pages` artifact on the run.

## Architecture and decisions

How the kit is put together is drawn in [`docs/architecture`](./docs/architecture/README.md)
(C4 diagrams), and why it is that way is recorded in
[`docs/adr`](./docs/adr/README.md) (architecture decision records). Read them
before changing a shape.

- **Adding a project, or a dependency between projects?** Update the `Container`
  and `Rel` lines in [`c4-containers.md`](./docs/architecture/c4-containers.md) in
  the same PR. `npm run check:architecture` compares that map with the imports and
  stylesheet references in the source, and CI runs it.
- **Making a decision that is expensive to reverse?** Write an ADR: copy
  [`docs/adr/template.md`](./docs/adr/template.md), open the PR with it as
  `Proposed`, and it becomes `Accepted` when the PR merges.

## Documentation

The guides, the diagrams and the decision records are Markdown in [`docs`](./docs/README.md),
published as a site. Change a page in the same PR as the code it describes.

```bash
npm run docs:dev      # live reload
npm run docs:build    # what CI builds; fails on a dead link
```

Write links relative and end them in `.md`, so they work on GitHub and on the site.
[`docs/README.md`](./docs/README.md) has the rest of the conventions.

## Working with AI coding agents

[`AGENTS.md`](./AGENTS.md) tells coding agents how this repository works, and
[`.claude/skills`](./.claude/skills) holds step-by-step skills for the recurring jobs: verifying a
change, adding a component or a dashboard page, writing an ADR, updating the architecture map,
writing docs, opening a pull request and triaging Dependabot. The rules are the same for everyone.
A change made with an agent goes through the same checks, and you are responsible for what you
submit.

## The rules that are not negotiable

These are the things the kit is _for_. A PR that breaks one of them will be
asked to change, however good the rest of it is.

**Components never name a colour.** No `bg-white`, no `text-slate-500`, no
`dark:` colour overrides in a component. Use the semantic token —
`bg-card`, `text-muted-foreground`, `border-border`. If the token you need
does not exist, add it to `libs/tokens` in the same PR and say why. This is
what lets the whole kit reskin from three attributes on `<html>`.

**Accessibility is a gate.** Interactive elements are reachable and operable
by keyboard, focus is visible, state is announced. Template a11y lint rules
are errors, not warnings. Prefer a native element to an ARIA role: a group of
`<input type="radio">` gets the arrow keys and one tab stop from the browser,
where `<button role="radio">` gets neither. If a component needs a roving
tabindex or a focus trap, use the Angular CDK rather than rolling one.

**Signals, not RxJS state.** Component state is `signal` / `computed`. RxJS
is fine at the edges — HTTP, event streams — but it should not be how a
component holds its own state. Every component is `OnPush`.

**No new UI-library dependency.** The Angular CDK is in. A dependency that
brings its own styling, theming layer or component markup is not, because
that is the thing this kit exists to avoid. Small, single-purpose utilities
are fine — open an issue first.

## Adding a component

A component in `libs/ui` is done when it has:

- signal inputs/outputs (`input()`, `output()`, `model()`)
- host classes merged through `cn()` so consumers can override them
- keyboard support and the ARIA attributes its WAI-ARIA pattern requires
- unit tests covering behaviour and the a11y contract, not just "it renders"
- a short README next to it: usage, API table, a11y notes

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat(ui): add combobox`, `fix(tokens): correct dark ring contrast`,
`docs(readme): ...`. The changelog is generated from these.

## Reporting a bug

Reproduction steps decide whether a bug gets fixed. "The dropdown is broken"
with no repro usually gets closed; a fork with three steps usually gets fixed
the same week.
