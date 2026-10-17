import {
  err,
  ok,
  type Currency,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';
import { lineQuantity, type OrderLine } from './order-line';

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
