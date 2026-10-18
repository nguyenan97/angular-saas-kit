import type { Currency, Money } from '@angular-saas-kit/shared-kernel';
import type {
  DeliverySlot,
  DomainErrorCode,
  OrderStatus,
  OrderTotals,
  VatRate,
} from '@angular-saas-kit/booking-domain';

/**
 * The shapes the Booking API takes and returns. The suite's mock backend
 * serves them; a real backend has to return the same. Money is in integer
 * minor units, dates are ISO 8601 strings.
 */

export interface OrderLineDto {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly discount: Money;
  readonly vatRate: VatRate;
  /** Quantity times unit price, less the discount. */
  readonly net: Money;
}

/** When the order reached a status, oldest first: what a timeline draws. */
export interface StatusChange {
  readonly status: OrderStatus;
  readonly at: string;
}

export interface OrderDto {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly currency: Currency;
  readonly status: OrderStatus;
  readonly lines: readonly OrderLineDto[];
  readonly totals: OrderTotals;
  readonly createdAt: string;
  readonly history: readonly StatusChange[];
  /** Set once placed, and kept when a placed order is cancelled. */
  readonly slotId?: string;
  readonly placedAt?: string;
  readonly cancelReason?: string;
}

/** A row of the orders list. */
export interface OrderSummaryDto {
  readonly id: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly status: OrderStatus;
  readonly total: Money;
  readonly lineCount: number;
  readonly createdAt: string;
  readonly slotId?: string;
}

/** One page of a list, and how many items the whole list has. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface CustomerDto {
  readonly id: string;
  readonly name: string;
  readonly city: string;
}

/** A catalogue entry. Booking holds the catalogue until SCM owns it. */
export interface ProductDto {
  readonly id: string;
  readonly name: string;
  readonly unitPrice: Money;
  readonly vatRate: VatRate;
}

export type SlotDto = DeliverySlot;

export interface CreateOrderRequest {
  readonly customerId: string;
  readonly lines: readonly {
    readonly productId: string;
    readonly quantity: number;
    /** In minor units of the order's currency; zero when absent. */
    readonly discount?: number;
  }[];
}

export interface PlaceOrderRequest {
  readonly slotId: string;
}

export interface CancelOrderRequest {
  readonly reason: string;
}

/** Codes a refusal carries besides the domain's own. */
export type BookingErrorCode =
  DomainErrorCode | 'not-found' | 'invalid-request';

/**
 * The body of a 4xx answer: 409 for a business refusal (a domain error code),
 * 404 for `not-found`, 400 for `invalid-request`.
 */
export interface BookingErrorBody {
  readonly code: BookingErrorCode;
  readonly message: string;
}

/** The figures the suite's Overview page shows. */
export interface BookingOverviewDto {
  /** Orders created today. */
  readonly ordersToday: number;
  /** Placed orders not yet confirmed. */
  readonly awaitingConfirmation: number;
  /** Totals of the orders placed in the last seven days, cancelled ones left out. */
  readonly revenueThisWeek: Money;
  /** Cancelled orders among those created in the last 30 days, as a fraction. */
  readonly cancellationRate: number;
  /** Orders created on each of the last 14 days, oldest first. */
  readonly daily: readonly { readonly date: string; readonly orders: number }[];
}
