import type { FieldTree } from '@angular/forms/signals';

/**
 * Takes the user to the first field, in page order, that needs fixing.
 * How each error shows is `FormFieldFrame`'s job (`form-field.ts`).
 */
export function focusFirstInvalid(fields: readonly FieldTree<string>[]): void {
  fields
    .find((field) => field().invalid())?.()
    .focusBoundControl();
}
