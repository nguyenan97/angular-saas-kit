import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, type Routes, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';
import { providePageTitle } from './page-title';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Blank {}

// jsdom has no matchMedia, so the real observer would always report a phone.
// Each test says which layout it is about instead.
function viewport(desktop: boolean) {
  return {
    provide: BreakpointObserver,
    useValue: { observe: () => of({ matches: desktop, breakpoints: {} }) },
  };
}

async function render({
  desktop = true,
  routes = appRoutes,
  url = '/',
}: { desktop?: boolean; routes?: Routes; url?: string } = {}) {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter(routes),
      providePageTitle(),
      viewport(desktop),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();

  const el: HTMLElement = fixture.nativeElement;
  const query = <T extends Element>(selector: string): T => {
    const found = el.querySelector<T>(selector);
    if (!found) {
      throw new Error(`Nothing matches ${selector}`);
    }
    return found;
  };

  return {
    fixture,
    el,
    menuButton: query<HTMLButtonElement>('button[aria-controls]'),
    sidebar: query<HTMLElement>('#app-sidebar'),
    // The column that holds the topbar and <main>. Not a sibling selector:
    // the CDK focus trap puts its anchor elements next to the sidebar.
    content: query<HTMLElement>('#main-content').parentElement as HTMLElement,
    query,
  };
}

describe('App shell', () => {
  it('links the pages that exist, and only those', async () => {
    const { el } = await render();

    const links = [...el.querySelectorAll('nav a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Overview']);
    // The planned pages are listed, marked "soon", and are not links.
    expect(el.querySelector('nav')?.textContent).toContain('Analytics');
    expect(el.querySelector('nav')?.textContent).toContain('soon');
  });

  it('marks the current page for assistive tech', async () => {
    const { query } = await render();

    expect(query('nav a').getAttribute('aria-current')).toBe('page');
  });

  it('follows the route in the heading and the document title', async () => {
    const routes: Routes = [
      { path: '', title: 'Overview', component: Blank },
      { path: 'orders', title: 'Orders', component: Blank },
    ];
    const { fixture, query } = await render({ routes, url: '/orders' });

    expect(query('h1').textContent?.trim()).toBe('Orders');
    expect(TestBed.inject(Title).getTitle()).toBe('Orders — Angular SaaS Kit');

    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    expect(query('h1').textContent?.trim()).toBe('Overview');
  });

  it('skips to the content without changing the route', async () => {
    const { query } = await render();
    const skip = query<HTMLAnchorElement>('a[href="#main-content"]');

    skip.click();

    expect(document.activeElement).toBe(query('#main-content'));
    expect(TestBed.inject(Router).url).toBe('/');
  });

  describe('on a desktop', () => {
    it('points the menu button at the sidebar', async () => {
      const { menuButton, sidebar } = await render();

      // aria-controls must name an element that exists.
      expect(menuButton.getAttribute('aria-controls')).toBe(sidebar.id);
      expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('collapses the rail and keeps its labels for screen readers', async () => {
      const { fixture, menuButton, sidebar } = await render();

      menuButton.click();
      await fixture.whenStable();

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
      expect(sidebar.classList).toContain('w-sidebar-collapsed');
      const label = [...sidebar.querySelectorAll('nav a span')].find(
        (span) => span.textContent?.trim() === 'Overview',
      );
      expect(label?.classList).toContain('sr-only');
    });

    it('offsets the content by the rail width and never makes it inert', async () => {
      const { fixture, menuButton, content } = await render();

      expect(content.classList).toContain('ml-sidebar');
      menuButton.click();
      await fixture.whenStable();

      expect(content.classList).toContain('ml-sidebar-collapsed');
      expect(content.hasAttribute('inert')).toBe(false);
    });
  });

  describe('on a phone', () => {
    async function openDrawer() {
      const rendered = await render({ desktop: false });
      rendered.menuButton.click();
      await rendered.fixture.whenStable();
      return rendered;
    }

    it('starts with the drawer closed and out of the way', async () => {
      const { menuButton, sidebar, content } = await render({ desktop: false });

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
      expect(sidebar.classList).toContain('hidden');
      expect(content.classList).not.toContain('ml-sidebar');
    });

    it('opens the drawer as a modal', async () => {
      const { el, menuButton, sidebar, content } = await openDrawer();

      expect(menuButton.getAttribute('aria-expanded')).toBe('true');
      expect(sidebar.classList).not.toContain('hidden');
      expect(content.hasAttribute('inert')).toBe(true);
      expect(
        el.querySelector('[aria-hidden="true"].fixed.inset-0'),
      ).not.toBeNull();
    });

    it('closes on Escape and gives focus back to the menu button', async () => {
      const { fixture, menuButton, sidebar, content } = await openDrawer();
      sidebar.querySelector<HTMLAnchorElement>('nav a')?.focus();

      sidebar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await fixture.whenStable();

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
      expect(content.hasAttribute('inert')).toBe(false);
      expect(document.activeElement).toBe(menuButton);
    });

    it('closes from its own Close button', async () => {
      const { fixture, menuButton, sidebar } = await openDrawer();
      const close = [...sidebar.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Close'),
      );

      close?.click();
      await fixture.whenStable();

      expect(close?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Close menu',
      );
      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when the backdrop is tapped', async () => {
      const { el, fixture, menuButton } = await openDrawer();

      el.querySelector<HTMLElement>(
        '[aria-hidden="true"].fixed.inset-0',
      )?.click();
      await fixture.whenStable();

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('closes when a link is followed', async () => {
      const { fixture, menuButton, sidebar } = await openDrawer();

      sidebar.querySelector<HTMLAnchorElement>('nav a')?.click();
      await fixture.whenStable();

      expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
