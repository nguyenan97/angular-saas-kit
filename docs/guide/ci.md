# Continuous integration

The repository is public, MIT-licensed and edited often, so the pipeline has two jobs: hold
`main` to the bar of a serious open-source kit (scanned, formatted, tested, protected), and
not do redundant work when commits arrive in bursts. The reasoning is in
[ADR 0009](../adr/0009-strict-ci-gates-and-a-protected-main.md) and
[ADR 0010](../adr/0010-dependabot-grouping-and-ignored-major-versions.md).

## The workflows

| Workflow       | Runs on                                        | What it does                                                          |
| -------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **CI**         | every pull request to `main`, and pushes to it | Lint, test, build, typecheck, format, and the architecture check.     |
| **CodeQL**     | every pull request to `main`, and weekly       | Static analysis of the JavaScript and TypeScript for vulnerabilities. |
| **Pages**      | every pull request to `main`, and pushes to it | Builds the demo site and these docs. Deploys only from `main`.        |
| **Dependabot** | weekly for npm, monthly for GitHub Actions     | Opens pull requests for dependency updates.                           |

CodeQL's weekly run is Monday at 03:17 UTC, and it does not run on pushes to `main`.

## What a pull request must pass

| Check          | Command to reproduce it | What it catches                                                                               |
| -------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| **lint**       | `npm run lint`          | Rule violations, including template accessibility, which are errors.                          |
| **test**       | `npm test`              | Failing unit tests. Collects coverage for every project.                                      |
| **build**      | `npm run build`         | A build that breaks, or a bundle over its budget.                                             |
| **typecheck**  | `npm run typecheck`     | Type errors the app builds do not compile, such as in spec files.                             |
| **format**     | `npm run format:check`  | Code that Prettier would change.                                                              |
| **Build site** | `npm run pages`         | A dead documentation link, a wrong base href, a page that points at a file that is not there. |

`Build site` is the Pages workflow's build job. It is required because the site is built from
`main` on every merge: a broken docs page would otherwise pass review and then fail the deploy.

The `lint` job also runs `npm run check:architecture`, which fails when the container map in
[Architecture](../architecture/c4-containers.md) and the imports in the source disagree.

`lint`, `test` and `build` go through `nx affected`, so they only run for the projects your
change reaches. `typecheck` and `format` always cover the whole workspace.

## Keeping it cheap

- **A new push cancels the run in flight.** The commit it was checking is already stale.
- **`nx affected`** limits work to what a change can break.
- **No path filters.** A workflow skipped by a path filter creates no check at all, so once
  checks are required, a docs-only pull request would wait forever for one that never
  reports. `nx affected` already makes those runs cheap.
- **CodeQL skips pushes to `main`.** It analyses pull requests and runs weekly. That needed
  the advanced setup (its own workflow file), because GitHub's default setup cannot skip the
  push trigger.
- **The Pages site deploys only from `main`.** A pull request builds and checks it, and
  attaches the result as a downloadable artifact.
- **Small checks ride on an existing job.** The architecture check has no dependencies of
  its own, so it shares the `lint` runner instead of starting one.

## How `main` is protected

- The six checks above are **required**, and the branch must be **up to date** with `main`
  before it can merge.
- **No review approval is required**, and administrators are not forced through the rules.
  There is one maintainer, and a required approval would lock them out of merging their own
  pull requests.
- Force pushes and deletion of `main` are blocked.
- Pull requests are **squash-merged**, so `main` is one conventional commit per change. See
  [Commits](https://github.com/nguyenan97/angular-saas-kit/blob/main/CONTRIBUTING.md#commits).
- **CodeQL is not required.** A pull request from a fork always gets a read-only token, so
  CodeQL's upload fails for every fork whatever the workflow grants; requiring it would block
  outside contributors. It still runs and reports.

Because the branch must be up to date, merging several pull requests in a row needs an
"Update branch" and a fresh run for each after the first.

## Security scanning

- **CodeQL** on pull requests and weekly, as above.
- **Dependabot alerts and security updates** are on, alongside the weekly version updates.
- **Secret scanning and push protection** are on.
- To report a vulnerability, see the
  [security policy](https://github.com/nguyenan97/angular-saas-kit/blob/main/SECURITY.md).

### Dependabot pull requests

Angular packages move together in one pull request, and so do the Nx packages, because
`@angular/compiler` and `@angular/compiler-cli` peer-depend on each other's exact version and
neither installs alone. Everything else that is a dev dependency and only a minor or patch
bump is grouped separately. Major updates are ignored for `vitest`, `@vitest/*` and
`@types/node`, which the toolchain does not support yet.

A Dependabot pull request that fails `npm ci` is never merged. Read the dependency chain
before accepting a security fix: the proposed one can be worse than removing an unused
package.

## Codecov

Coverage is uploaded to Codecov from the `test` job, with `fail_ci_if_error: false`.

> [!WARNING]
> **The upload is not active yet.** Codecov rejects it, saying a token is required because
> the branch is protected, and because of `fail_ci_if_error: false` that is hidden behind a
> green build. It needs a `CODECOV_TOKEN` repository secret, passed to the action as `token:`.

## When a check fails

Reproduce it locally first: the commands are in the table above, and `npm run verify` runs
the first three, the typecheck and the architecture check in one go. Installs must resolve
peer dependencies the way CI does. A user-level `legacy-peer-deps=true` once hid a conflict
that failed `npm ci` in CI, so the repository `.npmrc` pins `legacy-peer-deps=false`.
