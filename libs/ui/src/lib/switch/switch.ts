import { Directive, computed, input } from '@angular/core';

import { cn } from '../utils/cn';

// A checkbox drawn as a track and a thumb. The track is `bg-input` (3:1 against the
// page, like a field's border) and the thumb is `bg-background`, so the thumb reads
// against the track in both modes; checked, the track is `bg-primary`.
const BASE =
  'peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer appearance-none items-center rounded-full border border-transparent bg-input p-0.5 transition-colors before:block before:size-4 before:rounded-full before:bg-background before:shadow-xs before:transition-transform before:content-[""] checked:bg-primary checked:before:translate-x-4 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Styles a native `<input type="checkbox">` as a switch, and gives it
 * `role="switch"`, so a screen reader announces "on" and "off" rather than
 * "checked". It stays the real checkbox: Space toggles it, forms keep working.
 *
 * Use a switch for a setting that takes effect at once; use `Checkbox` for a
 * choice that is submitted later. The label says what the setting is, never
 * "on" or "off".
 */
@Directive({
  selector: 'input[type=checkbox][askSwitch]',
  host: { role: 'switch', '[class]': 'classes()' },
})
export class Switch {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() => cn(BASE, this.class()));
}
