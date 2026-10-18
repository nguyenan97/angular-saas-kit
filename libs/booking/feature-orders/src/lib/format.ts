import type { Money } from '@angular-saas-kit/shared-kernel';
import type {
  DeliverySlot,
  OrderStatus,
} from '@angular-saas-kit/booking-domain';
import type { BookingFailure } from '@angular-saas-kit/booking-data-access';
import type { BookingErrorCode } from '@angular-saas-kit/booking-contracts';
import type { BadgeVariant } from '@angular-saas-kit/ui';

const MONEY: Record<Money['currency'], Intl.NumberFormat> = {
  VND: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
};

/** Money in its currency's minor units: VND has none, USD has cents. */
export function formatMoney(value: Money): string {
  const minor = value.currency === 'USD' ? 100 : 1;
  return MONEY[value.currency].format(value.amount / minor);
}

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const DAY = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** "Oct 18, 09:30", in the browser's zone (the demo assumes Asia/Ho_Chi_Minh). */
export const formatDateTime = (iso: string): string =>
  DATE_TIME.format(new Date(iso));

/** "Tue, Oct 20" for a slot's local calendar date. */
export function formatSlotDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return DAY.format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

/** "Tue, Oct 20, 08:00 to 12:00". */
export function formatSlot(slot: DeliverySlot): string {
  const [from, to] = slot.window.split('-');
  return `${formatSlotDate(slot.date)}, ${from}:00 to ${to}:00`;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: 'Draft',
  placed: 'Placed',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export const STATUS_BADGE: Record<OrderStatus, BadgeVariant> = {
  draft: 'neutral',
  placed: 'info',
  confirmed: 'success',
  cancelled: 'destructive',
};

/** What the person reads for each refusal. The code is for machines. */
export const ERROR_MESSAGE: Record<BookingErrorCode, string> = {
  'empty-order': 'Add at least one line before placing the order.',
  'slot-in-past': 'That delivery slot has already started. Choose a later one.',
  'slot-full': 'That delivery slot is full. Choose another one.',
  'invalid-transition':
    'The order has changed since you opened it. Reload it to see where it stands.',
  'reason-required': 'Give a reason for cancelling.',
  'not-draft': 'Only a draft can be changed.',
  'invalid-quantity': 'A quantity is a whole number from 1 to 100,000.',
  'currency-mismatch': 'Every line must be in the order’s currency.',
  'negative-discount': 'A discount cannot be negative.',
  'invalid-price': 'A price cannot be negative.',
  'discount-too-large': 'A discount cannot be more than its line.',
  'duplicate-line':
    'Each product can be on the order once. Change its quantity instead.',
  'line-not-found': 'That line is no longer on the order.',
  'not-found': 'There is no such order.',
  'invalid-request':
    'Something in the order is not valid. Check the customer and the lines.',
};

/** The message for a business refusal; network failures get the Retry banner instead. */
export function failureMessage(failure: BookingFailure | null): string | null {
  return failure?.kind === 'business' ? ERROR_MESSAGE[failure.code] : null;
}
