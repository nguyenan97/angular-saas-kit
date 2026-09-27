import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

// Each pair is held to 4.5:1 by the contrast test in libs/tokens.
const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  info: 'bg-info text-info-foreground',
  outline: 'border border-border text-foreground',
};

/**
 * A short status or count: "Paid", "3 new".
 *
 * Colour is never the only signal: the text says the status, and the
 * variant repeats it for those who can see it.
 */
@Component({
  selector: 'ask-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: '<ng-content />',
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(
      'inline-flex w-fit shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_ask-icon]:size-3',
      VARIANTS[this.variant()],
      this.class(),
    ),
  );
}
