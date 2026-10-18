import type { BookingEvent } from '@angular-saas-kit/booking-domain';
import {
  BOOKING_API,
  type BookingOverviewDto,
  type CustomerDto,
  type OrderDto,
  type OrderSummaryDto,
  type Page,
  type ProductDto,
  type SlotDto,
} from '@angular-saas-kit/booking-contracts';
import { MockResponse, type MockRoute } from '@angular-saas-kit/mock-api';
import { beforeEach, describe, expect, it } from 'vitest';

import { bookingMockRoutes } from './routes';
import { createBookingDataset, localDate, type BookingDataset } from './seed';

const NOW = new Date(2026, 9, 18, 10, 30);

let data: BookingDataset;
let routes: MockRoute[];
let published: BookingEvent[];

beforeEach(() => {
  data = createBookingDataset(NOW);
  published = [];
  routes = bookingMockRoutes(data, {
    now: () => NOW,
    publish: (event) => published.push(event),
  });
});

/** Calls the route for `method` and `path` (a BOOKING_API pattern). */
function call(
  method: MockRoute['method'],
  path: string,
  init: { id?: string; query?: string; body?: unknown } = {},
): unknown {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) throw new Error(`no route ${method} ${path}`);
  return route.handler({
    params: init.id === undefined ? {} : { id: init.id },
    query: new URLSearchParams(init.query ?? ''),
    body: init.body ?? null,
  });
}

/** The status and body of a `mockResponse`; 200 for a plain body. */
function answer(value: unknown): { status: number; body: unknown } {
  return value instanceof MockResponse
    ? { status: value.status, body: value.body }
    : { status: 200, body: value };
}

const list = (query = '') =>
  call('GET', BOOKING_API.orders, { query }) as Page<OrderSummaryDto>;

function bookableSlot(): SlotDto {
  const slots = call('GET', BOOKING_API.slots) as SlotDto[];
  const slot = slots.find(
    (s) => s.booked < s.capacity && s.date > localDate(NOW, 0),
  );
  if (!slot) throw new Error('no bookable slot in the seed');
  return slot;
}

function newDraft(): OrderDto {
  const product = data.products[0] as ProductDto;
  const created = answer(
    call('POST', BOOKING_API.orders, {
      body: {
        customerId: 'C-01',
        lines: [{ productId: product.id, quantity: 2 }],
      },
    }),
  );
  expect(created.status).toBe(201);
  return created.body as OrderDto;
}

describe('GET /api/booking/orders', () => {
  it('pages the orders, newest first', () => {
    const page = list('pageSize=10');

    expect(page).toMatchObject({ total: 60, page: 1, pageSize: 10 });
    expect(page.items).toHaveLength(10);
    expect(page.items[0]?.id).toBe('SO-0060');
  });

  it('serves a later page, and holds the page and its size to what exists', () => {
    expect(list('page=2&pageSize=25').items[0]?.id).toBe('SO-0035');
    expect(list('page=99&pageSize=25')).toMatchObject({ page: 3 });
    expect(list('page=-1&pageSize=500')).toMatchObject({
      page: 1,
      pageSize: 50,
    });
  });

  it('filters by status', () => {
    const page = list('status=cancelled&pageSize=50');

    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((o) => o.status === 'cancelled')).toBe(true);
  });

  it("finds an order by its id or by its customer's name, ignoring case", () => {
    expect(list('q=so-0007').items.map((o) => o.id)).toEqual(['SO-0007']);
    const customer = list('q=so-0007').items[0]?.customerName ?? '';
    const byName = list(`q=${customer.toUpperCase()}&pageSize=50`);
    expect(byName.total).toBeGreaterThan(0);
    expect(byName.items.every((o) => o.customerName === customer)).toBe(true);
  });

  it('summarises each order with its total and line count', () => {
    const summary = list('q=SO-0001').items[0] as OrderSummaryDto;
    const order = call('GET', BOOKING_API.order, { id: 'SO-0001' }) as OrderDto;

    expect(summary.total).toEqual(order.totals.total);
    expect(summary.lineCount).toBe(order.lines.length);
  });
});

