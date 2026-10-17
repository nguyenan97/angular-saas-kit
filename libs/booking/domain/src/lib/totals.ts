import {
  add,
  sum,
  type Currency,
  type Money,
} from '@angular-saas-kit/shared-kernel';

import { lineNet, lineVat, type OrderLine } from './order-line';

export interface OrderTotals {
  readonly subtotal: Money;
  readonly vat: Money;
  readonly total: Money;
}

/**
 * VAT is rounded per line, then summed: what an invoice line shows adds up.
 * Lines built outside `orderLine` can make this throw.
 */
export function orderTotals(order: {
  readonly lines: readonly OrderLine[];
  readonly currency: Currency;
}): OrderTotals {
  const subtotal = sum(order.lines.map(lineNet), order.currency);
  const vat = sum(order.lines.map(lineVat), order.currency);
  return { subtotal, vat, total: add(subtotal, vat) };
}
