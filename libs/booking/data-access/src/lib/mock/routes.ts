import { money, sum, type Money } from '@angular-saas-kit/shared-kernel';
import {
  addLine,
  cancel,
  confirm,
  createDraft,
  lineNet,
  orderLine,
  orderTotals,
  place,
  releaseSlot,
  type BookingEvent,
  type DomainError,
  type OrderStatus,
  type PlacedOrder,
  type SalesOrder,
  type Transition,
} from '@angular-saas-kit/booking-domain';
import {
  BOOKING_API,
  type BookingErrorBody,
  type BookingErrorCode,
  type BookingOverviewDto,
  type CreateOrderRequest,
  type OrderDto,
  type OrderSummaryDto,
  type Page,
} from '@angular-saas-kit/booking-contracts';
import {
  mockResponse,
  type MockResponse,
  type MockRoute,
} from '@angular-saas-kit/mock-api';

import { localDate, type BookingDataset, type OrderRecord } from './seed';

const DAY = 24 * 60 * 60 * 1000;

export interface BookingBackendOptions {
  /** The clock the rules run on. */
  readonly now: () => Date;
  /** Where the events an operation raised go: the suite's event bus. */
  readonly publish: (event: BookingEvent) => void;
}

function refusal(
  status: number,
  code: BookingErrorCode,
  message: string,
): MockResponse {
  return mockResponse(status, { code, message } satisfies BookingErrorBody);
}

const notFound = (id: string) => refusal(404, 'not-found', `No order ${id}.`);
const invalid = (message: string) => refusal(400, 'invalid-request', message);
/** A business refusal: 409 and the domain's code, as the UI maps it. */
const refused = (error: DomainError) => refusal(409, error.code, error.detail);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

const isOccupying = (order: SalesOrder): order is PlacedOrder =>
  order.status === 'placed' || order.status === 'confirmed';

/**
 * Booking's API, answered from memory by the same domain the UI uses, so the
 * business rules live in one place. Writes change the data for the rest of the
 * session; each state change publishes the events it raised.
 */
