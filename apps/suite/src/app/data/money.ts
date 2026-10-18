import type { Money } from '@angular-saas-kit/shared-kernel';

const FORMATS: Record<Money['currency'], Intl.NumberFormat> = {
  VND: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

/** Money in its currency, from minor units: VND has none, USD has cents. */
export function formatMoney(value: Money): string {
  const minor = value.currency === 'USD' ? 100 : 1;
  return FORMATS[value.currency].format(value.amount / minor);
}