describe('GET /api/booking/orders/:id', () => {
  it('returns the order with its customer, totals, lines and history', () => {
    const order = call('GET', BOOKING_API.order, { id: 'SO-0001' }) as OrderDto;

    expect(order.id).toBe('SO-0001');
    expect(order.customerName).toBe(
      data.customers.find((c) => c.id === order.customerId)?.name,
    );
    expect(order.history[0]?.status).toBe('draft');
    expect(order.lines[0]?.net.currency).toBe('VND');
  });

  it('answers 404 with a code for an unknown order', () => {
    expect(answer(call('GET', BOOKING_API.order, { id: 'SO-9999' }))).toEqual({
      status: 404,
      body: { code: 'not-found', message: 'No order SO-9999.' },
    });
  });
});

describe('POST /api/booking/orders', () => {
  it('creates a draft with the next id, priced from the catalogue', () => {
    const draft = newDraft();

    expect(draft).toMatchObject({ id: 'SO-0061', status: 'draft' });
    expect(draft.lines[0]?.unitPrice).toEqual(data.products[0]?.unitPrice);
    expect(list().total).toBe(61);
  });

  it('answers 400 for an unknown customer or product, or a body without lines', () => {
    const unknownCustomer = answer(
      call('POST', BOOKING_API.orders, {
        body: { customerId: 'C-99', lines: [] },
      }),
    );
    const unknownProduct = answer(
      call('POST', BOOKING_API.orders, {
        body: {
          customerId: 'C-01',
          lines: [{ productId: 'P-999', quantity: 1 }],
        },
      }),
    );
    const noLines = answer(
      call('POST', BOOKING_API.orders, { body: { customerId: 'C-01' } }),
    );

    expect(unknownCustomer.status).toBe(400);
    expect(unknownProduct).toMatchObject({
      status: 400,
      body: { code: 'invalid-request' },
    });
    expect(noLines.status).toBe(400);
    expect(list().total).toBe(60);
  });

  it.each([
    ['a line that is not an object', [null]],
    ['a product id that is not a string', [{ productId: 7, quantity: 1 }]],
    [
      'a quantity that is not a number',
      [{ productId: 'P-001', quantity: '2' }],
    ],
    [
      'a discount that is not a whole amount',
      [{ productId: 'P-001', quantity: 1, discount: 1.5 }],
    ],
  ])('answers 400, rather than failing, for %s', (_, lines) => {
    const refused = answer(
      call('POST', BOOKING_API.orders, { body: { customerId: 'C-01', lines } }),
    );

    expect(refused).toMatchObject({
      status: 400,
      body: { code: 'invalid-request' },
    });
  });

  it('answers 409 with the domain code when a line breaks a rule', () => {
    const refused = answer(
      call('POST', BOOKING_API.orders, {
        body: {
          customerId: 'C-01',
          lines: [{ productId: 'P-001', quantity: 0 }],
        },
      }),
    );
    const negative = answer(
      call('POST', BOOKING_API.orders, {
        body: {
          customerId: 'C-01',
          lines: [{ productId: 'P-001', quantity: 1, discount: -1000 }],
        },
      }),
    );
    const duplicate = answer(
      call('POST', BOOKING_API.orders, {
        body: {
          customerId: 'C-01',
          lines: [
            { productId: 'P-001', quantity: 1 },
            { productId: 'P-001', quantity: 2 },
          ],
        },
      }),
    );

    expect(refused).toMatchObject({
      status: 409,
      body: { code: 'invalid-quantity' },
    });
    expect(negative).toMatchObject({
      status: 409,
      body: { code: 'negative-discount' },
    });
    expect(duplicate).toMatchObject({
      status: 409,
      body: { code: 'duplicate-line' },
    });
    expect(list().total).toBe(60);
  });
});

