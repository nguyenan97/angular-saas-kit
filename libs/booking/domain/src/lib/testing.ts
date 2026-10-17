import { money } from '@angular-saas-kit/shared-kernel';

import type { DeliverySlot } from './delivery-slot';
import { orderLine, type OrderLine, type OrderLineInput } from './order-line';

export function line(overrides: Partial<OrderLineInput> = {}): OrderLine {
  const result = orderLine({
    productId: 'P-001',
    name: 'Carton of rice, 10 kg',
    quantity: 2,
    unitPrice: money(250_000, 'VND'),
    discount: money(0, 'VND'),
    vatRate: 8,
    ...overrides,
  });
  if (!result.ok) throw new Error(`bad fixture: ${result.error.code}`);
  return result.value;
}

export function slot(overrides: Partial<DeliverySlot> = {}): DeliverySlot {
  return {
    id: 'slot-2026-10-20-am',
    date: '2026-10-20',
    window: '08-12',
    capacity: 5,
    booked: 0,
    ...overrides,
  };
}

/** Before the fixture slot opens. */
export const NOW = new Date(2026, 9, 18, 9);

/** Unwraps an ok `Result`, or fails the test with the error. */
export function unwrap<T>(
  result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
  if (!result.ok)
    throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}
