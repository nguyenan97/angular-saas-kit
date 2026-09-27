import { HttpErrorResponse } from '@angular/common/http';
import type { MockRoute } from '@angular-saas-kit/mock-api';

import {
  type Customer,
  type DailyTotal,
  type Kpi,
  type NotificationSettings,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
  type OverviewStats,
  type Page,
  type Product,
  type Profile,
  TIME_ZONES,
} from '../data/models';
import { type Dataset, startOfDay } from './seed';

const DAY = 24 * 60 * 60 * 1000;

type SortKeys<T> = Record<string, (item: T) => string | number>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** `page` and `pageSize` from the query, held to what exists, as a real API would. */
function paginate<T>(items: readonly T[], query: URLSearchParams): Page<T> {
  const pageSize = clamp(
    Math.trunc(Number(query.get('pageSize'))) || 10,
    1,
    50,
  );
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = clamp(Math.trunc(Number(query.get('page'))) || 1, 1, pages);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

/**
 * Sorts by `sort` and `dir` from the query when `sort` names a known key,
 * and by the resource's own default otherwise.
 */
function sorted<T>(
  items: readonly T[],
  query: URLSearchParams,
  keys: SortKeys<T>,
  fallback: { readonly key: string; readonly dir: 'asc' | 'desc' },
): T[] {
  const requested = query.get('sort') ?? '';
  const key = requested in keys ? requested : fallback.key;
  const dir = requested in keys ? query.get('dir') : fallback.dir;
  const value = keys[key] as (item: T) => string | number;
  const sign = dir === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const [x, y] = [value(a), value(b)];
    return (
      sign *
      (typeof x === 'string' && typeof y === 'string'
        ? x.localeCompare(y)
        : Number(x) - Number(y))
    );
  });
}

/** True when any of the fields contains the `q` search, ignoring case. */
function matches(query: URLSearchParams, ...fields: string[]): boolean {
  const q = query.get('q')?.trim().toLowerCase();
  return !q || fields.some((field) => field.toLowerCase().includes(q));
}

/** A 400 that names the field at fault, as a form wants it. */
function invalid(field: string, message: string): never {
  throw new HttpErrorResponse({
    status: 400,
    statusText: 'Bad Request',
    error: { field, message },
  });
}

function notFound(what: string): never {
  throw new HttpErrorResponse({
    status: 404,
    statusText: 'Not Found',
    error: { message: `No ${what}.` },
  });
}

const ORDER_SORT: SortKeys<Order> = {
  id: (order) => order.id,
  customer: (order) => order.customer,
  placedAt: (order) => order.placedAt,
  items: (order) => order.items,
  totalCents: (order) => order.totalCents,
  status: (order) => order.status,
};

const CUSTOMER_SORT: SortKeys<Customer> = {
  name: (customer) => customer.name,
  country: (customer) => customer.country,
  joinedAt: (customer) => customer.joinedAt,
  orders: (customer) => customer.orders,
  spentCents: (customer) => customer.spentCents,
};

const PRODUCT_SORT: SortKeys<Product> = {
  name: (product) => product.name,
  category: (product) => product.category,
  priceCents: (product) => product.priceCents,
  stock: (product) => product.stock,
};

/** The last 30 days against the 30 before, and a total for each of the last 30. */
export function overview(data: Dataset, today: Date): OverviewStats {
  const end = startOfDay(today).getTime() + DAY;
  const between = (from: number, to: number) =>
    data.orders.filter((order) => {
      const at = Date.parse(order.placedAt);
      return at >= from && at < to;
    });
  const revenue = (orders: readonly Order[]) =>
    orders
      .filter((order) => order.status === 'paid')
      .reduce((sum, order) => sum + order.totalCents, 0);
  const customers = (orders: readonly Order[]) =>
    new Set(orders.map((order) => order.customerId)).size;
  const refundRate = (orders: readonly Order[]) =>
    orders.length === 0
      ? 0
      : orders.filter((order) => order.status === 'refunded').length /
        orders.length;
  const relative = (now: number, before: number) =>
    before === 0 ? 0 : (now - before) / before;

  const current = between(end - 30 * DAY, end);
  const previous = between(end - 60 * DAY, end - 30 * DAY);

  const kpis: Kpi[] = [
    {
      key: 'revenue',
      label: 'Revenue',
      value: revenue(current),
      format: 'money',
      change: relative(revenue(current), revenue(previous)),
      better: 'up',
    },
    {
      key: 'orders',
      label: 'Orders',
      value: current.length,
      format: 'count',
      change: relative(current.length, previous.length),
      better: 'up',
    },
    {
      key: 'customers',
      label: 'Active customers',
      value: customers(current),
      format: 'count',
      change: relative(customers(current), customers(previous)),
      better: 'up',
    },
    {
      key: 'refundRate',
      label: 'Refund rate',
      value: refundRate(current),
      format: 'percent',
      // A rate changes by points, not by a percentage of itself.
      change: refundRate(current) - refundRate(previous),
      better: 'down',
    },
  ];

  const daily: DailyTotal[] = Array.from({ length: 30 }, (_, i) => {
    const from = end - (30 - i) * DAY;
    const orders = between(from, from + DAY);
    return {
      date: new Date(from).toISOString(),
      revenueCents: revenue(orders),
      orders: orders.length,
    };
  });

  return { kpis, daily };
}

