import { add, sum, type Money } from '@angular-saas-kit/shared-kernel';

import { lineNet, lineVat } from './order-line';
import type { SalesOrder } from './sales-order';

export interface OrderTotals {
  readonly subtotal: Money;
  readonly vat: Money;
  readonly total: Money;
}

/** VAT is rounded per line, then summed: what an invoice line shows adds up. */
export function orderTotals(order: SalesOrder): OrderTotals {
  const subtotal = sum(order.lines.map(lineNet), order.currency);
  const vat = sum(order.lines.map(lineVat), order.currency);
  return { subtotal, vat, total: add(subtotal, vat) };
}
