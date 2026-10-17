import { describe, expect, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { MAX_LINE_QUANTITY, lineNet, lineVat, orderLine } from './order-line';

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
    expect(orderLine(input)).toEqual({
      ok: true,
      value: {
        productId: 'P-001',
        name: 'Carton of rice, 10 kg',
        quantity: 3,
        unitPrice: money(250_000, 'VND'),
        discount: money(50_000, 'VND'),
        vatRate: 8,
      },
    });
  });

  it('does not copy properties the line does not define', () => {
    const result = orderLine({ ...input, extra: 'leak' } as typeof input);
    expect(result.ok && 'extra' in result.value).toBe(false);
  });

  it('refuses a negative unit price', () => {
    expect(orderLine({ ...input, unitPrice: money(-1, 'VND') })).toMatchObject({
      ok: false,
      error: { code: 'invalid-price' },
    });
  });

  it('refuses a negative discount', () => {
    expect(orderLine({ ...input, discount: money(-1, 'VND') })).toMatchObject({
      ok: false,
      error: { code: 'negative-discount' },
    });
  });

  it('accepts a discount equal to the line total', () => {
    const result = orderLine({ ...input, discount: money(750_000, 'VND') });
    expect(result.ok).toBe(true);
    if (result.ok) expect(lineNet(result.value)).toEqual(money(0, 'VND'));
  });

  it('accepts the largest quantity and refuses one more', () => {
    expect(orderLine({ ...input, quantity: MAX_LINE_QUANTITY }).ok).toBe(true);
    expect(
      orderLine({ ...input, quantity: MAX_LINE_QUANTITY + 1 }),
    ).toMatchObject({ ok: false, error: { code: 'invalid-quantity' } });
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

  it('rounds VAT half up on a real fraction', () => {
    const result = orderLine({
      ...input,
      quantity: 1,
      unitPrice: money(15, 'VND'),
      discount: money(0, 'VND'),
      vatRate: 10,
    });
    if (!result.ok) throw new Error('fixture');
    expect(lineVat(result.value)).toEqual(money(2, 'VND'));
  });
});