/**
 * The dashboard's API, answered from memory. Lists take `q`, `sort`, `dir`,
 * `page` and `pageSize`; orders also take `status`. Writes change the data
 * for the rest of the session, as a real backend would.
 */
export function mockRoutes(data: Dataset, today: Date): MockRoute[] {
  return [
    { method: 'GET', path: '/api/stats', handler: () => overview(data, today) },
    {
      method: 'GET',
      path: '/api/orders',
      handler: ({ query }) => {
        const status = query.get('status');
        const orders = data.orders.filter(
          (order) =>
            (!status || order.status === status) &&
            matches(query, order.id, order.customer, order.email),
        );
        return paginate(
          sorted(orders, query, ORDER_SORT, { key: 'placedAt', dir: 'desc' }),
          query,
        );
      },
    },
    {
      method: 'GET',
      path: '/api/orders/:id',
      handler: ({ params }) =>
        data.orders.find((order) => order.id === params['id']) ??
        notFound('such order'),
    },
    {
      method: 'PATCH',
      path: '/api/orders/:id',
      handler: ({ params, body }) => {
        const index = data.orders.findIndex(
          (order) => order.id === params['id'],
        );
        const order = data.orders[index] ?? notFound('such order');
        const status = (body as { status?: OrderStatus } | null)?.status;
        if (!status || !ORDER_STATUSES.includes(status)) {
          throw new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { message: 'Unknown status.' },
          });
        }
        if (status === 'refunded' && order.status !== 'paid') {
          throw new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: { message: 'Only a paid order can be refunded.' },
          });
        }
        const updated: Order = { ...order, status };
        data.orders[index] = updated;
        return updated;
      },
    },
    {
      method: 'GET',
      path: '/api/customers',
      handler: ({ query }) =>
        paginate(
          sorted(
            data.customers.filter((customer) =>
              matches(query, customer.name, customer.email, customer.country),
            ),
            query,
            CUSTOMER_SORT,
            { key: 'name', dir: 'asc' },
          ),
          query,
        ),
    },
    {
      method: 'GET',
      path: '/api/products',
      handler: ({ query }) => {
        const status = query.get('status');
        return paginate(
          sorted(
            data.products.filter(
              (product) =>
                (!status || product.status === status) &&
                matches(query, product.name, product.sku, product.category),
            ),
            query,
            PRODUCT_SORT,
            { key: 'name', dir: 'asc' },
          ),
          query,
        );
      },
    },
    { method: 'GET', path: '/api/profile', handler: () => data.profile },
    {
      method: 'PUT',
      path: '/api/profile',
      handler: ({ body }) => {
        const next = body as Partial<Profile> | null;
        const name = next?.name?.trim() ?? '';
        const email = next?.email?.trim() ?? '';
        if (!name) {
          invalid('name', 'Enter your name.');
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          invalid('email', 'Enter an email address like name@example.com.');
        }
        const timeZone = next?.timeZone ?? 'UTC';
        if (!TIME_ZONES.includes(timeZone)) {
          invalid('timeZone', 'Choose a time zone from the list.');
        }
        data.profile = {
          name,
          email,
          company: next?.company?.trim() ?? '',
          timeZone,
        };
        return data.profile;
      },
    },
    {
      method: 'GET',
      path: '/api/notifications',
      handler: () => data.notifications,
    },
    {
      method: 'PUT',
      path: '/api/notifications',
      handler: ({ body }) => {
        const next = body as Partial<NotificationSettings> | null;
        data.notifications = {
          orders: next?.orders === true,
          weeklySummary: next?.weeklySummary === true,
          productNews: next?.productNews === true,
        };
        return data.notifications;
      },
    },
  ];
}
