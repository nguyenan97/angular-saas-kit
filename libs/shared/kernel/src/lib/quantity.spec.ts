import { quantity } from './quantity';

describe('quantity', () => {
  it('accepts a positive integer', () => {
    const result = quantity(3);
    expect(result).toEqual({ ok: true, value: 3 });
  });

  it.each([0, -1, 1.5, Number.NaN])('refuses %s', (value) => {
    expect(quantity(value)).toEqual({ ok: false, error: 'invalid-quantity' });
  });
});
