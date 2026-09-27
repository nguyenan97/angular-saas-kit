import type { BadgeVariant } from '@angular-saas-kit/ui';

import type { Kpi, OrderStatus } from './models';

// en-US and US dollars, like the demo data. An app with other users formats
// with their locale and currency.
const DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const WHOLE_DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const COUNT = new Intl.NumberFormat('en-US');
// The data's days are UTC days, so they are shown as UTC days everywhere.
const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export const formatMoney = (cents: number): string =>
  DOLLARS.format(cents / 100);

export const formatDate = (iso: string): string =>
  SHORT_DATE.format(new Date(iso));

export function formatKpiValue(kpi: Kpi): string {
  switch (kpi.format) {
    case 'money':
      return WHOLE_DOLLARS.format(kpi.value / 100);
    case 'percent':
      return `${(kpi.value * 100).toFixed(1)}%`;
    default:
      return COUNT.format(kpi.value);
  }
}

/** "+12.4%", or "-0.6 pts" for a rate, which changes by points. */
export function formatKpiChange(kpi: Kpi): string {
  const sign = kpi.change > 0 ? '+' : kpi.change < 0 ? '-' : '';
  const size = (Math.abs(kpi.change) * 100).toFixed(1);
  return kpi.format === 'percent' ? `${sign}${size} pts` : `${sign}${size}%`;
}

/** Whether the change is good news: more revenue, fewer refunds. */
export const isGoodChange = (kpi: Kpi): boolean =>
  kpi.change === 0 || kpi.change > 0 === (kpi.better === 'up');

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
  failed: 'Failed',
};

export const STATUS_BADGE: Record<OrderStatus, BadgeVariant> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
  failed: 'destructive',
};
