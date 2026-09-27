---
name: verify
description: Run the checks CI runs (lint, test, build, typecheck, the architecture map, formatting) and fix what fails. Use before opening or updating a pull request, before saying a change is done, and when a CI check is red.
---

# Verify a change

CI runs these on every pull request, and five of them are required to merge. A green local run is
a green CI run, so run them here first.

## Run

```bash
npm run verify          # lint + test + build for every project, then typecheck, then the architecture and package checks
npm run format:check    # Prettier
```

`verify` stops at the first failing step. To see everything that fails, run the steps separately
(`npm run lint`, `npm test`, `npm run build`, `npm run typecheck`, `npm run check:architecture`,
`npm run check:packages`; the last one needs a build first).
CI only runs lint, test and build for the projects a change touches (`nx affected`); running all of
them locally is stricter, never looser.

If you changed the docs, also run `npm run docs:build`: it fails on a dead link. If you changed how
the Pages site is built, run `npm run pages`. If you changed the theme or the dashboard shell, run the
browser tests (`npx playwright install` once, then `npx nx e2e dashboard-e2e`; CI runs the `e2e` job in
Chromium, not yet as a required check): they prove what jsdom cannot, such as radio-group keyboard behaviour.

## When a check fails

| Failing              | Usual cause                                                                                                                | Fix                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lint`               | A rule, often template accessibility (errors, not warnings) or a selector without the `ask` prefix.                        | Fix the code. Do not disable the rule.                                                                            |
| `test`               | A failing spec, or a spec that reads a path relative to `__dirname`.                                                       | Fix the code or the test. Coverage instrumentation breaks `__dirname`; use `workspaceRoot` from `@nx/devkit`.     |
| `build`              | A type error in a template, or a bundle over budget (warning 350 kB, error 500 kB initial).                                | Fix the code; do not raise the budget to hide growth.                                                             |
| `typecheck`          | A type error that only a spec file has: the app builds do not compile specs.                                               | Fix the spec. `tsc -p tsconfig.base.json --noEmit` shows the same error.                                          |
| `check:architecture` | You added or removed a project or a dependency between projects, and `docs/architecture/c4-containers.md` was not updated. | Update the `Container` and `Rel` lines to match; the message names the edge. See the `update-architecture` skill. |
| `check:packages`     | A built package imports something its manifest does not declare, or a file it promises is not shipped.                     | Declare it in `libs/<name>/package.json` and `ng-package.json`, or add the asset; the message names the file.     |
| `format`             | Unformatted files.                                                                                                         | `npx prettier --write <files>`. The commit hook formats staged files; files you did not stage are not.            |

## Install problems

`npm ci` reporting `ERESOLVE` means the dependency tree has a real conflict. The repo `.npmrc` sets
`legacy-peer-deps=false` on purpose; a user-level `legacy-peer-deps=true` once hid a conflict that
failed CI. Do not add `--legacy-peer-deps`. Fix the versions instead.

## Report honestly

Say which of these you ran and what they printed. If something could not be run, say that, rather
than reporting the change as verified.
