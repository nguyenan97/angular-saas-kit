---
name: update-architecture
description: Keep the C4 architecture diagrams in docs/architecture true when a project, a dependency between projects, an external system or a deployment target changes. Use when adding or removing an app or library, adding an import or stylesheet reference across projects, or when npm run check:architecture fails.
---

# Update the architecture map

The diagrams are Mermaid C4 in `docs/architecture/`. Only the container map is checked by machine;
the rest is kept true by hand, in the same pull request as the change.

## Which page

| What changed                                                        | Edit               | Checked by CI? |
| ------------------------------------------------------------------- | ------------------ | -------------- |
| A project added or removed; a dependency between projects           | `c4-containers.md` | Yes            |
| What is inside an app or library (a component, a route, a provider) | `c4-components.md` | No             |
| A new person, or an outside system the kit talks to                 | `c4-context.md`    | No             |
| A new host, a new deployment target, a new pipeline stage           | `c4-deployment.md` | No             |

## The checked part

`npm run check:architecture` compares the `Container` and `Rel` lines in `c4-containers.md` with the
source: TypeScript imports through the `@angular-saas-kit/*` aliases, CSS `@import` and `@source`
across project folders, and `implicitDependencies` in a `project.json`. It reports the exact edge
that is missing or extra. Fix the diagram to match the code, not the reverse, unless the code is wrong.

- A container's label must be the Nx project name. The diagram id can differ (`mockapi` for `mock-api`).
- Arrows to people and outside systems are not checked; arrows between two containers are.
- The check verifies the map is true. It does not forbid a dependency. Do not add an edge that
  breaks the direction rules (apps import libs; `ui` imports `tokens`; nothing imports an app).

## Editing a diagram

- Keep the `%%{init: {"c4": {"c4ShapeMargin": 100}}}%%` line at the top of every C4 diagram.
- Keep arrow labels to a few words; put the detail in the table below the diagram. Mermaid draws a
  label at the middle of its arrow, so long labels land on the boxes.
- Declaration order decides the grid (`$c4ShapeInRow` per row). Declare connected pairs next to each
  other so their arrows are short and straight.
- Two arrows between the same pair overlap; separate their labels with `UpdateRelStyle(a, b, $offsetY="24")`.
- Mermaid rejects a `Rel` that points at a boundary or a `Deployment_Node`; point at a container inside it.
- Avoid `<`, `>` and `#` in text. Describe the element instead ("the html element").
- Describe what **exists**. If something is planned, the diagram says so, as the mock API entry does.

## Look at it

```bash
npm run docs:dev
```

Open `http://localhost:5173/angular-saas-kit/docs/architecture/` and the page you edited. Check that
it draws, that no label sits on top of another, and that "View full size" opens it. GitHub renders the
same source, so a diagram that is clear here is clear there.

## Finish

`npm run check:architecture`, `npm run docs:build`, then `verify` and `open-pr`. If the change was a
decision worth recording, use `write-adr`.
