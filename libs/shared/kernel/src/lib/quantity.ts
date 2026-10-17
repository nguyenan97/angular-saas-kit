import { err, ok, type Result } from './result';

declare const quantityBrand: unique symbol;

/** A count of units: a positive integer, checked once by `quantity()`. */
export type Quantity = number & { readonly [quantityBrand]: true };

export function quantity(value: number): Result<Quantity, 'invalid-quantity'> {
  return Number.isSafeInteger(value) && value > 0
    ? ok(value as Quantity)
    : err('invalid-quantity');
}
