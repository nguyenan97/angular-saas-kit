# 0019. Blog posts as prerendered Angular components

- **Status:** Proposed
- **Date:** 2026-09-28
- **Deciders:** @nguyenan97

## Context

The roadmap puts a blog on the landing page. The landing page is prerendered and hydrates
with event replay ([0007](0007-prerendered-landing-and-client-side-dashboard.md)). The kit has
no backend ([0006](0006-in-memory-mock-api-instead-of-a-backend.md)), and it adds no library
for something the framework and the platform already do. A post has to be a static page,
readable before hydration, and cheap for a visitor who never opens the blog.

The initial bundle is the constraint that bites. The build splits code between entry points
module file by module file. When the initial bundle uses anything from one of Angular's
bundled files, code from that file that only a lazy page uses goes into the initial bundle
too. The dashboard shell met this with its focus trap, which it now imports only when the
drawer first opens ([`shell.ts`](../../apps/dashboard/src/app/layout/shell.ts)). Before the
blog, the landing page's initial bundle was 330.64 kB, and its budget warns at 350 kB.

## Decision

Each post is a standalone component whose template is the article in plain HTML, wrapped in
`ask-post-layout`. The layout reads the post from its route's data and gives it a title, a
date and prose styles. `POSTS` lists each post's slug, title, date, summary and a loader for
its component, newest first. Every post gets a static route, `blog/<slug>`, whose component
is the post itself, so each one is prerendered and lazy.

The blog uses nothing whose code would land in the initial bundle through a shared module
file. The layout formats dates with the platform's `Intl.DateTimeFormat`, not `DatePipe`. The
routes load each post's component directly, with no `NgComponentOutlet`. The header marks the
current page from a signal, not with `RouterLinkActive`. The layout reads route data from
`ActivatedRoute` instead of router input binding.

## Alternatives considered

- **Markdown files and a parser.** Markdown is nicer to write. But the post's page needs its
  content in the browser to hydrate, so the parser would ship with it: a new dependency and a
  string of HTML through the sanitizer for every post.
- **One page with `NgComponentOutlet` and a resolver.** This was the first version. It took
  the initial bundle from 330.64 kB to 377.77 kB, over the warning, because `DatePipe` and
  `NgComponentOutlet` share a file with code the initial bundle already uses. With the choices
  above, it is 345.87 kB.
- **A `blog/:slug` route with `getPrerenderParams`.** It prerenders the same pages. But a slug
  with no post matches the route on the Node server, so the page would need a not-found state
  and a 404 status of its own. A static route per post makes a missing post a 404 for free.
- **A content framework or a headless CMS.** Analog's content routes belong to another
  meta-framework. A CMS needs a backend and credentials, which the kit does not have.

## Consequences

- Adding a post takes a component in `blog/posts/` and an entry at the top of `POSTS`. The
  route and the prerendered page follow from them.
- A post is Angular template syntax, not Markdown. `{`, `}` and `@` in text must be written as
  `&#123;`, `&#125;` and `&#64;`, which makes code samples with braces awkward.
- A post's code loads with its own page only. The index loads the list, not the articles.
- The initial bundle is 345.87 kB, about 4 kB under its warning. The next thing added to the
  landing page has to be weighed against that. `DatePipe`, `NgComponentOutlet`,
  `RouterLinkActive` and router input binding stay out of the landing page, and a comment
  where each would go says why.
- Dates are written in English (`en-US`), from a UTC date in UTC, so a post shows the day it
  names wherever it is rendered or read. A test checks two time zones either side of UTC.

## References

- [`apps/landing/src/app/blog/`](../../apps/landing/src/app/blog/posts.ts),
  [`app.routes.ts`](../../apps/landing/src/app/app.routes.ts)
- [The landing page guide](../guide/landing-page.md#the-blog)
