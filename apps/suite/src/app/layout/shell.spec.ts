import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, type Routes, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { providePageTitle } from '../page-title';
import { Shell } from './shell';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Blank {}

const ROUTES: Routes = [
  { path: '', title: 'Overview', component: Blank },
  { path: 'booking/orders', title: 'Orders', component: Blank },
  { path: 'booking/orders/new', title: 'New order', component: Blank },
];

/** jsdom has no matchMedia; each test says which layout it is about. */
function viewport(desktop: boolean) {
  return {
    provide: BreakpointObserver,
    useValue: { observe: () => of({ matches: desktop, breakpoints: {} }) },
  };
}

async function render({ desktop = true, url = '/' } = {}) {
  await TestBed.configureTestingModule({
    imports: [Shell],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter(ROUTES),
      providePageTitle(),
      viewport(desktop),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(Shell);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, el };
}

const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim();

describe('Shell', () => {
  it('groups the navigation by module, each group named by its heading', async () => {
    const { el } = await render();

    const groups = [...el.querySelectorAll('nav [role="group"]')];
    expect(groups.map((g) => text(g.querySelector('h2')))).toEqual([
      'Suite',
      'Booking',
      'SCM Soon',
      'Logistics Soon',
      'ERP Soon',
    ]);
    for (const group of groups) {
      const heading = group.querySelector('h2');
      expect(group.getAttribute('aria-labelledby')).toBe(heading?.id);
    }
  });

  it('links the pages that exist, and the Booking module is the one open', async () => {
    const { el } = await render();

    expect([...el.querySelectorAll('nav a')].map(text)).toEqual([
      'Overview',
      'Orders',
      'New order',
    ]);
  });

  it('lists the modules still to come as text with a Soon badge, not as links', async () => {
    const { el } = await render();

    const soon = [...el.querySelectorAll('nav [role="group"]')].slice(2);
    for (const group of soon) {
      expect(group.querySelector('a, button')).toBeNull();
      expect(text(group)).toContain('Soon');
    }
  });

  it('marks the current page, and only it, with aria-current', async () => {
    const { el } = await render({ url: '/booking/orders' });

    const current = [...el.querySelectorAll('nav a[aria-current="page"]')];
    expect(current.map(text)).toEqual(['Orders']);
  });

  it("shows the page's title as the one h1", async () => {
    const { el } = await render({ url: '/booking/orders/new' });

    expect([...el.querySelectorAll('h1')].map(text)).toEqual(['New order']);
  });

  it('switches between light and dark from the header', async () => {
    const { fixture, el } = await render();
    const toggle = [...el.querySelectorAll('header button')].find((b) =>
      text(b)?.endsWith('mode'),
    ) as HTMLButtonElement;
    const before = document.documentElement.classList.contains('dark');

    toggle.click();
    await fixture.whenStable();

    expect(document.documentElement.classList.contains('dark')).toBe(!before);
    toggle.click();
  });

  it('on a phone, hides the navigation behind a Menu button that says whether it is open', async () => {
    const { fixture, el } = await render({ desktop: false });
    const menu = el.querySelector<HTMLButtonElement>(
      'button[aria-controls="suite-nav"]',
    );
    const nav = () => el.querySelector('#suite-nav') as HTMLElement;

    expect(menu?.getAttribute('aria-expanded')).toBe('false');
    expect(nav().hidden).toBe(true);

    menu?.click();
    await fixture.whenStable();

    expect(menu?.getAttribute('aria-expanded')).toBe('true');
    expect(nav().hidden).toBe(false);
  });

  it('on a desktop, always shows the navigation and has no Menu button', async () => {
    const { el } = await render({ desktop: true });

    expect(el.querySelector('button[aria-controls="suite-nav"]')).toBeNull();
    expect((el.querySelector('#suite-nav') as HTMLElement).hidden).toBe(false);
  });

  it('has a skip link to the main content', async () => {
    const { el } = await render();

    const skip = el.querySelector('a[href="#main-content"]');
    expect(text(skip)).toBe('Skip to content');
    expect(el.querySelector('main#main-content')).not.toBeNull();
  });
});
