import { HttpRequest, type HttpEvent } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MOCK_ROUTES,
  mockApiInterceptor,
  registerMockRoutes,
} from './mock-api.interceptor';

function reset(): void {
  MOCK_ROUTES.length = 0;
}

/** Minimal `next` that records whether the request fell through. */
function passthrough() {
  const spy = vi.fn(() => of({} as HttpEvent<unknown>));
  return spy;
}

describe('mockApiInterceptor', () => {
  afterEach(reset);

  it('passes an unmatched request through to the real backend', async () => {
    const next = passthrough();
    const req = new HttpRequest('GET', '/api/unknown');

    await firstValueFrom(mockApiInterceptor(req, next));

    expect(next).toHaveBeenCalledOnce();
  });

  it('serves a matched route without hitting the backend', async () => {
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders',
      handler: () => [{ id: 1 }],
    });
    const next = passthrough();

    const response = await firstValueFrom(
      mockApiInterceptor(new HttpRequest('GET', '/api/orders'), next),
    );

    expect(next).not.toHaveBeenCalled();
    expect(response).toMatchObject({ status: 200, body: [{ id: 1 }] });
  });

  it('matches on method as well as path', async () => {
    registerMockRoutes({
      method: 'POST',
      path: '/api/orders',
      handler: () => ({ created: true }),
    });
    const next = passthrough();

    await firstValueFrom(
      mockApiInterceptor(new HttpRequest('GET', '/api/orders'), next),
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('extracts path params', async () => {
    const seen: Record<string, string>[] = [];
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders/:id',
      handler: ({ params }) => {
        seen.push(params);
        return {};
      },
    });

    await firstValueFrom(
      mockApiInterceptor(
        new HttpRequest('GET', '/api/orders/42'),
        passthrough(),
      ),
    );

    expect(seen).toEqual([{ id: '42' }]);
  });

  it('decodes an encoded path param', async () => {
    const seen: Record<string, string>[] = [];
    registerMockRoutes({
      method: 'GET',
      path: '/api/customers/:name',
      handler: ({ params }) => {
        seen.push(params);
        return {};
      },
    });

    await firstValueFrom(
      mockApiInterceptor(
        new HttpRequest('GET', '/api/customers/a%20b'),
        passthrough(),
      ),
    );

    expect(seen).toEqual([{ name: 'a b' }]);
  });

  it('exposes query params to the handler', async () => {
    const pages: (string | null)[] = [];
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders',
      handler: ({ query }) => {
        pages.push(query.get('page'));
        return {};
      },
    });

    await firstValueFrom(
      mockApiInterceptor(
        new HttpRequest('GET', '/api/orders?page=3'),
        passthrough(),
      ),
    );

    expect(pages).toEqual(['3']);
  });

  it('does not match when the segment count differs', async () => {
    registerMockRoutes({
      method: 'GET',
      path: '/api/orders/:id',
      handler: () => ({}),
    });
    const next = passthrough();

    await firstValueFrom(
      mockApiInterceptor(new HttpRequest('GET', '/api/orders/42/items'), next),
    );

    expect(next).toHaveBeenCalledOnce();
  });
});
