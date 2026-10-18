import {
  HttpErrorResponse,
  HttpRequest,
  type HttpEvent,
} from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MOCK_ROUTES,
  mockApiInterceptor,
  mockResponse,
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

  it('answers a path param it cannot decode with 400, reaching neither the handler nor the backend', async () => {
    const handler = vi.fn(() => ({}));
    registerMockRoutes({ method: 'GET', path: '/api/orders/:id', handler });
    const next = passthrough();

    const error = await firstValueFrom(
      mockApiInterceptor(new HttpRequest('GET', '/api/orders/%E0%A4%A'), next),
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('passes a path through when a static segment after a bad param does not match', async () => {
    const handler = vi.fn(() => ({}));
    registerMockRoutes({ method: 'GET', path: '/api/:id/items', handler });
    const next = passthrough();

    await firstValueFrom(
      mockApiInterceptor(new HttpRequest('GET', '/api/%E0/other'), next),
    );

    expect(next).toHaveBeenCalledOnce();
    expect(handler).not.toHaveBeenCalled();
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

  it('answers with the 2xx status a handler gives, and its body', async () => {
    registerMockRoutes({
      method: 'POST',
      path: '/api/orders',
      handler: () => mockResponse(201, { id: 'SO-0001' }),
    });

    const response = await firstValueFrom(
      mockApiInterceptor(
        new HttpRequest('POST', '/api/orders', {}),
        passthrough(),
      ),
    );

    expect(response).toMatchObject({ status: 201, body: { id: 'SO-0001' } });
  });

  it('answers a 4xx or 5xx status a handler gives as an error carrying its body', async () => {
    registerMockRoutes({
      method: 'POST',
      path: '/api/orders/:id/place',
      handler: () => mockResponse(409, { code: 'slot-full' }),
    });

    const error = await firstValueFrom(
      mockApiInterceptor(
        new HttpRequest('POST', '/api/orders/SO-0001/place', {}),
        passthrough(),
      ),
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(409);
    expect((error as HttpErrorResponse).statusText).toBe('Conflict');
    expect((error as HttpErrorResponse).error).toEqual({ code: 'slot-full' });
  });

  it('refuses a status outside 200 to 599', () => {
    expect(() => mockResponse(99, null)).toThrow(RangeError);
    expect(() => mockResponse(600, null)).toThrow(RangeError);
    expect(() => mockResponse(201.5, null)).toThrow(RangeError);
  });

  it('delays an error answer like a success, so a refusal is not instant', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    registerMockRoutes({
      method: 'POST',
      path: '/api/orders',
      handler: () => mockResponse(409, { code: 'slot-full' }),
    });
    const errors: unknown[] = [];

    try {
      mockApiInterceptor(
        new HttpRequest('POST', '/api/orders', {}),
        passthrough(),
      ).subscribe({ error: (error: unknown) => errors.push(error) });
      vi.advanceTimersByTime(199);
      expect(errors).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(errors).toHaveLength(1);
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});
