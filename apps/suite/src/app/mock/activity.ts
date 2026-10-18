import {
  orderTotals,
  type BookingEvent,
} from '@angular-saas-kit/booking-domain';
import type { BookingDataset } from '@angular-saas-kit/booking-data-access/mock';
import type { MockRoute } from '@angular-saas-kit/mock-api';
import type { InMemoryEventBus, Money } from '@angular-saas-kit/shared-kernel';

import { ACTIVITY_URL, type ActivityEntry } from '../data/activity';

/** How many events the Overview's feed shows. */
export const ACTIVITY_LIMIT = 20;

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
});
const amount = (value: Money) =>
  value.currency === 'VND'
    ? MONEY.format(value.amount)
    : `${value.amount} ${value.currency}`;

/**
 * The suite's activity log: the one subscriber of the event bus in this
 * slice. It starts from what the seeded orders went through, so the feed is
 * not empty on first load, and puts every event published after that on top.
 */
export function activityLog(
  bus: InMemoryEventBus<BookingEvent>,
  data: BookingDataset,
): { readonly route: MockRoute; latest(): readonly ActivityEntry[] } {
  const customer = (id: string) =>
    data.customers.find((c) => c.id === id)?.name ?? id;

  const entries: ActivityEntry[] = data.orders
    .flatMap(({ order, history }) =>
      history.flatMap((change): ActivityEntry[] => {
        if (change.status === 'placed') {
          return [
            {
              type: 'OrderPlaced',
              occurredAt: change.at,
              orderId: order.id,
              text: `${order.id} was placed for ${customer(order.customerId)}, ${amount(orderTotals(order).total)}`,
            },
          ];
        }
        if (change.status === 'cancelled' && order.status === 'cancelled') {
          return [
            {
              type: 'OrderCancelled',
              occurredAt: change.at,
              orderId: order.id,
              text: `${order.id} was cancelled: ${order.cancelReason}`,
            },
          ];
        }
        return [];
      }),
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, ACTIVITY_LIMIT);

  bus.subscribeAll((event) => {
    const { orderId } = event.payload;
    const text =
      event.type === 'OrderPlaced'
        ? `${orderId} was placed for ${customer(event.payload.customerId)}, ${amount(event.payload.total)}`
        : `${orderId} was cancelled: ${event.payload.reason}`;
    entries.unshift({
      type: event.type,
      occurredAt: event.occurredAt,
      orderId,
      text,
    });
    entries.length = Math.min(entries.length, ACTIVITY_LIMIT);
  });

  const latest = () => [...entries];
  return {
    route: { method: 'GET', path: ACTIVITY_URL, handler: latest },
    latest,
  };
}
