/**
 * The shapes the dashboard's API returns. In development and in the demo the
 * mock backend (`mock/`) serves them; a real backend has to return the same.
 *
 * Money is in cents, so no amount is ever a floating-point approximation.
 * Dates are ISO 8601 strings, as JSON carries them.
 */

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'paid',
  'pending',
  'refunded',
  'failed',
];

export interface OrderLine {
  readonly productId: string;
  readonly product: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

export interface Order {
  readonly id: string;
  readonly customerId: string;
  readonly customer: string;
  readonly email: string;
  readonly placedAt: string;
  readonly lines: readonly OrderLine[];
  readonly items: number;
  readonly totalCents: number;
  readonly status: OrderStatus;
}

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly country: string;
  readonly joinedAt: string;
  readonly orders: number;
  readonly spentCents: number;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly category: string;
  readonly priceCents: number;
  readonly stock: number;
  readonly status: ProductStatus;
}

/** One page of a list, and how many items the whole list has. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface DailyTotal {
  readonly date: string;
  readonly revenueCents: number;
  readonly orders: number;
}

/**
 * A figure for the last 30 days and its change on the 30 before, as a
 * fraction (0.124 is +12.4%). A rate (`format: 'percent'`) changes by points
 * instead: -0.006 is 0.6 points lower. `better` says which way is good news:
 * up for revenue, down for the refund rate.
 */
export interface Kpi {
  readonly key: 'revenue' | 'orders' | 'customers' | 'refundRate';
  readonly label: string;
  readonly value: number;
  readonly format: 'money' | 'count' | 'percent';
  readonly change: number;
  readonly better: 'up' | 'down';
}

export interface OverviewStats {
  readonly kpis: readonly Kpi[];
  readonly daily: readonly DailyTotal[];
}

/** The signed-in person, as the Settings page edits it. */
export interface Profile {
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly timeZone: string;
}

export const TIME_ZONES: readonly string[] = [
  'UTC',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Ho_Chi_Minh',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/** Which emails the signed-in person wants. */
export interface NotificationSettings {
  readonly orders: boolean;
  readonly weeklySummary: boolean;
  readonly productNews: boolean;
}
