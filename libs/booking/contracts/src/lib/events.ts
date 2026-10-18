import type { Money } from '@angular-saas-kit/shared-kernel';
import type {
  BookingEvent,
  OrderCancelled,
  OrderPlaced,
} from '@angular-saas-kit/booking-domain';

/**
 * Booking's published events: what another context may depend on. They are
 * versioned and flat, so the domain events can change shape without breaking
 * a subscriber; a breaking change is a new version, published next to the old.
 */
export interface OrderPlacedV1 {
  readonly type: 'booking.order-placed.v1';
  readonly occurredAt: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly slotId: string;
  readonly total: Money;
  readonly lines: readonly {
    readonly productId: string;
    readonly quantity: number;
  }[];
}

export interface OrderCancelledV1 {
  readonly type: 'booking.order-cancelled.v1';
  readonly occurredAt: string;
  readonly orderId: string;
  readonly reason: string;
  /** The slot the order freed; absent when a draft was cancelled. */
  readonly slotId?: string;
}

export type BookingPublishedEvent = OrderPlacedV1 | OrderCancelledV1;

function placedV1({ occurredAt, payload }: OrderPlaced): OrderPlacedV1 {
  return {
    type: 'booking.order-placed.v1',
    occurredAt,
    orderId: payload.orderId,
    customerId: payload.customerId,
    slotId: payload.slotId,
    total: payload.total,
    lines: payload.lines.map(({ productId, quantity }) => ({
      productId,
      quantity,
    })),
  };
}

function cancelledV1({
  occurredAt,
  payload,
}: OrderCancelled): OrderCancelledV1 {
  const event: OrderCancelledV1 = {
    type: 'booking.order-cancelled.v1',
    occurredAt,
    orderId: payload.orderId,
    reason: payload.reason,
  };
  return payload.slotId === undefined
    ? event
    : { ...event, slotId: payload.slotId };
}

/** The published form of a Booking domain event. */
export function toPublishedEvent(event: BookingEvent): BookingPublishedEvent {
  return event.type === 'OrderPlaced' ? placedV1(event) : cancelledV1(event);
}
