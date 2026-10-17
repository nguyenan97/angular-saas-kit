# 0022. The token and signal rules are checked by machine

- **Status:** Proposed
- **Date:** 2026-10-17
- **Deciders:** @nguyenan97

## Context

`AGENTS.md` lists the rules that are not negotiable. Some of them a machine already holds: template
accessibility and the selector prefix are lint errors, module boundaries are lint errors
([0015](0015-enforce-module-boundaries-with-nx-tags.md)), and the architecture map has its own
check. Two were held only by a reviewer and a box in the pull request template:

- **Components never name a colour** ([0004](0004-semantic-design-tokens-and-three-axis-theming.md)).
  A `bg-white` or a `dark:` override breaks the theme, the accent and the contrast axes at once,
  and it looks right in the one combination the author tried.
- **Inputs, outputs and queries are signals** ([0003](0003-zoneless-signals-first-onpush-components.md)) (`input()`, `output()`, `model()`, `viewChild()`),
  not decorators.

A third, **every component is `OnPush`**, turned out to be held already: OnPush is the default
since Angular 22, and `prefer-on-push-component-change-detection`, which rejects an opt-out, is in
angular-eslint's `tsRecommended`. The code obeys the other two today: no named colour outside
`libs/tokens`, specs and stories, and no `@Input()` or `@Output()`. That is the cheapest moment to add a check: it locks the state in
without a single fix. Agents write much of the code here, and an agent follows a check more reliably
than a sentence.

## Decision

- [`scripts/check-tokens.mjs`](../../scripts/check-tokens.mjs) scans the `.ts` and `.html` under
  every project's `src/`, except `libs/tokens`, specs and stories, for Tailwind palette colours
  (`text-slate-500`), `white` and `black`, arbitrary colour values (`bg-[#fff]`) and any colour
  utility behind `dark:`. It prints each one with its file and line. It runs as
  `npm run check:tokens`, inside `npm run verify`, and on the `lint` leg of CI next to the
  architecture check.
- The workspace ESLint config turns on `@angular-eslint/prefer-signals` and
  `@angular-eslint/prefer-output-emitter-ref` as errors.
- `AGENTS.md` keeps one line per rule and stops carrying the examples, since the check's message
  now carries them.

## Alternatives considered

- **`eslint-plugin-tailwindcss`** - a new dependency whose Tailwind v4 support has lagged, and its
  rules are about class order and unknown classes, not about colour names.
- **A custom ESLint rule** - it would need an in-repo plugin and a parser for the inline templates.
  A script is a few dozen lines, reads `.html` and `.ts` alike, and matches the shape of
  `check-architecture.mjs` and `check-packages.mjs`.
- **Leave it to review** - the rule is the kit's main promise, and the box in the template is ticked
  by the same person, or agent, who wrote the code.

## Consequences

- A colour built at runtime (`'bg-' + colour`) or a class from a variable the script cannot read
  passes. The check catches the common mistake, not every possible one.
- Prose that quotes a forbidden class inside a scanned file (a blog post about the rule, say) fails
  the check. Write it another way or keep it out of `src/`; there is no ignore comment, on purpose.
- A new Tailwind colour utility (a new prefix) is invisible until it is added to the script's list.
- One more step in `verify` and on the `lint` runner, well under a second.

## References

- [`scripts/check-tokens.mjs`](../../scripts/check-tokens.mjs), [`eslint.config.mjs`](../../eslint.config.mjs)
- [0009](0009-strict-ci-gates-and-a-protected-main.md), the gates this joins
- The review that proposed it: `docs/superpowers/specs/2026-10-17-agent-environment-review.md`
