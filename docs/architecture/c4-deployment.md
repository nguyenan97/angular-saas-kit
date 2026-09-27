# Deployment

Where the kit runs. The demo on GitHub Pages is the only production deployment; the
rest is how a change gets there and how to run the kit yourself.

## The demo on GitHub Pages

Built and deployed by [`pages.yml`](../../.github/workflows/pages.yml), only from `main`
([ADR 0011](../adr/0011-github-pages-demo-site.md)).

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Deployment
  title Deployment: the demo on GitHub Pages

  Deployment_Node(device, "Visitor's device", "Any current browser") {
    Container(browser, "Web browser", "HTML, CSS, JavaScript", "Runs the landing page and the dashboard")
  }

  Deployment_Node(gh, "GitHub", "github.com") {
    Deployment_Node(pages, "GitHub Pages", "Static hosting over HTTPS") {
      Deployment_Node(site, "nguyenan97.github.io/angular-saas-kit", "Project site") {
        Container(landing, "landing", "Static HTML, JS and CSS", "Served at the site root, with 404.html")
        Container(dashboard, "dashboard", "Static single-page app", "Served under /demo/ with hash routing")
      }
    }
    Deployment_Node(runner, "GitHub-hosted runner", "ubuntu-latest, Node 22") {
      Container(build, "Pages workflow", "npm run pages", "Builds both apps with the pages configuration and assembles the site folder")
    }
  }

  Rel(browser, landing, "Loads", "HTTPS")
  Rel(browser, dashboard, "Loads", "HTTPS")
  Rel(build, landing, "Publishes", "deploy-pages")
  Rel(build, dashboard, "Publishes", "deploy-pages")
```

## The landing page behind Node (optional)

The landing page can also run as a Node server. Nothing in this repository deploys it;
this is the shape if you do. Build it with `npx nx build landing`, then run
`node dist/apps/landing/server/server.mjs`.

```mermaid
%%{init: {"c4": {"c4ShapeMargin": 100}}}%%
C4Deployment
  title Deployment: the landing page behind Node (optional)

  Deployment_Node(device, "Visitor's device", "Any current browser") {
    Container(browser, "Web browser", "HTML, CSS, JavaScript", "Loads the prerendered page and hydrates it")
  }

  Deployment_Node(host, "Your Node host", "Node 22 or newer") {
    Deployment_Node(proc, "Node process", "node dist/apps/landing/server/server.mjs, port from PORT, default 4000") {
      Container(server, "landing server", "Express 5 and Angular", "Serves dist/apps/landing/browser, then renders what is left. Answers 400 until NG_ALLOWED_HOSTS lists the hostname")
    }
  }

  Rel(browser, server, "Requests pages from", "HTTP")
```

The server refuses every request until `NG_ALLOWED_HOSTS` (or `security.allowedHosts` in
the build options) names the host it is served on
([ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md)).

## How a change reaches the demo

```mermaid
flowchart LR
  pr["Pull request to main"] --> ci["CI: lint, test, build, typecheck, format"]
  pr --> codeql["CodeQL scan"]
  pr --> site["Pages: build and check the site"]
  ci --> merge["Squash merge into main"]
  merge --> cimain["CI runs again on main"]
  merge --> deploy["Pages: build, then deploy"]
  deploy --> live["Live demo updated"]
  dependabot["Dependabot: weekly npm, monthly Actions"] -.-> pr
  weekly["CodeQL: weekly scan of main"] -.-> codeql
```

The five CI checks are required and the branch must be up to date before a merge
([ADR 0009](../adr/0009-strict-ci-gates-and-a-protected-main.md)). CodeQL and the Pages
build run on every pull request but are not required.

## Running it locally

| Goal                                | Command                                       | Where                                                                       |
| ----------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Dashboard dev server                | `npm start`                                   | `http://localhost:4200`                                                     |
| Landing dev server                  | `npm run start:landing`                       | Angular's dev server; the terminal prints the address                       |
| The Pages build, as Pages serves it | `npm run pages`, then `npm run pages:preview` | `http://localhost:8123/angular-saas-kit/`                                   |
| Browser tests                       | `npx nx e2e dashboard-e2e`                    | Starts `nx run dashboard:serve` on port 4200, or reuses one already running |

Back to the [overview](README.md).
