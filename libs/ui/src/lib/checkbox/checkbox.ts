import { Directive, computed, input } from '@angular/core';

import { cn } from '../utils/cn';

// The browser draws the box and the tick, and `accent-primary` colours it from the
// token, so it keeps the platform's states, forced-colors mode and its own keyboard
// handling. `border-input` is held to 3:1 against the page by the test in libs/tokens.
const BASE =
  'size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Styles a native `<input type="checkbox">`.
 *
 * The element stays the real one: Space toggles it, forms and `[formControl]` work,
 * and `indeterminate` is the platform's. Label it with a `<label for>` or wrap it
 * in a `<label>`.
 */
@Directive({
  selector: 'input[type=checkbox][askCheckbox]',
  host: { '[class]': 'classes()' },
})
export class Checkbox {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() => cn(BASE, this.class()));
}
