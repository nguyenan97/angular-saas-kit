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

/**
 * When the window opens. The date is read in the runtime's local zone; the
 * demo assumes Asia/Ho_Chi_Minh. A malformed date is a data error, not a
 * business outcome, so it throws.
 */
export function slotStart(slot: DeliverySlot): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(slot.date);
  if (!match) throw new RangeError(`Bad slot date ${slot.date}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const start = new Date(year, month - 1, day, Number(slot.window.slice(0, 2)));
  if (start.getMonth() !== month - 1 || start.getDate() !== day) {
    throw new RangeError(`Bad slot date ${slot.date}`);
  }
  return start;
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

/** Takes one place. The caller must check `isBookable` first. */
export function bookSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: slot.booked + 1 };
}

export function releaseSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: Math.max(0, slot.booked - 1) };
}
