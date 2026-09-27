---
name: write-docs
description: Add or change a page on the documentation site (docs/guide, docs/reference, docs/architecture, docs/adr) so it reads on GitHub and on the VitePress site, with links that work and snippets that are true. Use when documenting a feature, changing behaviour a guide describes, or adding a guide page.
---

# Write documentation

Everything is Markdown in `docs/`. It is published at `/docs/` on the Pages site by VitePress, and it
must also read correctly on GitHub. `docs/README.md` has the conventions; `docs/adr/0013-*.md` has the reasons.

## Rules

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

## Finish

`npm run format:check` (Prettier formats Markdown; the commit hook does it for staged files), then
`verify` and `open-pr`. Documentation goes in the same pull request as the change it describes.
