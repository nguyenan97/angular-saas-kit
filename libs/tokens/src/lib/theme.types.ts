/**
 * The three theme axes. Kept as const tuples so the UI can iterate them to
 * build a picker without a second, drift-prone list.
 */

export const COLOR_MODES = ['light', 'dark', 'system'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

/** The resolved mode after `system` has been evaluated against the OS. */
export type ResolvedColorMode = Exclude<ColorMode, 'system'>;

export const ACCENTS = ['blue', 'violet', 'emerald', 'orange'] as const;
export type Accent = (typeof ACCENTS)[number];

export const RADII = ['none', 'sm', 'md', 'lg'] as const;
export type Radius = (typeof RADII)[number];

export interface ThemeState {
  mode: ColorMode;
  accent: Accent;
  radius: Radius;
}

export const DEFAULT_THEME: ThemeState = {
  mode: 'system',
  accent: 'blue',
  radius: 'md',
};

/** localStorage key. Versioned so a future token change can invalidate it. */
export const THEME_STORAGE_KEY = 'ask.theme.v1';
