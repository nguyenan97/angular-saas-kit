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

/**
 * Exercises all three theme axes.
 *
 * Doubles as the kit's proof that the token layer works: nothing here knows
 * a single colour value, it only flips attributes on <html>.
 */
@Component({
  selector: 'ask-theme-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4' },
  template: `
    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Mode</legend>
      <div role="radiogroup" aria-label="Colour mode" class="flex gap-1">
        @for (mode of modes; track mode) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="theme.mode() === mode"
            [class]="optionClass(theme.mode() === mode)"
            (click)="theme.setMode(mode)"
          >
            {{ mode }}
          </button>
        }
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Accent</legend>
      <div role="radiogroup" aria-label="Accent colour" class="flex gap-1">
        @for (accent of accents; track accent) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="theme.accent() === accent"
            [attr.aria-label]="accent"
            [attr.data-accent]="accent"
            [class]="swatchClass(theme.accent() === accent)"
            (click)="theme.setAccent(accent)"
          >
            <span class="size-4 rounded-full bg-primary"></span>
          </button>
        }
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-xs font-medium text-muted-foreground">Radius</legend>
      <div role="radiogroup" aria-label="Corner radius" class="flex gap-1">
        @for (radius of radii; track radius) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="theme.radius() === radius"
            [class]="optionClass(theme.radius() === radius)"
            (click)="theme.setRadius(radius)"
          >
            {{ radius }}
          </button>
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

  protected optionClass(selected: boolean): string {
    return cn(
      'rounded-md border px-2.5 py-1 text-xs capitalize transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      selected
        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
        : 'border-border bg-background text-foreground',
    );
  }

  protected swatchClass(selected: boolean): string {
    return cn(
      'grid size-8 place-items-center rounded-md border transition-colors',
      selected ? 'border-primary' : 'border-border hover:border-foreground/30',
    );
  }
}
