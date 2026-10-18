---
name: write-docs
description: Add or change a page on the documentation site (docs/guide, docs/reference, docs/architecture, docs/adr) so it reads on GitHub and on the VitePress site, with links that work and snippets that are true. Use when documenting a feature, changing behaviour a guide describes, or adding a guide page.
---

# Write documentation

## When to use

A page in `docs/` to add or change: a feature to document, behaviour a guide describes that
changed, a reference table out of date.

## When not to use

- A C4 diagram: the `update-architecture` skill. A decision record: `write-adr`.
- A working document (a spec, a plan, a report): it goes in `docs/superpowers`, which is not
  published; use `write-spec` or `plan-tasks`.

Everything is Markdown in `docs/`. It is published at `/docs/` on the Pages site by VitePress, and it
must also read correctly on GitHub. `docs/README.md` has the conventions; `docs/adr/0013-*.md` has the reasons.

## Rules

- **One kind per page** ([Diátaxis](https://diataxis.fr)): a tutorial teaches by doing, a how-to
  takes a reader through one task, a reference states facts to look up, an explanation says why.
  Pick the kind before writing, and put the page in the table in `docs/README.md`. A page that
  becomes two kinds is split.
- **True before pretty.** State what exists. If something is planned or unfinished, say so, as the
  guides do for the mock API and the publish gap. Do not document a feature you have not seen work.
- **Every snippet is verified.** Compile it, run it or test it in the repo before it goes in. The guides
  were written that way, and a snippet that does not run is worse than none.
- **Links are relative and end in `.md`** (`theming.md`, `../adr/0004-....md`). Do not start a link with
  `/`: that is the repository root on GitHub. A link that leaves `docs/` (`../../libs/x.ts`) is turned
  into a GitHub link on the site. A folder's `README.md` is served as its index page.
- **Alerts** use GitHub syntax: `> [!NOTE]`, `> [!WARNING]`. Do not use VitePress `:::` containers; GitHub shows them raw.
- **Diagrams** are ` ```mermaid ` blocks. For C4, use the `update-architecture` skill.
- One `# h1` per page, then `##` sections. Tables for reference material; short paragraphs for the rest.

## Add a guide page

1. Create `docs/guide/<name>.md` (or `docs/reference/<name>.md`), starting with `# Title`.
2. Add it to the sidebar in `docs/.vitepress/config.mts`. Only the decision records are listed
   automatically.
3. Link to it from the neighbouring pages that should point there.
4. If it is a starting point, add it to the README's documentation paragraph.

## Check it

```bash
npm run docs:build       # fails on a dead link
npm run docs:dev         # live reload, http://localhost:5173/angular-saas-kit/docs/
npm run pages && npm run pages:preview    # the site as Pages serves it, under /angular-saas-kit/
```

The last one is the truth for links and assets, because the site lives under a repository path.
Open the page you changed there.

## Done when

- `npm run docs:build` and `npm run check:docs` pass, and the changed page reads correctly on the
  Pages preview.
- A new page has its kind in the table in `docs/README.md`.
- Every snippet on the page was run, compiled or tested in the repo.
- A new page is in the sidebar and linked from its neighbours.
- It is in the same pull request as the change it describes. Then the `verify` skill and `open-pr`.
