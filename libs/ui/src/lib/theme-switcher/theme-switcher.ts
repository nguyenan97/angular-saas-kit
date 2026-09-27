import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ACCENTS,
  type Accent,
  COLOR_MODES,
  type ColorMode,
  RADII,
  type Radius,
  ThemeService,
} from '@angular-saas-kit/tokens';

import { cn } from '../utils/cn';

/** Gives each instance its own radio groups, so two on a page do not merge. */
let nextId = 0;

/**
 * The keyboard focus ring. The radio input is invisible (see `INPUT`), so its
 * own outline cannot be seen; the label around it shows the ring instead.
 */
const FOCUS_RING =
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring';

/**
 * Covers its label and is transparent. It stays the real, focusable radio, so
 * a click lands on it, and the browser supplies the behaviour of a radio
 * group: one tab stop per group, arrow keys that move the selection, and the
 * state announced by assistive technology. Nothing here re-implements any of
 * that.
 */
const INPUT = 'absolute inset-0 m-0 size-full cursor-pointer opacity-0';

/**
 * Exercises all three theme axes.
 *
 * Doubles as the kit's proof that the token layer works: nothing here knows
 * a single colour value, it only flips attributes on <html>.
 *
 * Each axis is a `fieldset` of native radio inputs. A `button` with
 * `role="radio"` promises the arrow-key behaviour of a radio group and leaves
 * it to the component to build; an `input type="radio"` gets it for free.
 */
@Component({
  selector: 'ask-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Mode</legend>
      <div class="flex gap-1">
        @for (mode of modes; track mode) {
          <label [class]="optionClass(theme.mode() === mode)">
            <input
              type="radio"
              [class]="inputClass"
              [name]="groupName('mode')"
              [value]="mode"
              [checked]="theme.mode() === mode"
              (change)="theme.setMode(mode)"
            />
            {{ mode }}
          </label>
        }
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Accent</legend>
      <div class="flex gap-1">
        @for (accent of accents; track accent) {
          <label
            [class]="swatchClass(theme.accent() === accent)"
            [attr.data-accent]="accent"
          >
            <input
              type="radio"
              [class]="inputClass"
              [name]="groupName('accent')"
              [value]="accent"
              [attr.aria-label]="accent"
              [checked]="theme.accent() === accent"
              (change)="theme.setAccent(accent)"
            />
            <span class="size-4 rounded-full bg-primary"></span>
          </label>
        }
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Radius</legend>
      <div class="flex gap-1">
        @for (radius of radii; track radius) {
          <label [class]="optionClass(theme.radius() === radius)">
            <input
              type="radio"
              [class]="inputClass"
              [name]="groupName('radius')"
              [value]="radius"
              [checked]="theme.radius() === radius"
              (change)="theme.setRadius(radius)"
            />
            {{ radius }}
          </label>
        }
      </div>
    </fieldset>
  `,
})
export class ThemeSwitcher {
  protected readonly theme = inject(ThemeService);

  protected readonly modes: readonly ColorMode[] = COLOR_MODES;
  protected readonly accents: readonly Accent[] = ACCENTS;
  protected readonly radii: readonly Radius[] = RADII;

  protected readonly inputClass = INPUT;

  private readonly id = `ask-theme-switcher-${nextId++}`;

  /** Radios that share a `name` are one group: that is what the browser uses. */
  protected groupName(axis: 'mode' | 'accent' | 'radius'): string {
    return `${this.id}-${axis}`;
  }

  protected optionClass(selected: boolean): string {
    return cn(
      'relative cursor-pointer rounded-md border px-2.5 py-1 text-xs capitalize transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      FOCUS_RING,
      selected
        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
        : 'border-border bg-background text-foreground',
    );
  }

  protected swatchClass(selected: boolean): string {
    return cn(
      'relative grid size-8 cursor-pointer place-items-center rounded-md border transition-colors',
      FOCUS_RING,
      selected ? 'border-primary' : 'border-border hover:border-foreground/30',
    );
  }
}