describe('POST /api/booking/orders/:id/place', () => {
  it('places the draft, books its slot and publishes OrderPlaced', () => {
    const draft = newDraft();
    const slot = bookableSlot();

    const placed = call('POST', BOOKING_API.place, {
      id: draft.id,
      body: { slotId: slot.id },
    }) as OrderDto;

    expect(placed).toMatchObject({
      status: 'placed',
      slotId: slot.id,
      deliverySlot: { date: slot.date, window: slot.window },
    });
    expect(placed.history.map((h) => h.status)).toEqual(['draft', 'placed']);
    expect(data.slots.find((s) => s.id === slot.id)?.booked).toBe(
      slot.booked + 1,
    );
    expect(published.map((e) => e.type)).toEqual(['OrderPlaced']);
  });

  it('answers 409 slot-full for a full slot, and changes nothing', () => {
    const draft = newDraft();
    const full = data.slots.find(
      (s) => s.booked === s.capacity && s.date > localDate(NOW, 0),
    ) as SlotDto;

    const refused = answer(
      call('POST', BOOKING_API.place, {
        id: draft.id,
        body: { slotId: full.id },
      }),
    );

    expect(refused).toMatchObject({ status: 409, body: { code: 'slot-full' } });
    expect(data.slots.find((s) => s.id === full.id)?.booked).toBe(
      full.capacity,
    );
    expect(
      (call('GET', BOOKING_API.order, { id: draft.id }) as OrderDto).status,
    ).toBe('draft');
    expect(published).toEqual([]);
  });

  it('answers 409 empty-order for a draft without lines', () => {
    const empty = answer(
      call('POST', BOOKING_API.orders, {
        body: { customerId: 'C-01', lines: [] },
      }),
    ).body as OrderDto;

    const refused = answer(
      call('POST', BOOKING_API.place, {
        id: empty.id,
        body: { slotId: bookableSlot().id },
      }),
    );

    expect(refused).toMatchObject({
      status: 409,
      body: { code: 'empty-order' },
    });
  });

  it('answers 400 for an unknown slot and 404 for an unknown order', () => {
    const draft = newDraft();

    expect(
      answer(
        call('POST', BOOKING_API.place, {
          id: draft.id,
          body: { slotId: 'slot-nope' },
        }),
      ).status,
    ).toBe(400);
    expect(
      answer(
        call('POST', BOOKING_API.place, {
          id: 'SO-9999',
          body: { slotId: bookableSlot().id },
        }),
      ).status,
    ).toBe(404);
  });
});

describe('POST /api/booking/orders/:id/confirm and /cancel', () => {
  function placedOrder(): OrderDto {
    const draft = newDraft();
    return call('POST', BOOKING_API.place, {
      id: draft.id,
      body: { slotId: bookableSlot().id },
    }) as OrderDto;
  }

  it('confirms a placed order', () => {
    const order = placedOrder();

    const confirmed = call('POST', BOOKING_API.confirm, {
      id: order.id,
    }) as OrderDto;

    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.history.at(-1)?.status).toBe('confirmed');
  });

  it('answers 409 invalid-transition when confirming a draft, and 404 for an unknown order', () => {
    const draft = newDraft();

    expect(
      answer(call('POST', BOOKING_API.confirm, { id: draft.id })),
    ).toMatchObject({ status: 409, body: { code: 'invalid-transition' } });
    expect(
      answer(call('POST', BOOKING_API.confirm, { id: 'SO-9999' })).status,
    ).toBe(404);
  });

  it('cancels with a reason, frees the slot and publishes OrderCancelled', () => {
    const order = placedOrder();
    const before = data.slots.find((s) => s.id === order.slotId)?.booked ?? 0;

    const cancelled = call('POST', BOOKING_API.cancel, {
      id: order.id,
      body: { reason: 'Wrong address' },
    }) as OrderDto;

    expect(cancelled).toMatchObject({
      status: 'cancelled',
      cancelReason: 'Wrong address',
    });
    expect(data.slots.find((s) => s.id === order.slotId)?.booked).toBe(
      before - 1,
    );
    expect(published.map((e) => e.type)).toEqual([
      'OrderPlaced',
      'OrderCancelled',
    ]);
  });

  it('cancels a draft, which had no slot to free', () => {
    const draft = newDraft();
    const booked = data.slots.map((s) => s.booked);

    const cancelled = call('POST', BOOKING_API.cancel, {
      id: draft.id,
      body: { reason: 'Duplicate' },
    }) as OrderDto;

    expect(cancelled.status).toBe('cancelled');
    expect(data.slots.map((s) => s.booked)).toEqual(booked);
  });

  it('answers 409 reason-required without a reason, and 404 for an unknown order', () => {
    const order = placedOrder();

    const booked = data.slots.find((s) => s.id === order.slotId)?.booked;

    expect(
      answer(call('POST', BOOKING_API.cancel, { id: order.id, body: {} })),
    ).toMatchObject({ status: 409, body: { code: 'reason-required' } });
    expect(data.slots.find((s) => s.id === order.slotId)?.booked).toBe(booked);
    expect(
      answer(
        call('POST', BOOKING_API.cancel, {
          id: 'SO-9999',
          body: { reason: 'x' },
        }),
      ).status,
    ).toBe(404);
  });
});

