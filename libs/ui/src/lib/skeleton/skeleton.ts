import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

/**
 * A grey placeholder shaped like the content that is loading. Size it with
 * classes: `<ask-skeleton class="h-4 w-32" />`.
 *
 * Purely visual and hidden from assistive technology: mark the region that
 * is loading with `aria-busy="true"` and say so in text where it matters.
 * The pulse stops for people who ask for reduced motion.
 */
@Component({
  selector: 'ask-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    'aria-hidden': 'true',
  },
  template: '',
})
export class Skeleton {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(
      'block animate-pulse rounded-md bg-muted motion-reduce:animate-none',
      this.class(),
    ),
  );
}
