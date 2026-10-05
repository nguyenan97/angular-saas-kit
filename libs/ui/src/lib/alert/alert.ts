import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

export type AlertVariant =
  'neutral' | 'success' | 'warning' | 'destructive' | 'info';

// The accent is a border only; the text stays on `foreground`, so contrast never depends on the variant.
const VARIANTS: Record<AlertVariant, string> = {
  neutral: 'border-l-border',
  success: 'border-l-success',
  warning: 'border-l-warning',
  destructive: 'border-l-destructive',
  info: 'border-l-info',
};

/**
 * A message that stays on the page: "Payment failed", "Saved".
 *
 * `destructive` and `warning` are announced at once (`role="alert"`); the
 * rest wait for a pause (`role="status"`). Colour is never the only signal:
 * write what happened in the text.
 */
@Component({
  selector: 'ask-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'role()',
  },
  template: '<ng-content />',
})
export class Alert {
  readonly variant = input<AlertVariant>('neutral');

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly role = computed(() =>
    this.variant() === 'destructive' || this.variant() === 'warning'
      ? 'alert'
      : 'status',
  );

  protected readonly classes = computed(() =>
    cn(
      'block rounded-md border border-l-4 border-border bg-card p-4 text-sm text-card-foreground',
      VARIANTS[this.variant()],
      this.class(),
    ),
  );
}