export function bookingMockRoutes(
  data: BookingDataset,
  { now, publish }: BookingBackendOptions,
): MockRoute[] {
  const customerName = (id: string) =>
    data.customers.find((customer) => customer.id === id)?.name ?? id;
  const find = (id: string | undefined) =>
    data.orders.find((record) => record.order.id === id);

  function toDto({ order, createdAt, history }: OrderRecord): OrderDto {
    return {
      id: order.id,
      customerId: order.customerId,
      customerName: customerName(order.customerId),
      currency: order.currency,
      status: order.status,
      lines: order.lines.map((line) => ({ ...line, net: lineNet(line) })),
      totals: orderTotals(order),
      createdAt,
      history: [...history],
      ...(order.status === 'draft'
        ? {}
        : { slotId: order.slotId, placedAt: order.placedAt }),
      ...(order.status === 'cancelled'
        ? { cancelReason: order.cancelReason }
        : {}),
    };
  }

  function toSummary({ order, createdAt }: OrderRecord): OrderSummaryDto {
    return {
      id: order.id,
      customerId: order.customerId,
      customerName: customerName(order.customerId),
      status: order.status,
      total: orderTotals(order).total,
      lineCount: order.lines.length,
      createdAt,
      slotId: order.status === 'draft' ? undefined : order.slotId,
    };
  }

  /** Saves a transition's order, records the change and publishes its events. */
  function commit(
    record: OrderRecord,
    transition: Transition,
    status: OrderStatus,
  ): OrderDto {
    record.order = transition.order;
    record.history.push({ status, at: now().toISOString() });
    transition.events.forEach(publish);
    return toDto(record);
  }

  function create(body: unknown): MockResponse {
    const request = body as Partial<CreateOrderRequest> | null;
    if (!data.customers.some((c) => c.id === request?.customerId)) {
      return invalid('Choose a customer from the list.');
    }
    if (!Array.isArray(request?.lines)) return invalid('An order has lines.');
    let order: SalesOrder = createDraft({
      id: `SO-${String(data.nextId).padStart(4, '0')}`,
      customerId: request.customerId as string,
      currency: 'VND',
    });
    for (const input of request.lines) {
      const product = data.products.find((p) => p.id === input.productId);
      if (!product) return invalid(`No product ${input.productId}.`);
      const line = orderLine({
        productId: product.id,
        name: product.name,
        quantity: input.quantity,
        unitPrice: product.unitPrice,
        discount: money(input.discount ?? 0, order.currency),
        vatRate: product.vatRate,
      });
      if (!line.ok) return refused(line.error);
      const added = addLine(order, line.value);
      if (!added.ok) return refused(added.error);
      order = added.value;
    }
    const createdAt = now().toISOString();
    const record: OrderRecord = {
      order,
      createdAt,
      history: [{ status: 'draft', at: createdAt }],
    };
    data.orders.push(record);
    data.nextId += 1;
    return mockResponse(201, toDto(record));
  }

  function overview(): BookingOverviewDto {
    const today = now();
    const createdOn = (date: string) =>
      data.orders.filter(
        (record) => localDate(new Date(record.createdAt), 0) === date,
      ).length;
    const weekAgo = today.getTime() - 7 * DAY;
    const monthAgo = today.getTime() - 30 * DAY;
    const recent = data.orders.filter(
      (record) => Date.parse(record.createdAt) >= monthAgo,
    );
    const revenue: Money[] = data.orders
      .filter(
        ({ order }) =>
          isOccupying(order) && Date.parse(order.placedAt) >= weekAgo,
      )
      .map(({ order }) => orderTotals(order).total);
    return {
      ordersToday: createdOn(localDate(today, 0)),
      awaitingConfirmation: data.orders.filter(
        ({ order }) => order.status === 'placed',
      ).length,
      revenueThisWeek: sum(revenue, 'VND'),
      cancellationRate:
        recent.length === 0
          ? 0
          : recent.filter(({ order }) => order.status === 'cancelled').length /
            recent.length,
      daily: Array.from({ length: 14 }, (_, i) => {
        const date = localDate(today, i - 13);
        return { date, orders: createdOn(date) };
      }),
    };
  }

  return [
    {
      method: 'GET',
      path: BOOKING_API.orders,
      handler: ({ query }) => {
        const status = query.get('status');
        const q = query.get('q')?.trim().toLowerCase() ?? '';
        const matching = data.orders.filter(
          (record) =>
            (!status || record.order.status === status) &&
            (!q ||
              record.order.id.toLowerCase().includes(q) ||
              customerName(record.order.customerId).toLowerCase().includes(q)),
        );
        return paginate(matching.map(toSummary).reverse(), query);
      },
    },
    {
      method: 'GET',
      path: BOOKING_API.order,
      handler: ({ params }) => {
        const record = find(params['id']);
        return record ? toDto(record) : notFound(params['id'] ?? '');
      },
    },
    {
      method: 'POST',
      path: BOOKING_API.orders,
      handler: ({ body }) => create(body),
    },
    {
      method: 'POST',
      path: BOOKING_API.place,
      handler: ({ params, body }) => {
        const record = find(params['id']);
        if (!record) return notFound(params['id'] ?? '');
        const slotId = (body as { slotId?: unknown } | null)?.slotId;
        const index = data.slots.findIndex((slot) => slot.id === slotId);
        const slot = data.slots[index];
        if (!slot) return invalid('Choose a delivery slot from the list.');
        const placed = place(record.order, slot, now());
        if (!placed.ok) return refused(placed.error);
        data.slots[index] = placed.value.slot;
        return commit(record, placed.value, 'placed');
      },
    },
    {
      method: 'POST',
      path: BOOKING_API.confirm,
      handler: ({ params }) => {
        const record = find(params['id']);
        if (!record) return notFound(params['id'] ?? '');
        const confirmed = confirm(record.order);
        return confirmed.ok
          ? commit(record, confirmed.value, 'confirmed')
          : refused(confirmed.error);
      },
    },
    {
      method: 'POST',
      path: BOOKING_API.cancel,
      handler: ({ params, body }) => {
        const record = find(params['id']);
        if (!record) return notFound(params['id'] ?? '');
        const reason = (body as { reason?: unknown } | null)?.reason;
        const cancelled = cancel(
          record.order,
          typeof reason === 'string' ? reason : '',
          now(),
        );
        if (!cancelled.ok) return refused(cancelled.error);
        const freed = cancelled.value.events[0]?.payload.slotId;
        const index = data.slots.findIndex((slot) => slot.id === freed);
        const slot = data.slots[index];
        if (slot) data.slots[index] = releaseSlot(slot);
        return commit(record, cancelled.value, 'cancelled');
      },
    },
    {
      method: 'GET',
      path: BOOKING_API.customers,
      handler: () => data.customers,
    },
    { method: 'GET', path: BOOKING_API.products, handler: () => data.products },
    {
      method: 'GET',
      path: BOOKING_API.slots,
      handler: () => {
        const first = localDate(now(), 0);
        const last = localDate(now(), 13);
        return data.slots.filter(
          (slot) => slot.date >= first && slot.date <= last,
        );
      },
    },
    { method: 'GET', path: BOOKING_API.overview, handler: overview },
  ];
}
