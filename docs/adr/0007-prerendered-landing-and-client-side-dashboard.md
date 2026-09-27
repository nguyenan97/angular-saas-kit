# 0007. A prerendered landing page and a client-side dashboard

- **Status:** Accepted
- **Date:** 2026-09-26 (recorded after the fact)
- **Deciders:** @nguyenan97

## Context

The two apps have different needs. A landing page is public, has to be found by
search engines and has to paint quickly. An admin dashboard sits behind a login in
any real product, has no SEO concern and benefits from staying a plain static
bundle.

## Decision

- **`landing`** is server-rendering capable. The application builder is configured
  with a server entry (`src/main.server.ts`) and an Express server (`src/server.ts`),
  every route is `RenderMode.Prerender`, and the client hydrates with event replay.
  The default build produces a server output; a static output exists too, which is
  what GitHub Pages uses ([0011](0011-github-pages-demo-site.md)).
- **`dashboard`** is a client-side single-page application: a browser build, no
  server, no hydration.

## Alternatives considered

- **Server-render both** - adds a server and hydration to an app that gains nothing
  from them.
- **Client-render both** - a blank first paint and poor SEO for the page whose job
  is to be found.

## Consequences

- `ThemeService` and anything else the landing page uses must be safe on the
  server, so every DOM and storage access is behind a platform check. The server
  renders the default theme and the inline anti-flash script plus hydration correct
  it in the browser ([0004](0004-semantic-design-tokens-and-three-axis-theming.md)).
- Two deployment shapes. Both are static-hostable; only the landing page can also
  run behind Node.
- Express is a runtime dependency for the landing server. Express 5 rejects a bare
  `/**` catch-all route, so the server handles "everything else" with `app.use`
  and no path.
- **The Node server refuses every request until it is told its hostname.** Angular's
  server-side request forgery guard checks the `Host` header against `allowedHosts`,
  which is empty in the build output, so `node dist/apps/landing/server/server.mjs`
  answers `400` to everything, `localhost` included. Set the `NG_ALLOWED_HOSTS`
  environment variable when running it (comma-separated hostnames), or
  `security.allowedHosts` in the build options. The repository sets neither, because
  the right value is the adopter's domain. With `NG_ALLOWED_HOSTS=localhost` the same
  server returns `200` for `/` and `404` for an unknown path. The GitHub Pages demo is
  static and does not run this server.

## References

- [`apps/landing/src/server.ts`](../../apps/landing/src/server.ts), [`app.routes.server.ts`](../../apps/landing/src/app/app.routes.server.ts)
- [C4 components](../architecture/c4-components.md)
