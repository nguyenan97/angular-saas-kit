# 0006. An in-memory mock API instead of a backend

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact)
- **Deciders:** @nguyenan97

## Context

The kit is a UI template with no backend and no authentication (see
[`SECURITY.md`](../../SECURITY.md)). Development and demos still need
realistic-looking asynchronous data: with instant responses, loading states never
render, skeletons and spinners go untested, and the UI looks smoother than it will
against a real API.

## Decision

`libs/mock-api` provides an `HttpInterceptorFn`, `mockApiInterceptor`, that serves
routes from memory. Apps register route tables with `registerMockRoutes`; a route
has a method, a path with `:param` segments, and a handler that returns the body.
Every response is delayed by a random 200-600 ms (`randomLatency`). A request that
matches no route falls through to the real backend with `next(req)`, so adding the
interceptor to an app that already talks to an API is safe.

## Alternatives considered

- **Mock Service Worker** - the most faithful simulation, but it needs a worker
  file, registration and its own setup, which is heavy for a template.
- **json-server or a real development backend** - a process to run, and it cannot
  be hosted on a static site such as the GitHub Pages demo
  ([0011](0011-github-pages-demo-site.md)).
- **Angular's in-memory web API** - no longer maintained.

## Consequences

- Zero infrastructure; it works in a static deployment and in unit tests.
- It is not a faithful HTTP simulation: no headers, no streaming, and a response
  is either a 200 or a thrown error.
- The mock must never ship to production. `SECURITY.md` puts a way of enabling it
  accidentally in a production build in scope. The route tables live in the apps,
  not in the library, so the library carries no data.
- **State today:** the library and its interceptor are unit-tested, but neither app
  imports it. The dashboard shows static placeholder data and never calls
  `HttpClient`. The first page that fetches data is what wires it in.
  _Amended 2026-09-27:_ the dashboard is wired in. Its routes and a seeded dataset live
  in `apps/dashboard/src/app/mock`, as this record said they would; the interceptor is
  provided from `mock-backend.ts`, which the `production` configuration replaces with an
  empty file, and the demo (`pages`) keeps it because it has no backend. Wiring it in
  found a bug: the interceptor read `req.url`, which leaves out `HttpClient` `params`,
  so handlers never saw a query passed that way; it reads `urlWithParams` now.

## References

- [`libs/mock-api/src/lib/mock-api.interceptor.ts`](../../libs/mock-api/src/lib/mock-api.interceptor.ts), [`latency.ts`](../../libs/mock-api/src/lib/latency.ts)
