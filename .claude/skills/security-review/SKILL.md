---
name: security-review
description: Review a change for security before its pull request when it touches a sensitive area - user input, HTML or URLs, storage, a server or its headers, a dependency, a workflow, secrets, or (when they exist) auth and an API - starting from what the diff can reach, rating by blast radius, and naming the scan or test that holds each fix. Use before opening a pull request in those areas, or when asked for a security review.
---

# Security review

A differential review: start from what the diff changes and follow it outward, rather than auditing
the whole codebase. The scans that run anyway, and what each one misses, are in the security table
of `docs/guide/ci.md`; this skill covers what they cannot judge.

## When to use

Before opening a pull request that touches any trigger below, and as the depth behind the security
axis of `review-change`.

## When not to use

- A change with none of the triggers (a docs page, a token value, a component's layout): the CI
  scans are enough, and the review says so in one line.
- A full audit of the repository: this reviews one diff.

## 1. Find the triggers in the diff

```bash
git fetch origin && git diff origin/main...HEAD --stat
```

| Trigger                                                      | Look for                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Input reaching HTML, a URL, a selector, a log or storage     | `innerHTML`, `bypassSecurityTrust*`, a URL built from input, `localStorage` of anything a user should not read back            |
| The landing server (`apps/landing/src/server.ts`) or headers | a header weakened in `security-headers.ts`, a new route, `NG_ALLOWED_HOSTS` loosened                                           |
| A new or upgraded dependency                                 | its maintainers and age, an install script (`allowScripts` in `package.json`), its licence, what it pulls in (`npm ls <name>`) |
| A workflow under `.github/workflows`                         | a trigger fed by forks or comments, wider `permissions:`, an unpinned `uses:` or image, `${{ }}` inside a `run:`               |
| A secret, a token, a key, a fixture with credentials         | anything that looks like one, even marked "test"                                                                               |
| An AI agent in a workflow or a script                        | input from issues, comments or forks reaching its prompt (the floor in `CONSTRAINTS.md`)                                       |
| Auth, sessions, an API, a database (when they exist)         | the OWASP ASVS chapter for each: authentication, session management, access control, validation                                |

## 2. Rate each finding by blast radius

- **Blocking**: a user's data or session exposed, code run from input, a secret in the history, a
  workflow an outsider can steer. Fix before the pull request; a secret is also rotated, since
  removing the commit does not un-leak it.
- **Should fix**: a defence weakened without an exploit in sight (a header relaxed, a permission
  broadened "for now").
- **Nit**: hardening that is cheap and optional.

For a change that adds a data flow or a network boundary, write the STRIDE lines the
`solution-design` skill describes, if the design did not.

## 3. Tie each fix to a check

A fix that a machine can hold gets one: a test (`security-headers.spec.ts` for headers), a lint
rule, a scan setting, a `CONSTRAINTS.md` row. A fix that only review can hold says so in the report.

## Done when

- Every trigger in the table was checked against the diff, or the report says none applies.
- Every finding has a severity, a file and line, and a fix.
- Every blocking finding is fixed, and each fix has a check, or the report says why review alone
  holds it.
- The CI scans (CodeQL, zizmor, dependency review, gitleaks) are green on the pull request.
