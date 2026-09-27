import { VERSION, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';
import { QUESTIONS } from './sections/faq';
import { PLANS } from './sections/pricing';

describe('Landing', () => {
  /** The whole app, on the home page. */
  async function render() {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(appRoutes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    return fixture;
  }

  /** The text of each link on the page, spaces collapsed. */
  function linkTexts(el: HTMLElement): string[] {
    return [...el.querySelectorAll('a')].map((a) =>
      (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  it('renders exactly one h1', async () => {
    // More than one h1 is the most common landing-page a11y regression.
    const fixture = await render();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
  });

  it('renders a primary call to action', async () => {
    const fixture = await render();
    expect(linkTexts(fixture.nativeElement)).toContain('Get started');
  });

  it('shows no demo or docs link when the landing runs on its own', async () => {
    // The links only exist in the GitHub Pages build; elsewhere they would be dead.
    const fixture = await render();
    const links = linkTexts(fixture.nativeElement);
    expect(links).not.toContain('Live demo');
    expect(links).not.toContain('Docs');
  });

  it('offers a skip link first, to a main that can take the focus', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;

    const first = el.querySelector('a, button');
    expect(first?.textContent?.trim()).toBe('Skip to content');
    expect(first?.getAttribute('href')).toBe('#main-content');
    expect(el.querySelector('main')?.id).toBe('main-content');
    expect(el.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });

  it('links each section from the header, and each link finds its section', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;

    const hrefs = [...el.querySelectorAll('header nav a[href^="#"]')].map(
      (a) => a.getAttribute('href') ?? '',
    );
    expect(hrefs).toEqual(['#features', '#pricing', '#faq']);
    for (const href of hrefs) {
      expect(el.querySelector(`main section${href}`)).not.toBeNull();
    }
  });

  it('names each section by its own h2, under the one h1', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;

    const sections = el.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBe(3);
    for (const section of sections) {
      const heading = el.querySelector(
        `#${section.getAttribute('aria-labelledby')}`,
      );
      expect(heading?.tagName).toBe('H2');
      expect(heading?.textContent?.trim()).not.toBe('');
    }
  });

  it('prices each plan on a card, with its name as a heading and its action as a link', async () => {
    const fixture = await render();
    const pricing: HTMLElement =
      fixture.nativeElement.querySelector('#pricing');

    const cards = pricing.querySelectorAll('ask-card');
    expect(cards.length).toBe(PLANS.length);
    PLANS.forEach((plan, i) => {
      expect(cards[i]?.querySelector('h3')?.textContent?.trim()).toBe(
        plan.name,
      );
      const action = cards[i]?.querySelector<HTMLAnchorElement>('a');
      expect(action?.textContent?.trim()).toBe(plan.action.label);
      expect(action?.getAttribute('href')).toBe(plan.action.href);
    });
  });

  it('answers each question in a native disclosure, closed until opened', async () => {
    // details and summary bring the keyboard and the open or closed state
    // with them, and work before hydration.
    const fixture = await render();
    const details = fixture.nativeElement.querySelectorAll(
      '#faq details',
    ) as NodeListOf<HTMLDetailsElement>;

    expect(details.length).toBe(QUESTIONS.length);
    details.forEach((item, i) => {
      expect(item.open).toBe(false);
      expect(item.querySelector('summary')?.textContent?.trim()).toBe(
        QUESTIONS[i]?.question,
      );
    });
  });

  it('says which Angular it is built with, in the footer', async () => {
    // It once printed the year where the version belongs.
    const fixture = await render();
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer?.textContent).toContain(
      `Built with Angular ${VERSION.major}.`,
    );
  });
});
