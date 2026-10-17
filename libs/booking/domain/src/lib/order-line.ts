import {
  compare,
  err,
  multiply,
  ok,
  percentOf,
  quantity as toQuantity,
  subtract,
  type Money,
  type Quantity,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';

/**
 * Caps a line's quantity. Prices come from the catalog, so the cap keeps
 * quantity times price well inside safe integers for any realistic price.
 */
export const MAX_LINE_QUANTITY = 100_000;

export type VatRate = 0 | 8 | 10;

/**
 * Build a line only through `orderLine`, or validate it when loading it from
 * storage. The arithmetic trusts its input, and totals may throw otherwise.
 */
export interface OrderLine {
  readonly productId: string;
  readonly name: string;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
  readonly discount: Money;
  readonly vatRate: VatRate;
}

export interface OrderLineInput {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly discount: Money;
  readonly vatRate: VatRate;
}

/** A quantity a line may hold: a positive integer, at most `MAX_LINE_QUANTITY`. */
function lineQuantity(value: number): Result<Quantity, 'invalid-quantity'> {
  const quantity = toQuantity(value);
  return quantity.ok && quantity.value <= MAX_LINE_QUANTITY
    ? quantity
    : err('invalid-quantity');
}

export function orderLine(
  input: OrderLineInput,
): Result<OrderLine, DomainError> {
  const quantity = lineQuantity(input.quantity);
  if (!quantity.ok) {
    return err(
      domainError('invalid-quantity', `${input.productId}: ${input.quantity}`),
    );
  }
  if (input.discount.currency !== input.unitPrice.currency) {
    return err(
      domainError('currency-mismatch', `${input.productId}: discount currency`),
    );
  }
  if (input.unitPrice.amount < 0) {
    return err(
      domainError('invalid-price', `${input.productId}: negative price`),
    );
  }
  if (input.discount.amount < 0) {
    return err(
      domainError('negative-discount', `${input.productId}: negative discount`),
    );
  }
  const gross = multiply(input.unitPrice, quantity.value);
  if (compare(input.discount, gross) > 0) {
    return err(
      domainError(
        'discount-too-large',
        `${input.productId}: discount above total`,
      ),
    );
  }
  return ok({
    productId: input.productId,
    name: input.name,
    quantity: quantity.value,
    unitPrice: input.unitPrice,
    discount: input.discount,
    vatRate: input.vatRate,
  });
}

export function lineNet(line: OrderLine): Money {
  return subtract(multiply(line.unitPrice, line.quantity), line.discount);
}

export function lineVat(line: OrderLine): Money {
  return percentOf(lineNet(line), line.vatRate);
}
