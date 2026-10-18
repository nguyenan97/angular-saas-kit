---
name: review-change
description: Review a branch or pull request on four separate axes - spec, standards (including the CONSTRAINTS.md floor and performance), security, accessibility - and report findings by axis with a severity each. User-invoked; run by an agent or session other than the one that wrote the change.
---

# Review a change

## When to use

Before every pull request the agent merges, whatever its size (a small change or a Dependabot
bump gets a short pass: the diff, the floor, the claims in its body), and on request. It is a
mandatory gate, and with autonomous mode the default it is the only review before merge
(`docs/guide/development-process.md`).

## When not to use

- In the session or agent that wrote the change: a writer reviewing their own diff misses what they
  meant to do. Start another agent or session, give it this skill and the branch, and only the
  sources each axis lists.
- On an empty diff or a ref that does not resolve: stop and say so.

## Start

Review the diff between the branch and the point it left `main`:

```bash
git fetch origin
git diff origin/main...HEAD          # three dots: against the merge base
git log --oneline origin/main..HEAD
```

If the diff is empty or the ref does not resolve, stop and say so. Review the tests before the
code: a test that cannot fail proves nothing.

## The four axes

Run each axis as its own pass, so one does not mask another. Where the agent can start
subagents, give each axis its own, with the diff command and only that axis's sources.

| Axis              | Sources                                                                                                    | Look for                                                                                                                                                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**          | The spec and plan the change came from (`docs/superpowers/`, the PR body, the issue)                       | A requirement or scenario not built or not tested; behaviour nobody asked for; a scenario whose test asserts something else                                                                                                                                                                                                                  |
| **Standards**     | `AGENTS.md`, `CONSTRAINTS.md` (the floor, line by line), the ADRs the change touches                       | A floor breach (suppression, skipped test, removed assertion, lowered threshold, empty `catch`, stub); a rule `AGENTS.md` states; duplicated logic; a name the glossary does not use; performance: a new eager import that belongs behind a lazy route or `@defer`, an initial bundle closer to its budget, a component that is not `OnPush` |
| **Security**      | The diff, with extra care where it handles input, URLs, HTML, storage, a new dependency or a workflow file | `innerHTML` or `bypassSecurityTrust*`; user input reaching a URL, a selector or a log; a secret or token; a new dependency (its maintainers, install scripts, licence); a workflow with broader `permissions:`, `pull_request_target` or an unpinned action. For depth, the `security-review` skill                                          |
| **Accessibility** | `AGENTS.md`, the WAI-ARIA pattern for any new widget                                                       | Keyboard operation, visible focus, announced state, labels, heading order, a role where a native element would do                                                                                                                                                                                                                            |

Skip an axis only with a reason in the report ("no spec: a dependency bump").

## Severity

- **Blocking**: wrong behaviour, a floor breach, a security hole, a keyboard or screen-reader user
  locked out. The change does not merge.
- **Should fix**: a real problem that can follow in the next change, with a reason.
- **Nit**: style or naming the author may ignore.

Every finding names the file and line, quotes the code or the rule, and says what to do.

## Report

One section per axis, in the order above, findings by severity. Do not merge or rerank across
axes. End with one line: the count per axis, and whether anything blocks.

## Done when

- All four axes were reviewed, or the report gives the reason one was skipped.
- Every finding has a severity, a location and a fix.
- Every line of the floor in `CONSTRAINTS.md` was checked against the diff.
- The report says plainly whether the change can merge, and names the session or agent that wrote
  the change and the one that reviewed it: they are not the same.