describe('reference data and the overview', () => {
  it('serves copies of the reference data, so a caller cannot change the seed', () => {
    const customers = call('GET', BOOKING_API.customers) as CustomerDto[];
    customers.length = 0;

    expect(data.customers).toHaveLength(20);
  });

  it('serves the customers and the catalogue', () => {
    expect(call('GET', BOOKING_API.customers) as CustomerDto[]).toHaveLength(
      20,
    );
    expect(call('GET', BOOKING_API.products) as ProductDto[]).toHaveLength(30);
  });

  it('serves the slots from today for 14 days, in order', () => {
    const slots = call('GET', BOOKING_API.slots) as SlotDto[];

    expect(slots).toHaveLength(28);
    expect(slots[0]?.date).toBe(localDate(NOW, 0));
    expect(slots.at(-1)?.date).toBe(localDate(NOW, 13));
  });

  it('counts the figures of the Overview: revenue over seven days, cancellations over 30', () => {
    let clock = NOW;
    data.orders.length = 0;
    data.slots.forEach((slot, i) => (data.slots[i] = { ...slot, booked: 0 }));
    routes = bookingMockRoutes(data, {
      now: () => clock,
      publish: () => undefined,
    });
    const at = (days: number) =>
      new Date(NOW.getTime() - days * 24 * 3600 * 1000);
    const slotAfter = (date: Date) =>
      data.slots.find((s) => s.date > localDate(date, 0)) as SlotDto;
    const placeNew = (days: number) => {
      clock = at(days);
      const draft = newDraft();
      return call('POST', BOOKING_API.place, {
        id: draft.id,
        body: { slotId: slotAfter(clock).id },
      }) as OrderDto;
    };

    placeNew(10); // placed before the week: awaiting, not this week's revenue
    const recent = placeNew(2);
    call('POST', BOOKING_API.confirm, { id: recent.id });
    const cancelled = placeNew(1); // placed this week, but cancelled
    call('POST', BOOKING_API.cancel, {
      id: cancelled.id,
      body: { reason: 'x' },
    });
    clock = NOW;
    newDraft(); // today, a draft: counted today, no revenue

    const overview = call('GET', BOOKING_API.overview) as BookingOverviewDto;

    expect(overview).toMatchObject({
      ordersToday: 1,
      awaitingConfirmation: 1,
      revenueThisWeek: recent.totals.total,
      cancellationRate: 0.25,
    });
    expect(overview.daily).toHaveLength(14);
    expect(overview.daily.at(-1)).toEqual({
      date: localDate(NOW, 0),
      orders: 1,
    });
    expect(
      overview.daily.find((d) => d.date === localDate(at(2), 0))?.orders,
    ).toBe(1);
  });

  it('counts a cancellation rate of zero when nothing was created in 30 days', () => {
    data.orders.length = 0;

    expect(
      (call('GET', BOOKING_API.overview) as BookingOverviewDto)
        .cancellationRate,
    ).toBe(0);
  });
});
