import { describe, expect, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { lineNet, lineVat, orderLine } from './order-line';

const input = {
  productId: 'P-001',
  name: 'Carton of rice, 10 kg',
  quantity: 3,
  unitPrice: money(250_000, 'VND'),
  discount: money(50_000, 'VND'),
  vatRate: 8 as const,
};

describe('orderLine', () => {
  it('builds a line from valid input', () => {
    const result = orderLine(input);
    expect(result.ok).toBe(true);
  });

  it('refuses a quantity that is not a positive integer', () => {
    expect(orderLine({ ...input, quantity: 0 })).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' },
    });
  });

  it('refuses a discount in another currency than the price', () => {
    expect(orderLine({ ...input, discount: money(1, 'USD') })).toMatchObject({
      ok: false,
      error: { code: 'currency-mismatch' },
    });
  });

  it('refuses a discount above the line total', () => {
    expect(
      orderLine({ ...input, discount: money(750_001, 'VND') }),
    ).toMatchObject({ ok: false, error: { code: 'discount-too-large' } });
  });
});

describe('line money', () => {
  const line = (() => {
    const result = orderLine(input);
    if (!result.ok) throw new Error('fixture');
    return result.value;
  })();

  it('nets quantity times price minus the discount', () => {
    expect(lineNet(line)).toEqual(money(700_000, 'VND'));
  });

  it('charges VAT on the net, rounded half up', () => {
    expect(lineVat(line)).toEqual(money(56_000, 'VND'));
  });
});
