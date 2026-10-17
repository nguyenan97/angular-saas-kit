import {
  domainEvent,
  err,
  ok,
  type Currency,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { bookSlot, isBookable, type DeliverySlot } from './delivery-slot';
import { domainError, type DomainError } from './errors';
import type { BookingEvent, OrderCancelled, OrderPlaced } from './events';
import { orderLine, type OrderLine } from './order-line';
import { orderTotals } from './totals';

interface SalesOrderBase {
  readonly id: string;
  readonly customerId: string;
  readonly currency: Currency;
  readonly lines: readonly OrderLine[];
}

export interface DraftOrder extends SalesOrderBase {
  readonly status: 'draft';
}

export interface PlacedOrder extends SalesOrderBase {
  readonly status: 'placed' | 'confirmed';
  readonly slotId: string;
  /** ISO 8601. */
  readonly placedAt: string;
}

/**
 * A cancelled order keeps the slot and placement time it had, for history, so
 * a read model such as booked-per-slot must skip cancelled orders.
 */
export interface CancelledOrder extends SalesOrderBase {
  readonly status: 'cancelled';
  readonly cancelReason: string;
  readonly slotId?: string;
  readonly placedAt?: string;
}

/**
 * The aggregate root. Build it only through the factories and operations in
 * this library, or validate it when loading it from storage: the operations
 * trust their input, and totals may throw on an order that skipped them.
 */
export type SalesOrder = DraftOrder | PlacedOrder | CancelledOrder;

export type OrderStatus = SalesOrder['status'];

export function createDraft(input: {
  id: string;
  customerId: string;
  currency: Currency;
}): DraftOrder {
  return {
    id: input.id,
    customerId: input.customerId,
    currency: input.currency,
    lines: [],
    status: 'draft',
  };
}

function notDraft(order: SalesOrder): DomainError {
  return domainError('not-draft', `${order.id} is ${order.status}`);
}

export function addLine(
  order: SalesOrder,
  line: OrderLine,
): Result<SalesOrder, DomainError> {
  if (order.status !== 'draft') return err(notDraft(order));
  if (line.unitPrice.currency !== order.currency) {
    return err(
      domainError(
        'currency-mismatch',
        `${line.productId} is not in ${order.currency}`,
      ),
    );
  }
  if (order.lines.some((existing) => existing.productId === line.productId)) {
    return err(
      domainError(
        'duplicate-line',
        `${line.productId} is already on ${order.id}`,
      ),
    );
  }
  return ok({ ...order, lines: [...order.lines, line] });
}

/** Rebuilds the line through `orderLine`, so every line rule holds again. */
export function changeQuantity(
  order: SalesOrder,
  productId: string,
  value: number,
): Result<SalesOrder, DomainError> {
  if (order.status !== 'draft') return err(notDraft(order));
  const target = order.lines.find((line) => line.productId === productId);
  if (!target) {
    return err(
      domainError('line-not-found', `${productId} is not on ${order.id}`),
    );
  }
  const rebuilt = orderLine({
    productId: target.productId,
    name: target.name,
    quantity: value,
    unitPrice: target.unitPrice,
    discount: target.discount,
    vatRate: target.vatRate,
  });
  if (!rebuilt.ok) return rebuilt;
  return ok({
    ...order,
    lines: order.lines.map((line) =>
      line.productId === productId ? rebuilt.value : line,
    ),
  });
}

export function removeLine(
  order: SalesOrder,
  productId: string,
): Result<SalesOrder, DomainError> {
  if (order.status !== 'draft') return err(notDraft(order));
  if (!order.lines.some((line) => line.productId === productId)) {
    return err(
      domainError('line-not-found', `${productId} is not on ${order.id}`),
    );
  }
  return ok({
    ...order,
    lines: order.lines.filter((line) => line.productId !== productId),
  });
}

/** A state change and what it raised, for the caller to save and publish. */
export interface Transition<
  E extends BookingEvent = BookingEvent,
  O extends SalesOrder = SalesOrder,
> {
  readonly order: O;
  readonly events: readonly E[];
}

/** Placing also books the slot; the caller saves the order and the slot together. */
export interface PlaceTransition extends Transition<OrderPlaced, PlacedOrder> {
  readonly slot: DeliverySlot;
}

function invalidTransition(order: SalesOrder, to: OrderStatus): DomainError {
  return domainError(
    'invalid-transition',
    `${order.id}: ${order.status} -> ${to}`,
  );
}

export function place(
  order: SalesOrder,
  slot: DeliverySlot,
  now: Date,
): Result<PlaceTransition, DomainError> {
  if (order.status !== 'draft') return err(invalidTransition(order, 'placed'));
  if (order.lines.length === 0) {
    return err(domainError('empty-order', `${order.id} has no lines`));
  }
  const bookable = isBookable(slot, now);
  if (!bookable.ok) return bookable;

  const placed: PlacedOrder = {
    id: order.id,
    customerId: order.customerId,
    currency: order.currency,
    lines: order.lines,
    status: 'placed',
    slotId: slot.id,
    placedAt: now.toISOString(),
  };
  const event: OrderPlaced = domainEvent(
    'OrderPlaced',
    {
      orderId: placed.id,
      customerId: placed.customerId,
      slotId: slot.id,
      total: orderTotals(placed).total,
      lines: placed.lines.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    },
    now,
  );
  return ok({ order: placed, events: [event], slot: bookSlot(slot) });
}

export function confirm(
  order: SalesOrder,
): Result<Transition<never, PlacedOrder>, DomainError> {
  if (order.status !== 'placed') {
    return err(invalidTransition(order, 'confirmed'));
  }
  const confirmed: PlacedOrder = {
    id: order.id,
    customerId: order.customerId,
    currency: order.currency,
    lines: order.lines,
    status: 'confirmed',
    slotId: order.slotId,
    placedAt: order.placedAt,
  };
  return ok({ order: confirmed, events: [] });
}

export function cancel(
  order: SalesOrder,
  reason: string,
  now: Date,
): Result<Transition<OrderCancelled>, DomainError> {
  if (order.status === 'cancelled') {
    return err(invalidTransition(order, 'cancelled'));
  }
  const trimmed = reason.trim();
  if (trimmed === '') {
    return err(domainError('reason-required', `${order.id}: no reason given`));
  }
  const base = {
    id: order.id,
    customerId: order.customerId,
    currency: order.currency,
    lines: order.lines,
    status: 'cancelled',
    cancelReason: trimmed,
  } as const;

  if (order.status === 'draft') {
    const event: OrderCancelled = domainEvent(
      'OrderCancelled',
      { orderId: order.id, reason: trimmed },
      now,
    );
    return ok({ order: base, events: [event] });
  }
  const event: OrderCancelled = domainEvent(
    'OrderCancelled',
    { orderId: order.id, reason: trimmed, slotId: order.slotId },
    now,
  );
  return ok({
    order: { ...base, slotId: order.slotId, placedAt: order.placedAt },
    events: [event],
  });
}
