# Continuous integration

The repository is public, MIT-licensed and edited often, so the pipeline has two jobs: hold
`main` to the bar of a serious open-source kit (scanned, formatted, tested, protected), and
not do redundant work when commits arrive in bursts. The reasoning is in
[ADR 0009](../adr/0009-strict-ci-gates-and-a-protected-main.md) and
[ADR 0010](../adr/0010-dependabot-grouping-and-ignored-major-versions.md).

## The workflows

| Workflow       | Runs on                                             | What it does                                                                                           |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **CI**         | every pull request to `main`, and pushes to it      | Lint, test, build, typecheck, format, the architecture and package checks, and the browser tests.      |
| **CodeQL**     | every pull request to `main`, and weekly            | Static analysis of the JavaScript and TypeScript for vulnerabilities.                                  |
| **Pages**      | every pull request to `main`, and pushes to it      | Builds the demo site and these docs. Deploys only from `main`.                                         |
| **Security**   | every pull request to `main`, and pushes to it      | zizmor on the workflows; on pull requests, dependency review of what the change adds.                  |
| **PR title**   | every pull request to `main`, and title edits       | commitlint on the title, which becomes the squash commit. Skips Dependabot.                            |
| **Scorecard**  | pushes to `main`, weekly, branch-protection changes | OpenSSF Scorecard: grades the repository's security practices, results in code scanning and the badge. |
| **Dependabot** | weekly for npm, monthly for GitHub Actions          | Opens pull requests for dependency updates.                                                            |

CodeQL's weekly run is Monday at 03:17 UTC, and it does not run on pushes to `main`.

## What a pull request must pass

| Check          | Command to reproduce it    | What it catches                                                                               |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| **lint**       | `npm run lint`             | Rule violations. Template accessibility and module boundaries are errors.                     |
| **test**       | `npm test`                 | Failing unit tests. Collects coverage for every project.                                      |
| **build**      | `npm run build`            | A build that breaks, or a bundle over its budget.                                             |
| **typecheck**  | `npm run typecheck`        | Type errors the app builds do not compile, such as in spec files.                             |
| **format**     | `npm run format:check`     | Code that Prettier would change.                                                              |
| **e2e**        | `npx nx e2e dashboard-e2e` | Keyboard and layout behaviour jsdom cannot see, in a real browser.                            |
| **Build site** | `npm run pages`            | A dead documentation link, a wrong base href, a page that points at a file that is not there. |

`Build site` is the Pages workflow's build job. It is required because the site is built from
`main` on every merge: a broken docs page would otherwise pass review and then fail the deploy.

