import { describe, expect, it } from 'vitest';
import {
  add,
  compare,
  money,
  multiply,
  percentOf,
  subtract,
  sum,
} from './money';

describe('Money', () => {
  it('holds integer minor units and a currency', () => {
    expect(money(1500, 'USD')).toEqual({ amount: 1500, currency: 'USD' });
  });

  it('refuses a fractional or unsafe amount', () => {
    expect(() => money(1.5, 'USD')).toThrow(RangeError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'VND')).toThrow(RangeError);
  });

  it('adds and subtracts in the same currency', () => {
    expect(add(money(100, 'VND'), money(250, 'VND'))).toEqual(
      money(350, 'VND'),
    );
    expect(subtract(money(100, 'VND'), money(250, 'VND'))).toEqual(
      money(-150, 'VND'),
    );
  });

  it('refuses to mix currencies', () => {
    expect(() => add(money(1, 'VND'), money(1, 'USD'))).toThrow(
      'Cannot combine VND and USD',
    );
  });

  it('multiplies by an integer factor', () => {
    expect(multiply(money(1999, 'USD'), 3)).toEqual(money(5997, 'USD'));
    expect(() => multiply(money(1, 'USD'), 1.5)).toThrow(RangeError);
  });

  it('takes a whole percentage, rounding half up', () => {
    expect(percentOf(money(1000, 'USD'), 8)).toEqual(money(80, 'USD'));
    // 1006 * 8% = 80.48 -> 80
    expect(percentOf(money(1006, 'USD'), 8)).toEqual(money(80, 'USD'));
    // 1025 * 10% = 102.5 -> 103
    expect(percentOf(money(1025, 'USD'), 10)).toEqual(money(103, 'USD'));
  });

  it('compares amounts', () => {
    expect(compare(money(1, 'VND'), money(2, 'VND'))).toBe(-1);
    expect(compare(money(2, 'VND'), money(2, 'VND'))).toBe(0);
    expect(compare(money(3, 'VND'), money(2, 'VND'))).toBe(1);
  });

  it('sums a list, starting from zero in the given currency', () => {
    expect(sum([], 'VND')).toEqual(money(0, 'VND'));
    expect(sum([money(1, 'VND'), money(2, 'VND')], 'VND')).toEqual(
      money(3, 'VND'),
    );
  });
});
