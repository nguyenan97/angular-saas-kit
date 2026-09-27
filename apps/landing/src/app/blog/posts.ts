import type { Type } from '@angular/core';

/** A post on the blog: what the index lists, and how to load its page. */
export interface Post {
  /** Its address: the post's page is `blog/<slug>`. */
  readonly slug: string;
  readonly title: string;
  /** The day it was published, as an ISO date (yyyy-mm-dd). */
  readonly date: string;
  /** A sentence or two for the index. */
  readonly summary: string;
  /**
   * The post's page: a component that wraps its article in `ask-post-layout`.
   * Loaded with the page, and nowhere else.
   */
  readonly load: () => Promise<Type<unknown>>;
}

/**
 * Every post, newest first. Each gets a route of its own (`app.routes.ts`),
 * so each is prerendered as a static page.
 */
export const POSTS: readonly Post[] = [
  {
    slug: 'introducing-angular-saas-kit',
    title: 'Introducing Angular SaaS Kit',
    date: '2026-09-28',
    summary:
      'A free admin dashboard and landing page for Angular 22, on one design system: what is in it, how it is built, and what is not there yet.',
    load: () =>
      import('./posts/introducing-angular-saas-kit').then(
        (m) => m.IntroducingAngularSaasKit,
      ),
  },
];

const LONG_DATE = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

/**
 * `2026-09-28` as `September 28, 2026`. The day is taken as a UTC date and
 * written in UTC, so it is the day named wherever the page is rendered or
 * read. It uses the platform's Intl rather than DatePipe, whose module would
 * come into the initial bundle with it.
 */
export function longDate(iso: string): string {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return LONG_DATE.format(Date.UTC(year, month - 1, day));
}
