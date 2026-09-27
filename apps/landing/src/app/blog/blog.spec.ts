import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { App } from '../app';
import { appRoutes } from '../app.routes';
import { POSTS } from './posts';

/** The whole app, on the page at `url`. */
async function render(url: string) {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [provideZonelessChangeDetection(), provideRouter(appRoutes)],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, el };
}

const [newest] = POSTS;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** '2026-09-28' as 'September 28, 2026', read straight off the string. */
function longDate(iso = ''): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${day}, ${year}`;
}

describe('Blog', () => {
  it('keeps its posts newest first, each at an address of its own', () => {
    const dates = POSTS.map((post) => post.date);
    expect(dates).toEqual([...dates].sort().reverse());
    const slugs = POSTS.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists every post in order, each linking to its page', async () => {
    const { el } = await render('/blog');

    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Blog');
    const links = [...el.querySelectorAll('main li h2 a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual(
      POSTS.map((post) => post.title),
    );
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      POSTS.map((post) => `/blog/${post.slug}`),
    );
  });

  // The page is prerendered in one time zone and read in all of them. A date
  // taken for midnight UTC shows as the day before west of Greenwich, or, read
  // as local and written in UTC, the day before east of it.
  it.each(['America/Los_Angeles', 'Asia/Ho_Chi_Minh'])(
    'dates a post on the day it names, in %s too',
    async (zone) => {
      vi.stubEnv('TZ', zone);
      try {
        const { el } = await render('/blog');

        const time = el.querySelector('main li time');
        expect(time?.getAttribute('datetime')).toBe(newest?.date);
        expect(time?.textContent?.trim()).toBe(longDate(newest?.date));
      } finally {
        vi.unstubAllEnvs();
      }
    },
  );

  it('shows a post with its title as the one h1, and its article under it', async () => {
    const { el } = await render(`/blog/${newest?.slug}`);

    const headings = el.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent?.trim()).toBe(newest?.title);
    // The article's own headings start at h2, under the page's h1.
    expect(el.querySelector('article h2')).not.toBeNull();
    expect(
      el.querySelector('article h1 ~ time')?.getAttribute('datetime'),
    ).toBe(newest?.date);
  });

  it('names the document after the post', async () => {
    await render(`/blog/${newest?.slug}`);

    expect(TestBed.inject(Title).getTitle()).toBe(
      `${newest?.title} — Angular SaaS Kit`,
    );
  });

  it('points the skip link at the page it is on, not at the home page', async () => {
    // A bare #main-content resolves against the base href, which is home.
    const { el } = await render(`/blog/${newest?.slug}`);

    expect(el.querySelector('a')?.getAttribute('href')).toBe(
      `blog/${newest?.slug}#main-content`,
    );
  });

  it('marks the blog link in the header as the current page', async () => {
    const { el } = await render('/blog');

    const link = [...el.querySelectorAll('header nav a')].find(
      (a) => a.textContent?.trim() === 'Blog',
    );
    expect(link?.getAttribute('aria-current')).toBe('page');
  });
});
