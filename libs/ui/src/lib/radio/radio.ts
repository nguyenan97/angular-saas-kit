import { Directive, computed, input } from '@angular/core';

import { cn } from '../utils/cn';

const BASE =
  'size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Styles a native `<input type="radio">`.
 *
 * Give the radios of one choice the same `name`, inside a `<fieldset>` with a
 * `<legend>`: the browser then supplies the arrow keys and the single tab stop,
 * which a `button role="radio"` would have to build by hand.
 */
@Directive({
  selector: 'input[type=radio][askRadio]',
  host: { '[class]': 'classes()' },
})
export class Radio {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() => cn(BASE, this.class()));
}
