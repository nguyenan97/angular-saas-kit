---
name: verify
description: Run the checks CI runs (lint, test, build, typecheck, the architecture map, formatting) and fix what fails. Use before opening or updating a pull request, before saying a change is done, and when a CI check is red.
---

# Verify a change

CI runs these on every pull request; the ones required to merge are listed in
`docs/adr/0009-strict-ci-gates-and-a-protected-main.md`. A green local run is a green CI run, so run
them here first.

## Run

```bash
npm run verify          # lint + test + build for every project, then typecheck, then the architecture and package checks
npm run format:check    # Prettier
```

`verify` stops at the first failing step. To see everything that fails, run the steps separately
(`npm run lint`, `npm test`, `npm run build`, `npm run typecheck`, `npm run test:scripts`, `npm run check:architecture`, `npm run check:docs`, `npm run check:tokens`,
`npm run check:packages`; the last one needs a build first).
CI only runs lint, test and build for the projects a change touches (`nx affected`); running all of
them locally is stricter, never looser.

If you changed the docs, also run `npm run docs:build`: it fails on a dead link. If you changed how
the Pages site is built, run `npm run pages`. If you changed the theme or the dashboard shell, run the
browser tests (`npx playwright install` once, then `npx nx e2e dashboard-e2e`; CI runs the `e2e` job in
Chromium, as a required check): they prove what jsdom cannot, such as radio-group keyboard behaviour.

## When a check fails

| Failing              | Usual cause                                                                                                                                                       | Fix                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `lint`               | A rule, often template accessibility (errors, not warnings) or a selector without the `ask` prefix.                                                               | Fix the code. Do not disable the rule.                                                                            |
| `test`               | A failing spec, or a spec that reads a path relative to `__dirname`.                                                                                              | Fix the code or the test. Coverage instrumentation breaks `__dirname`; use `workspaceRoot` from `@nx/devkit`.     |
| `build`              | A type error in a template, or a bundle over budget (warning 350 kB, error 500 kB initial).                                                                       | Fix the code; do not raise the budget to hide growth.                                                             |
| `typecheck`          | A type error that only a spec file has: the app builds do not compile specs.                                                                                      | Fix the spec. `tsc -p tsconfig.base.json --noEmit` shows the same error.                                          |
| `check:architecture` | You added or removed a project or a dependency between projects, and `docs/architecture/c4-containers.md` was not updated.                                        | Update the `Container` and `Rel` lines to match; the message names the edge. See the `update-architecture` skill. |
| `check:docs`         | A dead link, an `npm run` script or Nx project that does not exist, an ADR whose status differs from its index row, or a skill whose frontmatter breaks the spec. | Fix the doc, not the check. The message names the file and line.                                                  |
| `check:tokens`       | A component names a colour (`bg-white`, `text-slate-500`, `bg-[#fff]`) or overrides one with `dark:`.                                                             | Use the semantic token for the role; if none fits, add one to `libs/tokens`. The message names the file and line. |
| `check:packages`     | A built package imports something its manifest does not declare, or a file it promises is not shipped.                                                            | Declare it in `libs/<name>/package.json` and `ng-package.json`, or add the asset; the message names the file.     |
| `format`             | Unformatted files.                                                                                                                                                | `npx prettier --write <files>`. The commit hook formats staged files; files you did not stage are not.            |

## Install problems

`npm ci` reporting `ERESOLVE` means the dependency tree has a real conflict. The repo `.npmrc` sets
`legacy-peer-deps=false` on purpose; a user-level `legacy-peer-deps=true` once hid a conflict that
failed CI. Do not add `--legacy-peer-deps`. Fix the versions instead.

## Done when

- `npm run verify` and `npm run format:check` both exit 0 on the final state of the change, after
  your last edit.
- Each conditional check that applies (docs, Pages, e2e, above) has run and passed.
- Your report names every command you ran and its result, and every check you could not run, with
  the reason. A change with an unrun check is reported as not verified.
