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

export type VatRate = 0 | 8 | 10;

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

export function orderLine(
  input: OrderLineInput,
): Result<OrderLine, DomainError> {
  const quantity = toQuantity(input.quantity);
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
  const gross = multiply(input.unitPrice, quantity.value);
  if (compare(input.discount, gross) > 0) {
    return err(
      domainError(
        'discount-too-large',
        `${input.productId}: discount above total`,
      ),
    );
  }
  return ok({ ...input, quantity: quantity.value });
}

export function lineNet(line: OrderLine): Money {
  return subtract(multiply(line.unitPrice, line.quantity), line.discount);
}

export function lineVat(line: OrderLine): Money {
  return percentOf(lineNet(line), line.vatRate);
}
