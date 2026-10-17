export type Currency = 'VND' | 'USD';

/** An amount in integer minor units (VND has none; USD is in cents). */
export interface Money {
  readonly amount: number;
  readonly currency: Currency;
}

export function money(amount: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money needs a safe integer amount, got ${amount}`);
  }
  // `+ 0` turns -0 into 0.
  return { amount: amount + 0, currency };
}

function sameCurrency(a: Money, b: Money): Currency {
  if (a.currency !== b.currency) {
    throw new TypeError(`Cannot combine ${a.currency} and ${b.currency}`);
  }
  return a.currency;
}

export function add(a: Money, b: Money): Money {
  return money(a.amount + b.amount, sameCurrency(a, b));
}

export function subtract(a: Money, b: Money): Money {
  return money(a.amount - b.amount, sameCurrency(a, b));
}

export function multiply(m: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new RangeError(`Money multiplies by an integer, got ${factor}`);
  }
  return money(m.amount * factor, m.currency);
}

/** `rate` percent of a non-negative amount, rounded half up. */
export function percentOf(m: Money, rate: number): Money {
  if (!Number.isInteger(rate) || rate < 0) {
    throw new RangeError(
      `A rate is a whole, non-negative percentage, got ${rate}`,
    );
  }
  if (m.amount < 0) {
    throw new RangeError(
      `percentOf needs a non-negative amount, got ${m.amount}`,
    );
  }
  const product = m.amount * rate;
  if (!Number.isSafeInteger(product)) {
    throw new RangeError(`${m.amount} at ${rate}% overflows a safe integer`);
  }
  return money(Math.floor((product + 50) / 100), m.currency);
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  sameCurrency(a, b);
  return a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0;
}

export function sum(items: readonly Money[], currency: Currency): Money {
  return items.reduce(add, money(0, currency));
}
