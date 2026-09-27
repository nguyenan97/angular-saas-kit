import type { FieldTree } from '@angular/forms/signals';

/**
 * How the dashboard's forms show a field's error: in words, under the field,
 * once the field has been left or the form submitted, never while the user
 * is still on their first attempt.
 */
export function errorShown(field: FieldTree<string>): boolean {
  return field().touched() && field().invalid();
}

/** The first error's message, which is what a form shows. */
export function errorMessage(field: FieldTree<string>): string {
  return field().errors()[0]?.message ?? '';
}

/** Takes the user to the first field, in page order, that needs fixing. */
export function focusFirstInvalid(fields: readonly FieldTree<string>[]): void {
  fields
    .find((field) => field().invalid())?.()
    .focusBoundControl();
}
