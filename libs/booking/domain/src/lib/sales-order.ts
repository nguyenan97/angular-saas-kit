import {
  domainEvent,
  err,
  ok,
  type Currency,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { isBookable, type DeliverySlot } from './delivery-slot';
import { domainError, type DomainError } from './errors';
import type { BookingEvent, OrderCancelled, OrderPlaced } from './events';
import { lineQuantity, type OrderLine } from './order-line';
import { orderTotals } from './totals';

export type OrderStatus = 'draft' | 'placed' | 'confirmed' | 'cancelled';

export interface SalesOrder {
  readonly id: string;
  readonly customerId: string;
  readonly currency: Currency;
  readonly lines: readonly OrderLine[];
  readonly status: OrderStatus;
  readonly slotId?: string;
  /** ISO 8601, set when the order is placed. */
  readonly placedAt?: string;
  readonly cancelReason?: string;
}

export function createDraft(input: {
  id: string;
  customerId: string;
  currency: Currency;
}): SalesOrder {
  return { ...input, lines: [], status: 'draft' };
}

function requireDraft(order: SalesOrder): Result<SalesOrder, DomainError> {
  return order.status === 'draft'
    ? ok(order)
    : err(domainError('not-draft', `${order.id} is ${order.status}`));
}

export function addLine(
  order: SalesOrder,
  line: OrderLine,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
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

export function changeQuantity(
  order: SalesOrder,
  productId: string,
  value: number,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
  if (!order.lines.some((line) => line.productId === productId)) {
    return err(
      domainError('line-not-found', `${productId} is not on ${order.id}`),
    );
  }
  const quantity = lineQuantity(value);
  if (!quantity.ok) {
    return err(domainError('invalid-quantity', `${productId}: ${value}`));
  }
  return ok({
    ...order,
    lines: order.lines.map((line) =>
      line.productId === productId
        ? { ...line, quantity: quantity.value }
        : line,
    ),
  });
}

export function removeLine(
  order: SalesOrder,
  productId: string,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
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
export interface Transition<E extends BookingEvent = BookingEvent> {
  readonly order: SalesOrder;
  readonly events: readonly E[];
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
): Result<Transition<OrderPlaced>, DomainError> {
  if (order.status !== 'draft') return err(invalidTransition(order, 'placed'));
  if (order.lines.length === 0) {
    return err(domainError('empty-order', `${order.id} has no lines`));
  }
  const bookable = isBookable(slot, now);
  if (!bookable.ok) return bookable;

  const placed: SalesOrder = {
    ...order,
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
  return ok({ order: placed, events: [event] });
}

export function confirm(order: SalesOrder): Result<SalesOrder, DomainError> {
  return order.status === 'placed'
    ? ok({ ...order, status: 'confirmed' })
    : err(invalidTransition(order, 'confirmed'));
}

export function cancel(
  order: SalesOrder,
  reason: string,
  now: Date,
): Result<Transition<OrderCancelled>, DomainError> {
  if (order.status === 'cancelled')
    return err(invalidTransition(order, 'cancelled'));
  const trimmed = reason.trim();
  if (trimmed === '') {
    return err(domainError('reason-required', `${order.id}: no reason given`));
  }
  const cancelled: SalesOrder = {
    ...order,
    status: 'cancelled',
    cancelReason: trimmed,
  };
  const event: OrderCancelled = domainEvent(
    'OrderCancelled',
    order.slotId
      ? { orderId: order.id, reason: trimmed, slotId: order.slotId }
      : { orderId: order.id, reason: trimmed },
    now,
  );
  return ok({ order: cancelled, events: [event] });
}
