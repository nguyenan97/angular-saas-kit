import type { DomainEvent, Money } from '@angular-saas-kit/shared-kernel';

export type OrderPlaced = DomainEvent<
  'OrderPlaced',
  {
    readonly orderId: string;
    readonly customerId: string;
    readonly slotId: string;
    readonly total: Money;
    readonly lines: readonly {
      readonly productId: string;
      readonly quantity: number;
    }[];
  }
>;

export type OrderCancelled = DomainEvent<
  'OrderCancelled',
  {
    readonly orderId: string;
    readonly reason: string;
    /** The slot to release; absent when a draft is cancelled. */
    readonly slotId?: string;
  }
>;

export type BookingEvent = OrderPlaced | OrderCancelled;
