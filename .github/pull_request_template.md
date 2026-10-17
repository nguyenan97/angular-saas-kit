## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- What problem this solves. Skip if the issue already covers it. -->

## How it was checked

<!-- Evidence it works: the commands you ran, a test that failed before and passes after, or a
before/after screenshot. Then what you did not check, plainly. -->

## Merge danger

<!-- Door: two-way (easy to revert) or one-way (a published API, a migration, a removed file other
people link to). Blast radius in a word: none, docs, one component, the dashboard, every app, CI. -->

## Checklist

- [ ] `npx nx run-many -t lint test build` passes locally
- [ ] No colour literals in components — semantic tokens only
- [ ] Keyboard reachable and operable; focus is visible
- [ ] ARIA attributes match the WAI-ARIA pattern for this component
- [ ] Works in both light and dark, and with all four accents
- [ ] Tests cover the behaviour, not just that it renders
- [ ] New project or dependency between projects: `docs/architecture/c4-containers.md` updated (`npm run check:architecture`)
- [ ] Hard-to-reverse decision: an ADR in `docs/adr/`
- [ ] Behaviour a guide describes has changed: the page in `docs/` is updated (`npm run docs:build` passes)
- [ ] Commits follow Conventional Commits

## Screenshots

<!-- For any visual change: light and dark. -->
