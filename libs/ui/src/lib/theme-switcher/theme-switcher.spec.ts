import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ACCENTS,
  COLOR_MODES,
  RADII,
  ThemeService,
} from '@angular-saas-kit/tokens';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeSwitcher } from './theme-switcher';

@Component({
  imports: [ThemeSwitcher],
  template: `<ask-theme-switcher /><ask-theme-switcher />`,
})
class Pair {}

/**
 * The switcher is the kit's proof that the token layer works, and its
 * contract is what a keyboard or screen-reader user meets: three labelled
 * groups, one radio per value, the current choice announced. These tests hold
 * it to that, and to the one behaviour that matters - choosing an option
 * changes the theme.
 *
 * The options are native radio inputs, so the arrow keys and the single tab
 * stop per group come from the browser. jsdom does not implement them, so what
 * is asserted here is what produces them: real radios that share a name within
 * a group. The keys themselves are exercised in the browser tests.
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

  const legend = (fieldset: Element): string =>
    fieldset.querySelector('legend')?.textContent?.trim() ?? '';

  function group(root: HTMLElement, name: string): HTMLElement {
    const found = [...root.querySelectorAll<HTMLElement>('fieldset')].find(
      (fieldset) => legend(fieldset) === name,
    );
    if (!found) {
      throw new Error(`No group named "${name}"`);
    }
    return found;
  }

  const radios = (el: HTMLElement): HTMLInputElement[] => [
    ...el.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  /** What the option says: its label's text, or its aria-label for a swatch. */
  const name = (radio: HTMLInputElement): string =>
    radio.getAttribute('aria-label') ??
    radio.closest('label')?.textContent?.trim() ??
    '';

  const checked = (el: HTMLElement): string[] =>
    radios(el)
      .filter((radio) => radio.checked)
      .map(name);

  function option(el: HTMLElement, wanted: string): HTMLInputElement {
    const found = radios(el).find((radio) => name(radio) === wanted);
    if (!found) {
      throw new Error(`No option "${wanted}"`);
    }
    return found;
  }

  it('offers each axis as a labelled group', async () => {
    const { root } = await render();

    const names = [...root.querySelectorAll('fieldset')].map(legend);

    expect(names).toEqual(['Mode', 'Accent', 'Radius']);
  });

  it('has one option for every value of every axis', async () => {
    const { root } = await render();

    expect(radios(group(root, 'Mode')).map(name)).toEqual([...COLOR_MODES]);
    // Swatches carry no text, so their accessible name is all a screen
    // reader has.
    expect(radios(group(root, 'Accent')).map(name)).toEqual([...ACCENTS]);
    expect(radios(group(root, 'Radius')).map(name)).toEqual([...RADII]);
  });

  it('gives every option an accessible name', async () => {
    const { root } = await render();

    expect(radios(root).every((radio) => name(radio) !== '')).toBe(true);
  });

  it('makes each group a set of radios that share one name', async () => {
    // That shared name is what gives the browser its radio-group behaviour:
    // a single tab stop, and the arrow keys moving the selection.
    const { root } = await render();

    const names = ['Mode', 'Accent', 'Radius'].map((label) => [
      ...new Set(radios(group(root, label)).map((radio) => radio.name)),
    ]);

    expect(names.every((distinct) => distinct.length === 1)).toBe(true);
    expect(names.every(([only]) => only !== '')).toBe(true);
    expect(new Set(names.flat()).size).toBe(3);
  });

  it('keeps the groups of two switchers on one page apart', async () => {
    // Radios with the same name are one group across the whole document, so
    // two switchers must not share names or arrowing in one would move the other.
    await TestBed.configureTestingModule({
      imports: [Pair],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Pair);
    await fixture.whenStable();

    const names = radios(fixture.nativeElement as HTMLElement).map(
      (radio) => radio.name,
    );

    expect(new Set(names).size).toBe(6);
  });

  it('announces the current choice, and only that one, in each group', async () => {
    const { root } = await render();

    expect(checked(group(root, 'Mode'))).toEqual(['system']);
    expect(checked(group(root, 'Accent'))).toEqual(['blue']);
    expect(checked(group(root, 'Radius'))).toEqual(['md']);
  });

  it('starts from the stored theme, not the default', async () => {
    localStorage.setItem(
      'ask.theme.v1',
      JSON.stringify({ mode: 'dark', accent: 'violet', radius: 'lg' }),
    );

    const { root } = await render();

    expect(checked(group(root, 'Mode'))).toEqual(['dark']);
    expect(checked(group(root, 'Accent'))).toEqual(['violet']);
    expect(checked(group(root, 'Radius'))).toEqual(['lg']);
  });

  it('changes the theme when a colour mode is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Mode'), 'dark').click();
    await fixture.whenStable();

    expect(theme.mode()).toBe('dark');
    expect(checked(group(root, 'Mode'))).toEqual(['dark']);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('changes the theme when an accent is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Accent'), 'emerald').click();
    await fixture.whenStable();

    expect(theme.accent()).toBe('emerald');
    expect(checked(group(root, 'Accent'))).toEqual(['emerald']);
    expect(document.documentElement.dataset['accent']).toBe('emerald');
  });

  it('changes the theme when a corner radius is chosen', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Radius'), 'lg').click();
    await fixture.whenStable();

    expect(theme.radius()).toBe('lg');
    expect(checked(group(root, 'Radius'))).toEqual(['lg']);
    expect(document.documentElement.dataset['radius']).toBe('lg');
  });

  it('keeps the three axes independent', async () => {
    const { fixture, root } = await render();

    option(group(root, 'Accent'), 'orange').click();
    option(group(root, 'Radius'), 'none').click();
    await fixture.whenStable();

    expect(checked(group(root, 'Mode'))).toEqual(['system']);
    expect(checked(group(root, 'Accent'))).toEqual(['orange']);
    expect(checked(group(root, 'Radius'))).toEqual(['none']);
  });
});
