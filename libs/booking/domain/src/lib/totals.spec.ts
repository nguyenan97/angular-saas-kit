import { describe, expect, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { addLine, createDraft, type SalesOrder } from './sales-order';
import { line } from './testing';
import { orderTotals } from './totals';

describe('orderTotals', () => {
  it('is zero for an empty order', () => {
    const order = createDraft({
      id: 'SO-1',
      customerId: 'C-1',
      currency: 'VND',
    });
    expect(orderTotals(order)).toEqual({
      subtotal: money(0, 'VND'),
      vat: money(0, 'VND'),
      total: money(0, 'VND'),
    });
  });

  it('sums nets, VAT per line at its own rate, and the total', () => {
    let order: SalesOrder = createDraft({
      id: 'SO-1',
      customerId: 'C-1',
      currency: 'VND',
    });
    for (const l of [
      // 2 x 250,000 = 500,000 net, 8% = 40,000
      line({
        productId: 'P-1',
        quantity: 2,
        unitPrice: money(250_000, 'VND'),
        vatRate: 8,
      }),
      // 3 x 33,335 - 5 = 100,000 net, 10% = 10,000
      line({
        productId: 'P-2',
        quantity: 3,
        unitPrice: money(33_335, 'VND'),
        discount: money(5, 'VND'),
        vatRate: 10,
      }),
      // 1 x 15,005 net, 0% = 0
      line({
        productId: 'P-3',
        quantity: 1,
        unitPrice: money(15_005, 'VND'),
        vatRate: 0,
      }),
    ]) {
      const next = addLine(order, l);
      if (!next.ok) throw new Error(next.error.code);
      order = next.value;
    }

    expect(orderTotals(order)).toEqual({
      subtotal: money(615_005, 'VND'),
      vat: money(50_000, 'VND'),
      total: money(665_005, 'VND'),
    });
  });
});
