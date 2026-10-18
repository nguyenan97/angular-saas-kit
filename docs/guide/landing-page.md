# The landing page

`apps/landing` is the marketing page. It is one Angular application that can be built two
ways: as static files, which is what the demo site serves, or with a small Node server in
front. The reasoning is in
[ADR 0007](../adr/0007-prerendered-landing-and-client-side-dashboard.md).

## How it renders

Every route is prerendered at build time (`RenderMode.Prerender`), and the browser hydrates
the page with event replay, so a click that lands before hydration finishes is replayed
instead of lost. The shell, `App`, is a header, the routed page and a footer. The routes are
the home page (`Home`: the hero, its call-to-action links and three
[sections](#the-sections)), which is in the initial bundle, and the [blog](#the-blog), which is
lazy.

The skip link and the header's links to the sections are plain links, so they work before the
page hydrates. A bare fragment such as `#features` resolves against the base href, which is the
home page, so from the blog the section links lead home, as they should. For the same reason
the skip link names the page it is on (`blog#main-content`), or it would lead home too.

`ThemeService` is constructed on the server too, so it guards every DOM and storage access.
The server renders the default theme, and the inline script in `index.html` plus hydration
correct it in the browser before first paint. See [Theming](theming.md).

## The sections

Each section is a component in `apps/landing/src/app/sections/`, with its copy at the top of its
file as a typed constant:

| Section  | File          | Copy                                                                |
| -------- | ------------- | ------------------------------------------------------------------- |
| Features | `features.ts` | `FEATURES`: an icon, a title and a sentence each                    |
| Pricing  | `pricing.ts`  | `PLANS`: a card each. The kit has one plan, and it is free          |
| FAQ      | `faq.ts`      | `QUESTIONS`: a native `details` element each, open before hydration |

To change what the page says, change the constants. To drop a section, remove its element
from `home.ts` and its entry from `sections` in `app.ts`, where the header's links come from.
To add one, give it a `section` with an id and an `aria-labelledby` that points at its `h2`, and
add the id to `sections`; a unit test checks that every header link finds its section.

The copy only says what is true of the code, and the tests check the structure rather than the
words, so when the code changes, change the copy with it. There is no testimonials section,
because the kit has no real testimonials yet.

The sections are built on the kit's own `Button`, `Card` and `Icon`, which is the point of one
design system for both apps. That has a cost: `cn()` brings tailwind-merge into the page's
JavaScript, about 28 kB before compression.

## The blog

`/blog` lists the posts, newest first, and each post has a page at `/blog/<slug>`. Every post is
prerendered, and its code loads with its own page and nowhere else. Why posts are components
rather than Markdown is in [ADR 0019](../adr/0019-blog-posts-as-prerendered-components.md).

To add a post:

1. Write its article as a component in `apps/landing/src/app/blog/posts/`, with the article
   in plain HTML inside `<ask-post-layout>`. The layout supplies the title, the date, a link
   back to the index and the styles for headings, paragraphs, lists, links and code.
2. Add an entry at the top of `POSTS` in `blog/posts.ts`: a slug, the title, the date as
   `yyyy-mm-dd`, a summary for the index, and a `load` that imports the component.

The route follows from the entry, and so does the prerendered page. A post's article starts
its headings at `h2`, because the layout's title is the page's `h1`. Angular template syntax
applies, so write `{`, `}` and `@` in text as `&#123;`, `&#125;` and `&#64;`. Give a `pre` a
`tabindex="0"`, so that a keyboard can scroll it.

A post shows the day its date names, in any time zone: the date is taken as a UTC date and
written in UTC. Everything a post says should be true of the code on that day, like the rest
of the page.

The landing page's initial bundle is about 4 kB under its 350 kB warning. Some things that
would be natural here stay out, because their shared module files would put code into the
initial bundle: `DatePipe`, `NgComponentOutlet`, `RouterLinkActive` and router input binding.
The ADR has the measurements.

## Run and build

```bash
npm run start:landing     # dev server
npx nx build landing      # production build, server output
```

The default build writes two folders under `dist/apps/landing`: `browser` (the prerendered
HTML and assets) and `server` (the Node server).

## Run the Node server

```bash
npx nx build landing
NODE_ENV=production NG_ALLOWED_HOSTS=example.com PORT=4000 node dist/apps/landing/server/server.mjs
```

The server serves the static files, then hands every other request to Angular. It listens on
`PORT`, or 4000 when that is unset. `NODE_ENV=production` is what Express and its dependencies
expect in production; the server does not depend on it to keep errors out of its answers.

> [!WARNING]
> **The server refuses every request until it is told its hostname.** Angular's
> server-side request forgery guard checks the `Host` header against `allowedHosts`, which is
> empty in the build output, so an unconfigured server answers `400` to everything, even
> `localhost`. Set `NG_ALLOWED_HOSTS` when you run it (comma-separated hostnames), or
> `security.allowedHosts` in the build options. The repository sets neither, because the right
> value is your domain. With `NG_ALLOWED_HOSTS=localhost` the server returns `200` for `/`
> and `404` for a path that does not exist.

Every response, files and pages alike, carries security headers (`src/security-headers.ts`):
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a
`Referrer-Policy`, a `Permissions-Policy` that turns off the camera, microphone and location, and
a `Content-Security-Policy` that forbids plugins, framing by another site, a foreign `<base>` and
forms posting elsewhere. `X-Powered-By` is not sent.

> [!NOTE]
> The policy does not restrict scripts yet. The page runs two inline scripts, the theme snippet
> and Angular's event-replay bootstrap, and Angular's `autoCsp` does not work with server
> rendering, so a `script-src` policy needs a nonce per request. That is planned, not built. If a
> proxy or CDN in front of the server sets its own headers, check that the two do not conflict.

A request that fails gets a status and one line of text, never the error (`src/server-responses.ts`):
a URL the router cannot decode, such as `/%E0%A4%A`, is a `400`, and anything unexpected is a
`500` whose stack goes to the server's log. Express's own handler would put the stack in the
page whenever `NODE_ENV` is not `production`.

Of the files in `dist/apps/landing/browser`, the bundles the build names after their content
(`chunk-C7wytggW.js`) are cached for a year as `immutable`. The rest, such as `index.html`,
`index.csr.html` and the favicon, is sent with `Cache-Control: no-cache`, so a browser checks it
again on each visit and never holds an `index.html` that points at bundles a later deploy
removed. A page at its own path, `/` or `/blog/`, is answered by Angular, which sends an `ETag`
and no `Cache-Control`. Set one at a proxy or CDN in front of it if your host needs one.

## Static hosting

The `pages` build configuration produces plain static files with a base path, and is what the
demo site deploys. See [Deploying](deploying.md).

```bash
npx nx build landing -c pages
```

## Links that differ between builds

Some links only make sense in one build. The "Live demo" and "Docs" buttons would be dead
links when the landing page runs on its own, so they are `null` by default and set only in the
Pages build. That is done with a file replacement in the `pages` configuration in
`apps/landing/project.json`:

| File                                       | Used by                     |
| ------------------------------------------ | --------------------------- |
| `apps/landing/src/app/site-links.ts`       | every build except Pages    |
| `apps/landing/src/app/site-links.pages.ts` | the Pages build, swapped in |
| `apps/landing/src/app/site-links.types.ts` | the shared `SiteLinks` type |

The type lives in its own file so neither variant imports the other. To add a link, add a
field to `SiteLinks`, give it `null` in `site-links.ts` and its value in
`site-links.pages.ts`, and render it inside an `@if` in `app.html`.

## The 404 page

GitHub Pages serves `apps/landing/public/404.html` for any path it does not know. It is a
self-contained page with absolute links under `/angular-saas-kit/`, so change those if you
deploy under another path.
