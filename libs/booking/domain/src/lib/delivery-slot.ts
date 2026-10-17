import { err, ok, type Result } from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';

export type DeliveryWindow = '08-12' | '13-17';

export interface DeliverySlot {
  readonly id: string;
  /** Local calendar date, `YYYY-MM-DD`. */
  readonly date: string;
  readonly window: DeliveryWindow;
  readonly capacity: number;
  readonly booked: number;
}

export function slotStart(slot: DeliverySlot): Date {
  const [year, month, day] = slot.date.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const hour = Number(slot.window.slice(0, 2));
  return new Date(year, month - 1, day, hour);
}

export function isBookable(
  slot: DeliverySlot,
  now: Date,
): Result<DeliverySlot, DomainError> {
  if (slotStart(slot) <= now) {
    return err(domainError('slot-in-past', `${slot.id} has started`));
  }
  if (slot.booked >= slot.capacity) {
    return err(domainError('slot-full', `${slot.id} is full`));
  }
  return ok(slot);
}

export function bookSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: slot.booked + 1 };
}

export function releaseSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: Math.max(0, slot.booked - 1) };
}
