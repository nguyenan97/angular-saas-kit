import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  type Accent,
  type ColorMode,
  DEFAULT_THEME,
  type Radius,
  type ResolvedColorMode,
  THEME_STORAGE_KEY,
  type ThemeState,
} from './theme.types';

/**
 * Owns the three theme axes and reflects them onto <html>.
 *
 * Everything is a signal, so a component that wants to react to the theme
 * reads `resolvedMode()` rather than subscribing to anything.
 *
 * SSR: the service is constructed on the server too (the landing app
 * prerenders), so every DOM and storage touch is guarded by a platform check.
 * The server renders the default theme and the browser corrects it on
 * hydration - see `theme-init.ts` for the anti-flash inline script.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<ThemeState>(DEFAULT_THEME);

  /** Tracks the OS preference so `mode: 'system'` stays live. */
  private readonly systemPrefersDark = signal(false);

  readonly mode = computed(() => this.state().mode);
  readonly accent = computed(() => this.state().accent);
  readonly radius = computed(() => this.state().radius);

  /** `system` collapsed to a concrete value. This is what the UI should read. */
  readonly resolvedMode = computed<ResolvedColorMode>(() => {
    const mode = this.state().mode;
    if (mode !== 'system') {
      return mode;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.resolvedMode() === 'dark');

  constructor() {
    if (this.isBrowser) {
      this.state.set(this.read());
      this.watchSystemPreference();
    }

    effect(() => {
      const resolved = this.resolvedMode();
      const { accent, radius } = this.state();
      this.apply(resolved, accent, radius);
    });

    effect(() => {
      const state = this.state();
      this.write(state);
    });
  }

  setMode(mode: ColorMode): void {
    this.state.update((s) => ({ ...s, mode }));
  }

  setAccent(accent: Accent): void {
    this.state.update((s) => ({ ...s, accent }));
  }

  setRadius(radius: Radius): void {
    this.state.update((s) => ({ ...s, radius }));
  }

  /** Light <-> dark. An explicit choice, so it leaves `system` behind. */
  toggleMode(): void {
    this.setMode(this.resolvedMode() === 'dark' ? 'light' : 'dark');
  }

  reset(): void {
    this.state.set(DEFAULT_THEME);
  }

  // -- internals ----------------------------------------------------------

  private apply(mode: ResolvedColorMode, accent: Accent, radius: Radius): void {
    if (!this.isBrowser) {
      return;
    }
    const root = this.document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.dataset['accent'] = accent;
    root.dataset['radius'] = radius;
    root.style.colorScheme = mode;
  }

  private watchSystemPreference(): void {
    const view = this.document.defaultView;

    // `matchMedia` is missing in some test DOMs and in embedded webviews. The
    // theme still works without it - `system` just resolves to light - so
    // this must degrade rather than throw during construction.
    if (typeof view?.matchMedia !== 'function') {
      return;
    }

    const query = view.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(query.matches);

    // Safari < 14 only has the deprecated addListener.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', (event) =>
        this.systemPrefersDark.set(event.matches),
      );
    }
  }

  private read(): ThemeState {
    try {
      const raw =
        this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_THEME;
      }
      // Spread over the default so a partial or older payload still boots.
      return { ...DEFAULT_THEME, ...(JSON.parse(raw) as Partial<ThemeState>) };
    } catch {
      // Private mode, disabled storage, corrupt JSON - none are worth failing
      // the app over.
      return DEFAULT_THEME;
    }
  }

  private write(state: ThemeState): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      this.document.defaultView?.localStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify(state),
      );
    } catch {
      /* storage unavailable - the theme still works for this session */
    }
  }
}
