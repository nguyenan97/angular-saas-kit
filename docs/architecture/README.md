# Architecture

How the kit is put together, drawn with the [C4 model](https://c4model.com): a set
of maps at increasing zoom, each answering one question for one audience. The
_why_ behind the shapes is in the [decision records](../adr/README.md); these pages
show the shapes.

| Level         | Page                            | Answers                                                                       |
| ------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| 1 Context     | [System context](c4-context.md) | Who and what does the kit touch?                                              |
| 2 Containers  | [Containers](c4-containers.md)  | Which deployable apps and libraries exist, and who uses whom?                 |
| 3 Components  | [Components](c4-components.md)  | What is inside each app and library?                                          |
| Supplementary | [Deployment](c4-deployment.md)  | Where does it run: a laptop, CI, GitHub Pages?                                |
| 4 Code        | _not drawn_                     | Use `npx nx graph` and the source; hand-drawn code diagrams rot within a week |

## Reading the diagrams

- They are [Mermaid](https://mermaid.js.org/syntax/c4.html) C4 diagrams, so GitHub
  and the docs site render them, and they diff like code.
- In this workspace a **container** is a deployable app (`landing`, `dashboard`) or
  an independently consumable library (`tokens`, `ui`, `mock-api`). Strictly, C4
  calls a library a component; showing them as containers is what makes the
  dependency direction between them visible.
- A diagram shows what **exists today**. Where something is intended but unbuilt
  (the mock API is not wired into an app; `@angular/cdk` is not installed), the
  diagram says so instead of drawing the finished picture.
- Each diagram opens with a `%%{init: ...}%%` line that widens the gap between
  boxes. Mermaid draws an arrow's label at its midpoint, and with the default gap the
  label of a short arrow lands on the boxes at both ends. Keep the line when you edit
  a diagram, and keep arrow labels to a few words: the tables carry the detail.

## Keeping them true

Update the page in the same pull request that changes the shape: a new project, a
removed one, a new dependency between projects, a new deployment target.

The arrows between containers are checked. Run

```bash
npm run check:architecture
```

to compare the `Rel(...)` lines in [`c4-containers.md`](c4-containers.md) with the
dependencies found in the source: TypeScript imports through the
`@angular-saas-kit/*` aliases, CSS `@import` and `@source` across project folders,
and `implicitDependencies` in a `project.json`. It fails on an arrow the code does not
back, on a dependency the map does not show, and on a project missing from the map.
CI runs it on the lint job, so a new dependency between workspace projects cannot land
without the map saying so. It checks that the map is true; it does not forbid a
dependency ([why](c4-containers.md#what-the-map-guarantees-and-what-it-does-not)).

The components, context and deployment pages are not checked: they are maintained by
hand, in the same pull request as the change.

## Related

- [Architecture decision records](../adr/README.md)
- `npx nx graph` - the live project graph
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) - the rules the shapes above exist to protect