`e2e` runs the [browser tests](testing.md#browser-tests) in Chromium
(`npx playwright test --project=chromium`, about a minute, with the report and traces kept when
it fails). It proves what jsdom cannot, such as the keyboard behaviour of the theme switcher. It
became required on 2026-09-28, after passing on all 13 pull requests since it was added: a
flaky required check blocks every merge, so it had to earn the place.

The `lint` job also runs `npm run check:architecture`, which fails when the container map in
[Architecture](../architecture/c4-containers.md) and the imports in the source disagree, and
`npm run check:tokens`, which fails when a component names a colour instead of a semantic token
([ADR 0022](../adr/0022-the-token-and-signal-rules-are-checked-by-machine.md)). The
`build` job then runs `npm run check:packages` on what it built: it fails when the `tokens` or
`ui` package imports something its manifest does not declare, or does not ship a file it
promises ([ADR 0016](../adr/0016-packages-declare-and-ship-what-they-need.md)). A change that
reaches no library builds none, and the check says there is nothing to check.

The `pr title` workflow runs commitlint on the pull request's title, which becomes the squash commit on
`main` ([ADR 0012](../adr/0012-conventional-commits-and-squash-merges.md)). It reruns when the title is edited, and is not required yet;
Dependabot's pull requests skip it.

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
- **Small checks ride on an existing job.** The architecture and package checks have no
  dependencies of their own, so they share the `lint` and `build` runners instead of starting
  one each.

## How `main` is protected

- The seven checks above are **required**, and the branch must be **up to date** with `main`
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
- **Every action is pinned to a commit SHA**, with its version in a comment
  (`uses: actions/checkout@<sha> # v7.0.1`). A tag can be moved to other code, as happened to
  `tj-actions/changed-files` in March 2025; a SHA cannot. Dependabot updates the SHA and the
  comment together. Checkouts set `persist-credentials: false`, so no job leaves the token in
  `.git/config`.
- **zizmor** checks the workflows and `dependabot.yml` on every pull request: template
  injection, broad permissions, an unpinned action, credentials left behind, no cooldown. A
  finding fails the job.
- **Dependabot waits seven days** before proposing a new release (`cooldown`), so a compromised
  version is usually pulled before it reaches a pull request. Security updates are not delayed.
- **Dependency review** fails a pull request that adds, or upgrades to, a dependency with a known
  vulnerability at `high` or above, or under a licence outside the allow list in
  `.github/workflows/security.yml`. It judges only what the change adds.
- **OpenSSF Scorecard** runs weekly and on every push to `main`; its score is the badge in the
  README.
- **gitleaks** scans the commits each pull request adds, and each push to `main`, for secrets
  push protection does not know: generic keys, private key blocks
  ([ADR 0026](../adr/0026-secret-scanning-osv-sbom-and-a-dast-baseline.md)).
- **The `Security scans` workflow** runs weekly, on every push to `main` and on demand: OSV-Scanner on
  the lockfile, a CycloneDX SBOM of the production dependencies, and two passive ZAP baselines: one of the
  built Pages site served locally, one of the landing page's Node server, which sends the
  security headers Pages cannot. It reports and never blocks.

- To report a vulnerability, see the
  [security policy](https://github.com/nguyenan97/angular-saas-kit/blob/main/SECURITY.md).

| Scan                | Runs                       | Blocks merge?           | Results                             | Who acts                                    |
| ------------------- | -------------------------- | ----------------------- | ----------------------------------- | ------------------------------------------- |
| CodeQL (SAST)       | PRs, weekly                | No (not required, 0009) | code scanning                       | the PR author; the maintainer weekly        |
| zizmor (workflows)  | PRs, `main`                | Fails the job           | the job log                         | the PR author                               |
| Dependency review   | PRs                        | Fails the job           | the job log                         | the PR author                               |
| gitleaks (secrets)  | PRs, `main`                | Fails the job           | the job log, redacted               | the PR author: remove and rotate the secret |
| Push protection     | every push                 | Rejects the push        | the push                            | whoever pushed                              |
| OSV-Scanner         | weekly, `main`, on demand  | No                      | code scanning                       | the maintainer, with `dependabot-triage`    |
| SBOM (CycloneDX)    | weekly, `main`, on demand  | No                      | the `sbom` artifact                 | consumers of the kit; a future release      |
| ZAP, landing server | weekly, `main`, on demand  | No                      | the `zap-baseline-landing` artifact | the maintainer                              |
| ZAP baseline (DAST) | weekly, `main`, on demand  | No                      | the `zap-baseline` artifact         | the maintainer                              |
| Scorecard           | weekly, `main`             | No                      | code scanning, the badge            | the maintainer                              |
| Security headers    | every PR (`landing` tests) | Fails `test`            | the test report                     | the PR author                               |

"Fails the job" means the check goes red on the pull request; it holds the merge once the
maintainer makes it required (ADR 0009).

### Dependabot pull requests

Angular packages move together in one pull request, and so do the Nx packages, because
`@angular/compiler` and `@angular/compiler-cli` peer-depend on each other's exact version and
neither installs alone. Everything else that is a dev dependency and only a minor or patch
bump is grouped separately. Major updates are ignored for `vitest`, `@vitest/*`,
`@types/node` and `typescript`, which the toolchain does not support yet.

A Dependabot pull request that fails `npm ci` is never merged. Read the dependency chain
before accepting a security fix: the proposed one can be worse than removing an unused
package.

## When a check fails

Reproduce it locally first: the commands are in the table above, and `npm run verify` runs
the first three, the typecheck and the architecture and package checks in one go. Installs must resolve
peer dependencies the way CI does. A user-level `legacy-peer-deps=true` once hid a conflict
that failed `npm ci` in CI, so the repository `.npmrc` pins `legacy-peer-deps=false`.
