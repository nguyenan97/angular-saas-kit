---
name: test-first
description: Build or fix code test-first in this repository - agree the seams, write one failing test at a public seam, make it pass, repeat one vertical slice at a time; pick the right level (domain unit, component, browser test against a spec scenario) and avoid the tests that cannot fail. Use when implementing a task from a plan, fixing a bug, or adding behaviour to a component, a page or a domain library.
---

# Test first

The red → green loop, as it is done here. The layers and tools are in `docs/guide/testing.md`; the
trace from requirement to scenario to test is in `docs/guide/development-process.md`.

## When to use

- Building a task from a plan, a component (`add-ui-component`), a page (`add-dashboard-page`) or a
  domain operation (`domain-modeling`).
- Fixing a bug: the first test reproduces it.

## When not to use

- Docs, CI configuration, a dependency bump: the check that proves them is a command, not a test.
- Changing structure without changing behaviour: that is the `refactor` skill, which needs the
  tests to exist first.

## 1. Agree the seams

A seam is the public boundary a test observes: the place where behaviour can be seen without
reaching inside. Write down the seams before the first test, with one line each on what a test
there catches and misses. Here they are:

| Code                         | Seam                                                                          | Level and tool                                                             |
| ---------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| A domain library             | The functions exported from `src/index.ts`, with the builders in `testing.ts` | Unit, Vitest, no TestBed; a fixed `NOW`                                    |
| A `libs/ui` component        | Its inputs, outputs, host classes, ARIA state and keys                        | Component, Vitest and TestBed, zoneless (`provideZonelessChangeDetection`) |
| A dashboard page             | What it renders for each response, through `HttpTestingController`            | Component, as `overview.spec.ts` does                                      |
| A user flow, a spec scenario | What a user sees and does in the browser                                      | Browser, Playwright in `apps/dashboard-e2e`, Chromium in CI                |
| A check script               | Its exported function on a small fixture tree                                 | `node:test`, as `scripts/check-docs.test.mjs` does                         |

jsdom implements no layout, focus order or native keyboard behaviour (a radio group's arrow keys):
prove those in the browser, not in a component test.

## 2. Loop, one slice at a time

1. **Red.** One test at one seam, named after the behaviour as a scenario reads it ("cancelling a
   placed order releases its slot"). Run it and watch it fail for the reason you expect:
   `npx nx test <project>`, or for a browser test `npx nx e2e dashboard-e2e`.
2. **Green.** The least code that passes it. No feature the next test has not asked for.
3. **Next.** Commit when green, then the next test. Do not write all the tests first: the tests
   written before any code test an imagined design.

Restructuring is not part of the loop; once green, the `refactor` skill does it.

## 3. Tests worth keeping

- **Behaviour, not implementation.** A test that breaks when the code is restructured but the
  behaviour has not changed is testing internals: a private method, a mock of the module's own
  collaborator, a check through a side channel.
- **Not tautological.** The expected value comes from an independent source: a literal worked out by
  hand, the spec's example. `expect(total(lines)).toBe(lines.reduce(...))` passes by construction.
- **Can fail.** If deleting the line under test leaves the test green, the test proves nothing. For
  the domain libraries, mutation testing ([Stryker](https://stryker-mutator.io)) is the measure;
  it is not wired in yet.
- **Browser tests** find elements as a user does (`getByRole`, `getByLabel`), assert with
  Playwright's retrying `expect`, never a fixed wait, and do not depend on another test's state.
- **A scenario's test carries its name**, so the spec's scenario can be found in the test report.

## Done when

- Every behaviour added or bug fixed has a test that failed before the change and passes after;
  for a bug, the test reproduces the report.
- Each test sits at a seam from the table, and names a behaviour.
- `npx nx test <project>` passes for each project touched, with the coverage thresholds in
  `CONSTRAINTS.md` held; a browser test passes in `npx nx e2e dashboard-e2e` when one was added.
- Then the `verify` skill.
