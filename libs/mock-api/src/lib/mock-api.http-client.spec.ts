import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { MOCK_LATENCY_MIN_MS } from './latency';
import {
  MOCK_ROUTES,
  mockApiInterceptor,
  registerMockRoutes,
} from './mock-api.interceptor';

interface Order {
  id: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: '1', total: 10 },
  { id: '2', total: 25 },
];

/**
 * The interceptor the way an app wires it: through HttpClient, not called by
 * hand. docs/guide/mock-api.md shows this setup, so these tests pin what it
 * promises.
 */
describe('mockApiInterceptor through HttpClient', () => {
  afterEach(() => {
    MOCK_ROUTES.length = 0;
  });

  function client(): HttpClient {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([mockApiInterceptor])),
      ],
    });
    return TestBed.inject(HttpClient);
  }

  it('serves lists, path params and request bodies', async () => {
    registerMockRoutes(
      { method: 'GET', path: '/api/orders', handler: () => ORDERS },
      {
        method: 'GET',
        path: '/api/orders/:id',
        handler: ({ params }) => ORDERS.find((o) => o.id === params['id']),
      },
      {
        method: 'POST',
        path: '/api/orders',
        handler: ({ body }) => ({ ...(body as object), id: '3' }),
      },
    );
    const http = client();

    const [list, one, created] = await Promise.all([
      firstValueFrom(http.get<Order[]>('/api/orders')),
      firstValueFrom(http.get<Order>('/api/orders/2')),
      firstValueFrom(http.post<Order>('/api/orders', { total: 5 })),
    ]);

    expect(list).toEqual(ORDERS);
    expect(one).toEqual({ id: '2', total: 25 });
    expect(created).toEqual({ total: 5, id: '3' });
  });

  it('hands the handler the query, from the URL or from params alike', async () => {
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders',
      handler: ({ query }) => ({
        page: query.get('page'),
        status: query.get('status'),
      }),
    });
    const http = client();

    const [inUrl, inParams, both] = await Promise.all([
      firstValueFrom(http.get('/api/orders?page=2&status=paid')),
      // The way an app usually passes them: HttpClient keeps these out of
      // `req.url`, so an interceptor that reads only the URL never sees them.
      firstValueFrom(
        http.get('/api/orders', { params: { page: 2, status: 'paid' } }),
      ),
      firstValueFrom(
        http.get('/api/orders?page=2', { params: { status: 'paid' } }),
      ),
    ]);

    expect(inUrl).toEqual({ page: '2', status: 'paid' });
    expect(inParams).toEqual({ page: '2', status: 'paid' });
    expect(both).toEqual({ page: '2', status: 'paid' });
  });

  it('waits at least the minimum latency before answering', async () => {
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders',
      handler: () => ORDERS,
    });
    const http = client();

    const started = performance.now();
    await firstValueFrom(http.get('/api/orders'));

    // Timers can fire a few milliseconds early.
    expect(performance.now() - started).toBeGreaterThanOrEqual(
      MOCK_LATENCY_MIN_MS - 10,
    );
  });

  it('turns an exception in a handler into the request error', async () => {
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders/:id',
      handler: () => {
        throw new Error('not found');
      },
    });

    await expect(
      firstValueFrom(client().get('/api/orders/99')),
    ).rejects.toThrow('not found');
  });
});
