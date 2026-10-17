import { describe, expect, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { addLine, createDraft, type SalesOrder } from './sales-order';
import { line, unwrap } from './testing';
import { orderTotals } from './totals';

const empty = (): SalesOrder =>
  createDraft({ id: 'SO-1', customerId: 'C-1', currency: 'VND' });

describe('orderTotals', () => {
  it('is zero for an empty order', () => {
    expect(orderTotals(empty())).toEqual({
      subtotal: money(0, 'VND'),
      vat: money(0, 'VND'),
      total: money(0, 'VND'),
    });
  });

  it('sums nets, VAT per line at its own rate, and the total', () => {
    let order = empty();
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
      order = unwrap(addLine(order, l));
    }

    expect(orderTotals(order)).toEqual({
      subtotal: money(615_005, 'VND'),
      vat: money(50_000, 'VND'),
      total: money(665_005, 'VND'),
    });
  });

  it('rounds VAT per line, not once on the summed net', () => {
    let order = empty();
    for (const [productId, net] of [
      ['P-1', 5],
      ['P-2', 15],
    ] as const) {
      order = unwrap(
        addLine(
          order,
          line({
            productId,
            quantity: 1,
            unitPrice: money(net, 'VND'),
            vatRate: 10,
          }),
        ),
      );
    }
    // 10% of 5 rounds to 1 and of 15 to 2; of the summed 20 it would be 2.
    expect(orderTotals(order).vat).toEqual(money(3, 'VND'));
  });

  it('accepts anything with lines and a currency', () => {
    expect(orderTotals({ lines: [line()], currency: 'VND' }).subtotal).toEqual(
      money(500_000, 'VND'),
    );
  });
});
