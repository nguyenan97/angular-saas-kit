import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { OrderDto } from '@angular-saas-kit/booking-contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { toFailure } from './failure';
import { OrdersStore } from './orders.store';

let store: OrdersStore;
let http: HttpTestingController;

const order = (overrides: Partial<OrderDto> = {}) =>
  ({ id: 'SO-0061', status: 'draft', ...overrides }) as OrderDto;

/** Lets the store's awaited request finish, so it sends the next one. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

const REQUEST = {
  customerId: 'C-01',
  lines: [{ productId: 'P-001', quantity: 2 }],
};

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), OrdersStore],
  });
  store = TestBed.inject(OrdersStore);
  http = TestBed.inject(HttpTestingController);
});

afterEach(() => http.verify());

const conflict = (code: string) =>
  ({
    status: 409,
    statusText: 'Conflict',
    body: { code, message: code },
  }) as const;

describe('OrdersStore', () => {
  it('loads an order, and says it is loading meanwhile', async () => {
    const loading = store.load('SO-0001');
    expect(store.loading()).toBe(true);

    http
      .expectOne('/api/booking/orders/SO-0001')
      .flush(order({ id: 'SO-0001' }));
    await loading;

    expect(store.loading()).toBe(false);
    expect(store.order()?.id).toBe('SO-0001');
    expect(store.failure()).toBeNull();
  });

  it('keeps a network or server failure apart from a business refusal', async () => {
    const loading = store.load('SO-0001');

    http
      .expectOne('/api/booking/orders/SO-0001')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await loading;

    expect(store.failure()).toEqual({ kind: 'network', status: 503 });
    expect(store.loading()).toBe(false);
  });

  it('places a new order: creates the draft, then places it in the slot', async () => {
    const placing = store.placeNew(REQUEST, 'slot-a');
    expect(store.saving()).toBe(true);

    http
      .expectOne('/api/booking/orders')
      .flush(order(), { status: 201, statusText: 'Created' });
    await settle();
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(order({ status: 'placed', slotId: 'slot-a' }));

    expect((await placing)?.status).toBe('placed');
    expect(store.saving()).toBe(false);
    expect(store.order()?.status).toBe('placed');
  });

  it('keeps the draft when placing is refused, and places that same draft on the next try', async () => {
    const first = store.placeNew(REQUEST, 'slot-full');
    http
      .expectOne('/api/booking/orders')
      .flush(order(), { status: 201, statusText: 'Created' });
    await settle();
    const { status, statusText, body } = conflict('slot-full');
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(body, { status, statusText });

    expect(await first).toBeUndefined();
    expect(store.failure()).toEqual({
      kind: 'business',
      code: 'slot-full',
      message: 'slot-full',
    });
    expect(store.order()?.status).toBe('draft');

    const second = store.placeNew(REQUEST, 'slot-b');
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(order({ status: 'placed', slotId: 'slot-b' }));

    expect((await second)?.slotId).toBe('slot-b');
    expect(store.failure()).toBeNull();
  });

  it('creates a new draft when the lines changed since the refused one', async () => {
    const first = store.placeNew(REQUEST, 'slot-full');
    http
      .expectOne('/api/booking/orders')
      .flush(order(), { status: 201, statusText: 'Created' });
    await settle();
    const { status, statusText, body } = conflict('slot-full');
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(body, { status, statusText });
    await first;

    store.placeNew(
      { ...REQUEST, lines: [{ productId: 'P-002', quantity: 1 }] },
      'slot-b',
    );

    http
      .expectOne('/api/booking/orders')
      .flush(order({ id: 'SO-0062' }), { status: 201, statusText: 'Created' });
    await settle();
    http
      .expectOne('/api/booking/orders/SO-0062/place')
      .flush(order({ status: 'placed' }));
  });

  it('reports a refused draft and does not try to place it', async () => {
    const placing = store.placeNew(REQUEST, 'slot-a');
    const { status, statusText, body } = conflict('invalid-quantity');
    http.expectOne('/api/booking/orders').flush(body, { status, statusText });

    expect(await placing).toBeUndefined();
    expect(store.failure()).toMatchObject({ code: 'invalid-quantity' });
    expect(store.saving()).toBe(false);
  });

  it('confirms the current order', async () => {
    const loading = store.load('SO-0001');
    http
      .expectOne('/api/booking/orders/SO-0001')
      .flush(order({ id: 'SO-0001', status: 'placed' }));
    await loading;

    const confirming = store.confirm();
    http
      .expectOne('/api/booking/orders/SO-0001/confirm')
      .flush(order({ id: 'SO-0001', status: 'confirmed' }));

    expect(await confirming).toBe(true);
    expect(store.order()?.status).toBe('confirmed');
  });

  it('cancels the current order with a reason, and reports a refusal', async () => {
    const loading = store.load('SO-0001');
    http
      .expectOne('/api/booking/orders/SO-0001')
      .flush(order({ id: 'SO-0001', status: 'placed' }));
    await loading;

    const refused = store.cancel('');
    const { status, statusText, body } = conflict('reason-required');
    http
      .expectOne('/api/booking/orders/SO-0001/cancel')
      .flush(body, { status, statusText });
    expect(await refused).toBe(false);
    expect(store.failure()).toMatchObject({ code: 'reason-required' });

    const cancelling = store.cancel('Wrong address');
    const req = http.expectOne('/api/booking/orders/SO-0001/cancel');
    expect(req.request.body).toEqual({ reason: 'Wrong address' });
    req.flush(order({ id: 'SO-0001', status: 'cancelled' }));

    expect(await cancelling).toBe(true);
    expect(store.order()?.status).toBe('cancelled');
    expect(store.failure()).toBeNull();
  });

  it('does nothing to confirm or cancel before an order is loaded', async () => {
    expect(await store.confirm()).toBe(false);
    expect(await store.cancel('x')).toBe(false);
  });

  it('forgets a failure on request', async () => {
    const loading = store.load('SO-0001');
    http
      .expectOne('/api/booking/orders/SO-0001')
      .flush(null, { status: 500, statusText: 'Error' });
    await loading;

    store.clearFailure();

    expect(store.failure()).toBeNull();
  });
});

describe('toFailure', () => {
  it('reads a 4xx with a code as a business refusal', () => {
    expect(
      toFailure(
        new HttpErrorResponse({
          status: 404,
          error: { code: 'not-found', message: 'No order.' },
        }),
      ),
    ).toEqual({ kind: 'business', code: 'not-found', message: 'No order.' });
  });

  it('reads anything else as a network failure: no answer, a 5xx, a 4xx without a code, not HTTP at all', () => {
    expect(toFailure(new HttpErrorResponse({ status: 0 }))).toEqual({
      kind: 'network',
      status: 0,
    });
    expect(
      toFailure(new HttpErrorResponse({ status: 500, error: { code: 'x' } })),
    ).toEqual({
      kind: 'network',
      status: 500,
    });
    expect(
      toFailure(new HttpErrorResponse({ status: 400, error: 'Bad' })),
    ).toEqual({
      kind: 'network',
      status: 400,
    });
    expect(toFailure(new Error('boom'))).toEqual({
      kind: 'network',
      status: 0,
    });
  });
});
