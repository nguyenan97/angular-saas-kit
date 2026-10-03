# Architecture decision records

An ADR captures one decision that shaped this codebase: the situation that forced
it, what was chosen, what was rejected, and what it now costs. Read them to find out
_why_ something is the way it is before changing it. The reasoning for
[0001](0001-record-architecture-decisions.md) is the reasoning for this folder.

## Index

| #                                                                   | Decision                                                  | Status   |
| ------------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)                       | Record architecture decisions                             | Accepted |
| [0002](0002-nx-monorepo-with-two-apps-and-shared-libraries.md)      | One Nx workspace: two apps and shared libraries           | Accepted |
| [0003](0003-zoneless-signals-first-onpush-components.md)            | Zoneless, signals-first, OnPush components                | Accepted |
| [0004](0004-semantic-design-tokens-and-three-axis-theming.md)       | Semantic design tokens and three-axis theming             | Accepted |
| [0005](0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)    | Angular CDK and Tailwind instead of a UI library          | Accepted |
| [0006](0006-in-memory-mock-api-instead-of-a-backend.md)             | An in-memory mock API instead of a backend                | Accepted |
| [0007](0007-prerendered-landing-and-client-side-dashboard.md)       | A prerendered landing page, a client-side dashboard       | Accepted |
| [0008](0008-vitest-through-the-angular-test-builder.md)             | Vitest, through the Angular test builder                  | Accepted |
| [0009](0009-strict-ci-gates-and-a-protected-main.md)                | Strict CI gates and a protected `main`                    | Accepted |
| [0010](0010-dependabot-grouping-and-ignored-major-versions.md)      | Dependabot grouping and ignored major versions            | Accepted |
| [0011](0011-github-pages-demo-site.md)                              | A demo site on GitHub Pages                               | Accepted |
| [0012](0012-conventional-commits-and-squash-merges.md)              | Conventional Commits and squash merges                    | Accepted |
| [0013](0013-documentation-site-with-vitepress.md)                   | A documentation site with VitePress                       | Accepted |
| [0014](0014-agent-instructions-in-agents-md-and-skills.md)          | Agent instructions in AGENTS.md, with skills              | Accepted |
| [0015](0015-enforce-module-boundaries-with-nx-tags.md)              | Enforce module boundaries with Nx tags                    | Accepted |
| [0016](0016-packages-declare-and-ship-what-they-need.md)            | Packages declare what they import, ship what they promise | Accepted |
| [0017](0017-icons-from-lucide-data-drawn-by-one-component.md)       | Icons: Lucide's data, drawn by one component              | Accepted |
| [0018](0018-charts-as-svg-on-the-chart-tokens-with-a-data-table.md) | Charts: SVG on the chart tokens, with the data as a table | Accepted |
| [0019](0019-blog-posts-as-prerendered-components.md)                | Blog posts as prerendered Angular components              | Accepted |

Records 0002-0008 were written after the fact, from the code and its history, and
describe what is true today - including what is unfinished.

## Writing one

1. Copy [`template.md`](template.md) to `NNNN-short-title.md`, using the next number.
2. Fill in **Context**, **Decision**, **Alternatives considered** and **Consequences**.
   Delete a section rather than leave it empty. State the costs honestly: a record
   with no downsides is not finished.
3. Set the status to `Proposed`, open a pull request, and discuss it there. It becomes
   `Accepted` when the PR merges; add it to the index above in the same PR.
4. Write an ADR when a decision is expensive to reverse, or when a newcomer would
   reasonably ask "why is it like this?". A change of library version is not one; a
   change of testing strategy is.

## Changing a decision

An accepted record is not rewritten. Write a new ADR that supersedes it, set the old
one's status to `Superseded by [NNNN](NNNN-title.md)`, and link both ways. Fixing a
typo, a link or a status is fine to do in place.
