# Report: the suite's Booking context

Date: 2026-10-18 to 2026-10-19 (the file is named for the day the batch started, as the plan says). Mode: autonomous (ADR 0027). Spec:
[`../specs/2026-10-17-suite-booking-design.md`](../specs/2026-10-17-suite-booking-design.md). Plan:
[`../plans/2026-10-18-suite-2-booking-context.md`](../plans/2026-10-18-suite-2-booking-context.md)
(plan 1, the kernel and the domain, merged earlier as #73).

## What merged

Each pull request was squash-merged with every required check green on its final commit and the
branch up to date with `main`. Before each merge a separate agent, started for the purpose with the
`review-change` skill and reading the branch only through git refs, reviewed the diff; every
blocking and should-fix finding was fixed in follow-up commits on the same pull request and
re-reviewed until none was left. The reviews ran in this session and are summarised in each pull
request's body ("Written with AI").

| PR  | Pull request                                                    | What it did                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | [#105](https://github.com/nguyenan97/angular-saas-kit/pull/105) | `mock-api` answers with any status (`mockResponse`); `booking-contracts` (API paths, DTOs, `OrderPlacedV1`, `OrderCancelledV1`); `booking-data-access` (`OrdersRepository`, `OrdersStore`, a `/mock` entry with seed and routes) |
| B   | [#106](https://github.com/nguyenan97/angular-saas-kit/pull/106) | `Combobox` (CDK active descendant, listbox) and `Timeline` in `libs/ui`, each with README, spec, stories and a row in the components guide                                                                                       |
| C   | [#107](https://github.com/nguyenan97/angular-saas-kit/pull/107) | `apps/suite` (module shell, Overview, mock backend with the event bus and activity log) and `booking-feature-orders` (Orders, New order, Order detail)                                                                           |
| D   | [#108](https://github.com/nguyenan97/angular-saas-kit/pull/108) | `apps/suite-e2e` with `playwright-bdd` (seven scenarios) and axe; the CI `e2e` job; the Pages build at `/suite/`; the landing link; the suite guide, README roadmap, C4, CONSTRAINTS rows                                        |
| E   | this pull request                                               | This report and its retro                                                                                                                                                                                                        |

What the reviews caught, in short: a too-wide data-access boundary, a name the glossary forbids,
an Overview test that could not fail, mock errors that skipped the latency, a malformed body that
threw (A); Tab after emptying the combobox keeping the old value, the empty-state live region,
forced colours (B); a New order page that broke when its reference data failed, focus lost after a
refusal, after Retry and after an invalid submit, the search box not following Back (C).

What running the code caught that unit tests did not: a root-provided `OrdersRepository` took the
root `HttpClient`, without the mock interceptor, so the Overview's figures went to the network
(found in the browser, fixed in C); the combobox undid a Down pressed straight after typing (found by
the BDD tests, fixed in C); a `role="group"` on a `<dl>` orphaned its terms (found by axe, fixed in
C); a BDD step that raced the mock's random latency (fixed in D).

## Decisions and ADRs

No new ADR: the hard-to-reverse decision (bounded contexts as Nx libraries, four layers) is
[ADR 0021](../../adr/0021-bounded-contexts-as-nx-libraries.md), amended in A and C as the layers
arrived. The rest is in the plan's decision log: `mockResponse` instead of throwing for non-200
answers; the list state in the feature (URL-driven), the current order in the store; an inline
listbox for the combobox, not a CDK overlay; four pull requests over the 400-line guide, as the
person asked for the spec's split; `role:mock-backend` on `mock-api` so data access cannot reach
`ui`; DTOs alias domain types until a second context consumes them.

## Assumptions

The plan's nine, answered instead of asked: the DTO shapes; placing as two requests with the draft
reused on a retry; `GET /api/booking/overview` for the Overview's figures (the spec's API table
had none); VND only in the seed; slots 14 days back and ahead; the mock as a second entry point;
`mockResponse`; the `suite` commit scope; the theme script in a fourth `index.html`. One more, made
while building: the New order page edits quantities only; a line's discount is zero from the page
(the API and the domain take one).

## Dropped, not done, or left red

- Nothing is left red. Every required check passed on every merged pull request.
- **BDD order.** The spec asks for the scenario before the page; the spec's own Delivery section
  puts the e2e pull request last, and the pages were built first, test-first at the component level.
  The feature files were written before their steps (the red run is in #108), not before the pages.
  Retro 4 proposes the fix.
- Not built, recorded with a reason: a check icon on the chosen combobox option (review nit; the
  option is `aria-selected` and bold); `layer:feature` still admits every `scope:shared` library
  (the spec's wording); the tab panel and the scrollable results region are two tab stops (the
  region must scroll by keyboard).
- Not checked: a screen reader by hand; Firefox and WebKit for the suite (only Chromium is
  configured, as CI runs).

## Live

The Pages workflow deployed #108 (`f4cf240`) from `main`:
[`/angular-saas-kit/suite/`](https://nguyenan97.github.io/angular-saas-kit/suite/) answers 200 with
`<base href="/angular-saas-kit/suite/">`, and the landing page carries the "Suite demo" link to
`suite/`. The Storybook on the site has the Combobox and Timeline stories since #106.

## Needs a person

- **A screen-reader pass** of the New order page (combobox, slot radios, totals) and the Order
  detail dialog, with NVDA or VoiceOver. axe and the BDD steps check structure and keys, not speech.
- Nothing in settings: `e2e` was already a required check, and the suite's tests run inside that
  job, so branch protection needs no change.

## Branches deleted

Each merged pull request's branch, on GitHub and locally, after checking its head against the
merged pull request's `headRefOid` (and the session's own starting branch, never pushed, with no
commits of its own). `git branch <name> <sha>` restores any of them:

```text
feat/repo-booking-data-access a5e2525cace1daff0f2b66e5e86cf3032d4bd7d7
feat/ui-combobox-timeline 548a302be1b2096811ce4fe26cad989cb00496e7
feat/suite-app-orders 14d82487416c6fab829b59360dd7ef92c9ad8808
features/suite-booking-context-3fd331 2fa06ffd71344a71584b93006d85db6ff6bb2292 (local only, never pushed, no commits of its own)
feat/suite-e2e-pages-docs a5ec8734ef0cf9e797be1c443e903a1d30578b93
```

Kept: every other local branch is checked out in another session's worktree (`build/angular-22.2.2`,
`ci/*`, `docs/accept-adr-0020`, `feat/ui-alert-avatar-skeleton`, `features/*`,
`refactor/dashboard-form-field`), which that session owns; none of them is this batch's.

## What to do next

1. The retro's fixes below, each in its own pull request.
2. The SCM context's spec (`write-spec`): it subscribes to `OrderPlacedV1` through
   `booking-contracts`, the first cross-context dependency, and adds the `scope:scm` rules.
3. A check icon and a selected style for the combobox, if adopters ask.

## Retro

Most severe first. None is applied here; each accepted fix gets its own pull request.

1. **A service provided in root bypassed the route's interceptors** (high). `OrdersRepository` was
   `providedIn: 'root'`; since Angular provides `HttpClient` in root, it took that one, without
   the mock backend the pages route adds. Every unit test passed (they provide `HttpClient`
   themselves); only the browser showed it (d07d25b in #107). Fix, a spec pattern: the suite's
   `pages.routes.spec.ts` asks the route's injector for the repository and expects the mock's
   answer; add that step to `add-dashboard-page` ("prove the page's data comes from the route's
   providers") and a line to `AGENTS.md` Traps: a service that uses `HttpClient` is provided next
   to `provideHttpClient`, never in root.
2. **`resource.value()` throws in an error state** (high). Two pages read it with `?? []`
   (Overview, then New order: a blocking review finding in #107). Fix, a check: a
   `scripts/check-*.mjs` rule (or a lint rule) that flags `.value() ??` and `.value()?.` on a
   resource, wired into `verify` and listed in `CONSTRAINTS.md`; the fix it points to is
   `hasValue() ? value() : fallback`.
3. **`whenStable()` waits for open HTTP requests** (medium). Component tests hung for the 5-second
   timeout four times before each one flushed its request first, and each spec grew its own `tick`
   helper. Fix, a skill edit to `test-first`: flush the request before `whenStable()`, or wait with
   a timer; and one shared helper in a testing entry point if a third app needs it.
4. **BDD after the pages** (medium). The spec's Delivery order contradicted its Testing rule, and
   `plan-tasks` followed Delivery. Fix, a skill edit to `plan-tasks`: a user-facing scenario's
   feature file and steps belong to the task that builds its page, not to a later e2e task.
5. **BDD steps racing the mock's latency** (low). Parallel reference requests land 200 to 600 ms
   apart; a step pressed a key before the list it read had arrived (29bb6db in #108). Fix, a line in
   the suite guide's tests section: a step waits for what a person reads before acting on it.
6. Skipped, one-offs of this machine or session: a Bash heredoc with an apostrophe failing in the
   agent's shell; a git index left "modified" with an empty diff after a commit hook; the local
   Chromium build older than Playwright expects (a local config, not committed). None belongs in the
   repository.
