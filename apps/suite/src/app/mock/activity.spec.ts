import {
  InMemoryEventBus,
  domainEvent,
  money,
} from '@angular-saas-kit/shared-kernel';
import type { BookingEvent } from '@angular-saas-kit/booking-domain';
import { createBookingDataset } from '@angular-saas-kit/booking-data-access/mock';
import { describe, expect, it } from 'vitest';

import { ACTIVITY_LIMIT, activityLog } from './activity';

const NOW = new Date(2026, 9, 18, 10, 30);

describe('activityLog', () => {
  it('starts from the history of the seeded orders, newest first, at most 20', () => {
    const data = createBookingDataset(NOW);
    const log = activityLog(new InMemoryEventBus<BookingEvent>(), data);

    const entries = log.latest();
    expect(entries).toHaveLength(ACTIVITY_LIMIT);
    const times = entries.map((e) => e.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(new Set(entries.map((e) => e.type))).toEqual(
      new Set(['OrderPlaced', 'OrderCancelled']),
    );
  });

  it('puts each event the bus publishes on top, described in words', () => {
    const bus = new InMemoryEventBus<BookingEvent>();
    const log = activityLog(bus, createBookingDataset(NOW));

    bus.publish(
      domainEvent(
        'OrderPlaced',
        {
          orderId: 'SO-0061',
          customerId: 'C-01',
          slotId: 'slot-2026-10-20-am',
          total: money(540_000, 'VND'),
          lines: [],
        },
        NOW,
      ),
    );
    bus.publish(
      domainEvent(
        'OrderCancelled',
        {
          orderId: 'SO-0061',
          reason: 'Wrong address',
          slotId: 'slot-2026-10-20-am',
        },
        NOW,
      ),
    );

    const [first, second] = log.latest();
    expect(first).toMatchObject({
      type: 'OrderCancelled',
      orderId: 'SO-0061',
      text: 'SO-0061 was cancelled: Wrong address',
    });
    expect(second?.text).toBe(
      'SO-0061 was placed for Minh Chau Mart, ₫540,000',
    );
    expect(log.latest()).toHaveLength(ACTIVITY_LIMIT);
  });

  it('serves the log at GET /api/suite/activity', () => {
    const log = activityLog(
      new InMemoryEventBus<BookingEvent>(),
      createBookingDataset(NOW),
    );

    expect(log.route).toMatchObject({
      method: 'GET',
      path: '/api/suite/activity',
    });
    expect(
      log.route.handler({
        params: {},
        query: new URLSearchParams(),
        body: null,
      }),
    ).toEqual(log.latest());
  });
});
