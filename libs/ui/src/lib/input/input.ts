import { Directive, ElementRef, computed, inject, input } from '@angular/core';

import { cn } from '../utils/cn';

// `border-input` is held to 3:1 against the page by the contrast test in
// libs/tokens: a field's border is how the field is found at all.
const BASE =
  'w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive';

const BY_ELEMENT: Record<string, string> = {
  input: 'h-9 py-1',
  select: 'h-9 py-1',
  textarea: 'min-h-20 py-2',
};

/**
 * Styles a native text `<input>`, `<textarea>` or `<select>`.
 *
 * The element stays the real one, so forms, validation, autofill and the
 * platform's own pickers keep working. Label it with a `<label for>` (see
 * `Label`), and set `aria-invalid` and `aria-describedby` for an error.
 */
@Directive({
  selector: 'input[askInput], textarea[askInput], select[askInput]',
  host: { '[class]': 'classes()' },
})
export class Input {
  private readonly tag = (
    inject(ElementRef).nativeElement as HTMLElement
  ).tagName.toLowerCase();

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(BASE, BY_ELEMENT[this.tag], this.class()),
  );
}

/** Styles a native `<label>`. Associate it with `for`, or wrap the field. */
@Directive({
  selector: 'label[askLabel]',
  host: { '[class]': 'classes()' },
})
export class Label {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('text-sm leading-none font-medium text-foreground', this.class()),
  );
}
