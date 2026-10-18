import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeService } from './theme.service';
import { THEME_STORAGE_KEY } from './theme.types';

/** What `matchMedia('(prefers-color-scheme: dark)')` answers, and a way to change it. */
function preferDark(matches: boolean) {
  let listener: ((event: { matches: boolean }) => void) | undefined;
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches,
      addEventListener: (_type: string, handler: typeof listener) => {
        listener = handler;
      },
    })),
  );
  return (next: boolean) => listener?.({ matches: next });
}

function store(value: string): void {
  localStorage.setItem(THEME_STORAGE_KEY, value);
}

function create(platform: 'browser' | 'server' = 'browser'): ThemeService {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  const theme = TestBed.inject(ThemeService);
  // Root effects (applying to <html>, saving) run on the next tick.
  TestBed.tick();
  return theme;
}

const root = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root().className = '';
  delete root().dataset['accent'];
  delete root().dataset['radius'];
  root().style.colorScheme = '';
});

afterEach(() => vi.unstubAllGlobals());

describe('ThemeService', () => {
  it('starts from the default theme when nothing is stored', () => {
    preferDark(false);
    const theme = create();

    expect([theme.mode(), theme.accent(), theme.radius()]).toEqual([
      'system',
      'blue',
      'md',
    ]);
    expect(root().dataset['accent']).toBe('blue');
    expect(root().dataset['radius']).toBe('md');
  });

  it('applies the stored choice to the page', () => {
    preferDark(false);
    store(JSON.stringify({ mode: 'dark', accent: 'violet', radius: 'lg' }));

    const theme = create();

    expect(theme.isDark()).toBe(true);
    expect(root().classList).toContain('dark');
    expect(root().dataset['accent']).toBe('violet');
    expect(root().dataset['radius']).toBe('lg');
    expect(root().style.colorScheme).toBe('dark');
  });

  it('keeps each stored axis it knows and drops one it does not', () => {
    preferDark(false);
    store(JSON.stringify({ mode: 'sepia', accent: 'violet', radius: 42 }));

    const theme = create();

    expect([theme.mode(), theme.accent(), theme.radius()]).toEqual([
      'system',
      'violet',
      'md',
    ]);
    expect(theme.resolvedMode()).toBe('light');
    expect(root().style.colorScheme).toBe('light');
  });

  it('checks every axis on its own, whatever kind of value it holds', () => {
    preferDark(false);
    store(JSON.stringify({ mode: 'dark', accent: 'teal', radius: 'xl' }));

    const theme = create();

    expect([theme.mode(), theme.accent(), theme.radius()]).toEqual([
      'dark',
      'blue',
      'md',
    ]);
    expect(root().dataset['accent']).toBe('blue');
    expect(root().dataset['radius']).toBe('md');
  });

  it('boots on the default from storage that is not a theme', () => {
    preferDark(false);
    for (const raw of ['not json', 'null', '"dark"', '[1, 2]', '7']) {
      TestBed.resetTestingModule();
      store(raw);

      const theme = create();

      expect([theme.mode(), theme.accent(), theme.radius()]).toEqual([
        'system',
        'blue',
        'md',
      ]);
    }
  });

  it('saves a change for the next visit', () => {
    preferDark(false);
    const theme = create();

    theme.setAccent('emerald');
    theme.setRadius('none');
    TestBed.tick();

    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toEqual(
      { mode: 'system', accent: 'emerald', radius: 'none' },
    );
    expect(root().dataset['accent']).toBe('emerald');
  });

  it('follows the system preference while the mode is system', () => {
    const change = preferDark(true);
    const theme = create();

    expect(theme.resolvedMode()).toBe('dark');

    change(false);
    TestBed.tick();

    expect(theme.resolvedMode()).toBe('light');
    expect(root().classList).not.toContain('dark');
  });

  it('leaves system behind for an explicit choice when toggled', () => {
    preferDark(true);
    const theme = create();

    theme.toggleMode();
    expect(theme.mode()).toBe('light');

    theme.toggleMode();
    expect(theme.mode()).toBe('dark');
  });

  it('goes back to the default on reset', () => {
    preferDark(false);
    store(JSON.stringify({ mode: 'dark', accent: 'orange', radius: 'sm' }));
    const theme = create();

    theme.reset();

    expect([theme.mode(), theme.accent(), theme.radius()]).toEqual([
      'system',
      'blue',
      'md',
    ]);
  });

  it('still works where matchMedia is missing, with system as light', () => {
    vi.stubGlobal('matchMedia', undefined);

    const theme = create();

    expect(theme.resolvedMode()).toBe('light');
  });

  it('touches neither the page nor storage on the server', () => {
    store(JSON.stringify({ mode: 'dark', accent: 'orange', radius: 'sm' }));

    const theme = create('server');
    theme.setAccent('violet');
    TestBed.tick();

    expect(theme.mode()).toBe('system');
    expect(root().dataset['accent']).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      JSON.stringify({ mode: 'dark', accent: 'orange', radius: 'sm' }),
    );
  });
});
