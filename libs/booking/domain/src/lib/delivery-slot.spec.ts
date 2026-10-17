import { describe, expect, it } from 'vitest';

import {
  bookSlot,
  isBookable,
  releaseSlot,
  slotStart,
  type DeliverySlot,
} from './delivery-slot';

const slot = (overrides: Partial<DeliverySlot> = {}): DeliverySlot => ({
  id: 'slot-2026-10-20-am',
  date: '2026-10-20',
  window: '08-12',
  capacity: 2,
  booked: 0,
  ...overrides,
});

describe('DeliverySlot', () => {
  it('starts at the window opening, local time', () => {
    expect(slotStart(slot())).toEqual(new Date(2026, 9, 20, 8));
    expect(slotStart(slot({ window: '13-17' }))).toEqual(
      new Date(2026, 9, 20, 13),
    );
  });

  it('is bookable when it starts after now and has room', () => {
    expect(isBookable(slot(), new Date(2026, 9, 19))).toEqual({
      ok: true,
      value: slot(),
    });
  });

  it('is not bookable once it has started', () => {
    expect(isBookable(slot(), new Date(2026, 9, 20, 8))).toMatchObject({
      ok: false,
      error: { code: 'slot-in-past' },
    });
  });

  it('is not bookable when full', () => {
    expect(
      isBookable(slot({ booked: 2 }), new Date(2026, 9, 19)),
    ).toMatchObject({ ok: false, error: { code: 'slot-full' } });
  });

  it('books and releases one place', () => {
    expect(bookSlot(slot()).booked).toBe(1);
    expect(releaseSlot(slot({ booked: 1 })).booked).toBe(0);
    expect(releaseSlot(slot({ booked: 0 })).booked).toBe(0);
  });
});
