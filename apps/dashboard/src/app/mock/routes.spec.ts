import { type HttpErrorResponse } from '@angular/common/http';
import type { MockRoute } from '@angular-saas-kit/mock-api';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  Customer,
  Order,
  OverviewStats,
  Page,
  Product,
} from '../data/models';
import { mockRoutes } from './routes';
import { type Dataset, createDataset } from './seed';

const TODAY = new Date('2026-09-27T10:00:00Z');

let data: Dataset;
let routes: MockRoute[];

beforeEach(() => {
  data = createDataset(TODAY);
  routes = mockRoutes(data, TODAY);
});

/** Calls a handler the way the interceptor would, by its method and path pattern. */
function call<T>(
  method: MockRoute['method'],
  path: string,
  { query = '', params = {}, body = null as unknown } = {},
): T {
  const route = routes.find((r) => r.method === method && r.path === path);
  if (!route) {
    throw new Error(`No route ${method} ${path}`);
  }
  return route.handler({
    params,
    query: new URLSearchParams(query),
    body,
  }) as T;
}

function thrown(run: () => unknown): HttpErrorResponse {
  try {
    run();
  } catch (error) {
    return error as HttpErrorResponse;
  }
  throw new Error('Expected the handler to fail');
}

describe('the demo dataset', () => {
  it('is the same on every load', () => {
    expect(createDataset(TODAY)).toEqual(createDataset(TODAY));
  });

  it('covers the 90 days up to today, and uses only example.com addresses', () => {
    const times = data.orders.map((order) => Date.parse(order.placedAt));
    const endOfToday = Date.parse('2026-09-28T00:00:00Z');

    expect(Math.max(...times)).toBeLessThan(endOfToday);
    expect(Math.min(...times)).toBeGreaterThanOrEqual(
      endOfToday - 90 * 24 * 60 * 60 * 1000,
    );
    expect(data.customers.every((c) => c.email.endsWith('@example.com'))).toBe(
      true,
    );
  });

  it('adds each order up from its lines', () => {
    for (const order of data.orders) {
      expect(order.totalCents).toBe(
        order.lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0),
      );
    }
  });
});

describe('GET /api/orders', () => {
  it('pages newest first by default', () => {
    const page = call<Page<Order>>('GET', '/api/orders', {
      query: 'pageSize=5',
    });

    expect(page.items).toHaveLength(5);
    expect(page.total).toBe(data.orders.length);
    const dates = page.items.map((order) => order.placedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('holds page and pageSize to what exists', () => {
    const page = call<Page<Order>>('GET', '/api/orders', {
      query: 'page=999&pageSize=500',
    });

    expect(page.pageSize).toBe(50);
    expect(page.page).toBe(Math.ceil(data.orders.length / 50));
  });

  it('filters by status and searches id, customer and email', () => {
    const refunded = call<Page<Order>>('GET', '/api/orders', {
      query: 'status=refunded&pageSize=50',
    });
    expect(refunded.items.every((order) => order.status === 'refunded')).toBe(
      true,
    );

    const first = data.orders[0] as Order;
    const found = call<Page<Order>>('GET', '/api/orders', {
      query: `q=${first.id.toLowerCase()}`,
    });
    expect(found.items.map((order) => order.id)).toEqual([first.id]);
  });

  it('sorts by a known column in the asked direction', () => {
    const page = call<Page<Order>>('GET', '/api/orders', {
      query: 'sort=totalCents&dir=asc&pageSize=50',
    });
    const totals = page.items.map((order) => order.totalCents);

    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });
});

describe('GET and PATCH /api/orders/:id', () => {
  it('finds an order, or answers 404', () => {
    const first = data.orders[0] as Order;

    expect(
      call<Order>('GET', '/api/orders/:id', { params: { id: first.id } }),
    ).toEqual(first);
    expect(
      thrown(() => call('GET', '/api/orders/:id', { params: { id: 'ORD-0' } }))
        .status,
    ).toBe(404);
  });

  it('refunds a paid order, and remembers it', () => {
    const paid = data.orders.find((order) => order.status === 'paid') as Order;

    const updated = call<Order>('PATCH', '/api/orders/:id', {
      params: { id: paid.id },
      body: { status: 'refunded' },
    });

    expect(updated.status).toBe('refunded');
    expect(
      call<Order>('GET', '/api/orders/:id', { params: { id: paid.id } }).status,
    ).toBe('refunded');
  });

  it('refuses to refund an order that was not paid, or an unknown status', () => {
    const pending = data.orders.find(
      (order) => order.status === 'pending',
    ) as Order;

    expect(
      thrown(() =>
        call('PATCH', '/api/orders/:id', {
          params: { id: pending.id },
          body: { status: 'refunded' },
        }),
      ).status,
    ).toBe(409);
    expect(
      thrown(() =>
        call('PATCH', '/api/orders/:id', {
          params: { id: pending.id },
          body: { status: 'shipped' },
        }),
      ).status,
    ).toBe(400);
  });
});

describe('GET /api/customers and /api/products', () => {
  it('lists customers by name, with what they have ordered', () => {
    const page = call<Page<Customer>>('GET', '/api/customers', {
      query: 'pageSize=50',
    });
    const names = page.items.map((customer) => customer.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(page.items.reduce((sum, c) => sum + c.orders, 0)).toBe(
      data.orders.length,
    );
  });

  it('filters products by status', () => {
    const drafts = call<Page<Product>>('GET', '/api/products', {
      query: 'status=draft',
    });

    expect(drafts.items.length).toBeGreaterThan(0);
    expect(drafts.items.every((product) => product.status === 'draft')).toBe(
      true,
    );
  });
});

describe('GET /api/stats', () => {
  it('adds up the last 30 days from the orders themselves', () => {
    const stats = call<OverviewStats>('GET', '/api/stats');
    const revenue = stats.kpis.find((kpi) => kpi.key === 'revenue');

    expect(stats.daily).toHaveLength(30);
    expect(stats.daily.at(-1)?.date.slice(0, 10)).toBe('2026-09-27');
    expect(revenue?.value).toBe(
      stats.daily.reduce((sum, day) => sum + day.revenueCents, 0),
    );
    expect(stats.kpis.find((kpi) => kpi.key === 'orders')?.value).toBe(
      stats.daily.reduce((sum, day) => sum + day.orders, 0),
    );
  });

  it('says which way is good news for each figure', () => {
    const stats = call<OverviewStats>('GET', '/api/stats');

    expect(stats.kpis.map((kpi) => [kpi.key, kpi.better])).toEqual([
      ['revenue', 'up'],
      ['orders', 'up'],
      ['customers', 'up'],
      ['refundRate', 'down'],
    ]);
  });
});
