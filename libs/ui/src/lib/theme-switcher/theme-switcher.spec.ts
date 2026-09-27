import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ACCENTS,
  COLOR_MODES,
  RADII,
  ThemeService,
} from '@angular-saas-kit/tokens';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeSwitcher } from './theme-switcher';

/**
 * The switcher is the kit's proof that the token layer works, and its
 * contract is what a keyboard or screen-reader user meets: three named groups,
 * one button per value, the current choice announced. These tests hold it to
 * that, and to the one behaviour that matters - choosing an option changes
 * the theme.
 */
describe('ThemeSwitcher', () => {
  let theme: ThemeService;

  // The service persists to localStorage and sets attributes on <html>, and
  // both outlive a test, so each test starts from a clean slate.
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    delete root.dataset['accent'];
    delete root.dataset['radius'];
    root.style.colorScheme = '';
  });

  async function render() {
    await TestBed.configureTestingModule({
      imports: [ThemeSwitcher],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    theme = TestBed.inject(ThemeService);
    const fixture = TestBed.createComponent(ThemeSwitcher);
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  function group(root: HTMLElement, name: string): HTMLElement {
    const found = root.querySelector<HTMLElement>(
      `[role="radiogroup"][aria-label="${name}"]`,
    );
    if (!found) {
      throw new Error(`No radio group named "${name}"`);
    }
    return found;
  }

  const radios = (el: HTMLElement): HTMLElement[] => [
    ...el.querySelectorAll<HTMLElement>('[role="radio"]'),
  ];

  /** What the option says: its text, or its label for a swatch with no text. */
  const name = (el: HTMLElement): string =>
    el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';

  const checked = (el: HTMLElement): string[] =>
    radios(el)
      .filter((radio) => radio.getAttribute('aria-checked') === 'true')
      .map(name);

  function option(el: HTMLElement, wanted: string): HTMLElement {
    const found = radios(el).find((radio) => name(radio) === wanted);
    if (!found) {
      throw new Error(`No option "${wanted}"`);
    }
    return found;
  }

  it('offers each axis as a named radio group', async () => {
    const { root } = await render();

    const names = [...root.querySelectorAll('[role="radiogroup"]')].map((el) =>
      el.getAttribute('aria-label'),
    );

    expect(names).toEqual(['Colour mode', 'Accent colour', 'Corner radius']);
  });

  it('has one option for every value of every axis', async () => {
    const { root } = await render();

    expect(radios(group(root, 'Colour mode')).map(name)).toEqual([
      ...COLOR_MODES,
    ]);
    // Swatches carry no text, so their accessible name is all a screen
    // reader has.
    expect(radios(group(root, 'Accent colour')).map(name)).toEqual([
      ...ACCENTS,
    ]);
    expect(radios(group(root, 'Corner radius')).map(name)).toEqual([...RADII]);
  });

  it('makes every option a button that cannot submit a form', async () => {
    const { root } = await render();

    const all = radios(root);

    expect(all.length).toBe(COLOR_MODES.length + ACCENTS.length + RADII.length);
    expect(
      all.every(
        (radio) =>
          radio.tagName === 'BUTTON' && radio.getAttribute('type') === 'button',
      ),
    ).toBe(true);
  });

  it('announces the current choice, and only that one, in each group', async () => {
    const { root } = await render();

    expect(checked(group(root, 'Colour mode'))).toEqual(['system']);
    expect(checked(group(root, 'Accent colour'))).toEqual(['blue']);
    expect(checked(group(root, 'Corner radius'))).toEqual(['md']);
  });

  it('starts from the stored theme, not the default', async () => {
    localStorage.setItem(
      'ask.theme.v1',
      JSON.stringify({ mode: 'dark', accent: 'violet', radius: 'lg' }),
    );

    const { root } = await render();

    expect(checked(group(root, 'Colour mode'))).toEqual(['dark']);
    expect(checked(group(root, 'Accent colour'))).toEqual(['violet']);
    expect(checked(group(root, 'Corner radius'))).toEqual(['lg']);
  });

  it('changes the theme when a colour mode is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Colour mode'), 'dark').click();
    await fixture.whenStable();

    expect(theme.mode()).toBe('dark');
    expect(checked(group(root, 'Colour mode'))).toEqual(['dark']);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('changes the theme when an accent is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Accent colour'), 'emerald').click();
    await fixture.whenStable();

    expect(theme.accent()).toBe('emerald');
    expect(checked(group(root, 'Accent colour'))).toEqual(['emerald']);
    expect(document.documentElement.dataset['accent']).toBe('emerald');
  });

  it('changes the theme when a corner radius is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Corner radius'), 'lg').click();
    await fixture.whenStable();

    expect(theme.radius()).toBe('lg');
    expect(checked(group(root, 'Corner radius'))).toEqual(['lg']);
    expect(document.documentElement.dataset['radius']).toBe('lg');
  });

  it('keeps the three axes independent', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Accent colour'), 'orange').click();
    option(group(root, 'Corner radius'), 'none').click();
    await fixture.whenStable();

    expect(checked(group(root, 'Colour mode'))).toEqual(['system']);
    expect(checked(group(root, 'Accent colour'))).toEqual(['orange']);
    expect(checked(group(root, 'Corner radius'))).toEqual(['none']);
  });
});
