---
name: refactor
description: Change the structure of code without changing its behaviour - evidence first, tests that pin the behaviour before the change, small green steps, expand-migrate-contract for wide changes, a measurement before and after, and a pull request that changes no behaviour. Use for a refactor, a cleanup, removing dead code, a performance optimisation (bundle size, lazy loading, @defer, OnPush), or a structural rule to turn into a check.
---

# Refactor

## When to use

- The structure gets in the way: duplicated logic, a module that is hard to test through its
  interface, a file that mixes concerns, dead code.
- A measured cost to bring down: an initial bundle near its budget, an eager import that belongs
  behind a lazy route or `@defer`, a component that re-renders too often.
- A structural rule that review keeps enforcing by hand and a check could hold.

## When not to use

- To change what the code does: that is a feature or a fix, with `test-first`. A pull request does
  one or the other, never both.
- Without evidence: a finding from an audit, a measurement, or a change it blocks. "Cleaner" is not
  evidence.

## 1. Evidence and a number

Write down what is wrong and what will improve, with a number where there is one: the initial
bundle (`npx nx build <app> --skip-nx-cache`, the "Initial total" row), duplication
(`npx jscpd apps libs --ignore "**/*.spec.ts"`), a file's length, coverage. Take the number now; the
pull request shows it before and after.

## 2. Pin the behaviour

Every path the refactor touches must be covered by a test that passes before the change. Where
none exists, write a **characterization test** first: it asserts what the code does today, even if
that looks wrong (a wrong behaviour found this way is a separate bug and a separate pull request).
Commit the tests on their own, green.

## 3. Small green steps

One move at a time (extract, inline, rename, move), each followed by `npx nx test <project>` and a
commit while green. A step that turns a test red is undone, not patched forward.

For a change too wide to land green in one step (a rename across the workspace, a moved type),
**expand, migrate, contract**: add the new form beside the old one; move the callers over in
batches, one pull request per batch; remove the old form once nothing uses it. `main` stays green
at every step.

## 4. Optimise with Angular's levers

- **Lazy routes** (`loadComponent`) for whole pages; **`@defer (on viewport)`** for content below
  the fold or behind an interaction, with a `@placeholder` that keeps the layout's height. A
  prerendered page renders the placeholder on the server, so content that must be in the HTML for
  search engines or for reading without JavaScript is not deferred.
- **OnPush and signals** everywhere already (`CONSTRAINTS.md`); a `computed` instead of work in a
  template.
- **Dead code** goes; a test that only covered dead code goes with it, and the commit says so.

## 5. Make it a check

If the refactor enforced a rule (a boundary, a naming pattern, a forbidden import), add it as a
lint rule or to a `scripts/check-*.mjs` with a test, in `verify` and `CONSTRAINTS.md`, so it does
not need doing again.

## Done when

- The evidence and the before and after numbers are in the pull request body.
- Every touched path was covered by a test before the change, and no test was changed to pass
  except a characterization test that the PR says it rewrote.
- The pull request changes no behaviour: the same tests pass, before and after, with no assertion
  removed.
- `npm run verify` and `npm run format:check` pass. Then `open-pr`.
