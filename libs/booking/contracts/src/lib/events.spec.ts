import { domainEvent, money } from '@angular-saas-kit/shared-kernel';
import type {
  OrderCancelled,
  OrderPlaced,
} from '@angular-saas-kit/booking-domain';
import { describe, expect, it } from 'vitest';

import { toPublishedEvent } from './events';

const AT = new Date(Date.UTC(2026, 9, 18, 2));

const placed: OrderPlaced = domainEvent(
  'OrderPlaced',
  {
    orderId: 'SO-0001',
    customerId: 'C-01',
    slotId: 'slot-2026-10-20-am',
    total: money(540_000, 'VND'),
    lines: [{ productId: 'P-001', quantity: 2 }],
  },
  AT,
);

describe('toPublishedEvent', () => {
  it('publishes OrderPlaced as OrderPlacedV1, with every field of the payload', () => {
    expect(toPublishedEvent(placed)).toEqual({
      type: 'booking.order-placed.v1',
      occurredAt: '2026-10-18T02:00:00.000Z',
      orderId: 'SO-0001',
      customerId: 'C-01',
      slotId: 'slot-2026-10-20-am',
      total: { amount: 540_000, currency: 'VND' },
      lines: [{ productId: 'P-001', quantity: 2 }],
    });
  });

  it('publishes OrderCancelled as OrderCancelledV1, with the slot it frees', () => {
    const cancelled: OrderCancelled = domainEvent(
      'OrderCancelled',
      { orderId: 'SO-0001', reason: 'Wrong address', slotId: 'slot-1' },
      AT,
    );

    expect(toPublishedEvent(cancelled)).toEqual({
      type: 'booking.order-cancelled.v1',
      occurredAt: '2026-10-18T02:00:00.000Z',
      orderId: 'SO-0001',
      reason: 'Wrong address',
      slotId: 'slot-1',
    });
  });

  it('leaves the slot out of OrderCancelledV1 when a draft was cancelled', () => {
    const cancelled: OrderCancelled = domainEvent(
      'OrderCancelled',
      { orderId: 'SO-0002', reason: 'Duplicate' },
      AT,
    );

    expect(toPublishedEvent(cancelled)).not.toHaveProperty('slotId');
  });

  it('copies the lines, so a consumer cannot change the order they came from', () => {
    const event = toPublishedEvent(placed);
    if (event.type !== 'booking.order-placed.v1') throw new Error(event.type);

    expect(event.lines).toEqual(placed.payload.lines);
    expect(event.lines).not.toBe(placed.payload.lines);
  });
});
