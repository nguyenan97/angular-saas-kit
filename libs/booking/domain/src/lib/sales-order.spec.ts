import { describe, expect, expectTypeOf, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { MAX_LINE_QUANTITY } from './order-line';
import {
  addLine,
  cancel,
  changeQuantity,
  confirm,
  createDraft,
  place,
  removeLine,
  type DraftOrder,
  type OrderStatus,
  type PlacedOrder,
  type SalesOrder,
} from './sales-order';
import { NOW, line, slot, unwrap } from './testing';

const draft = (): SalesOrder =>
  createDraft({ id: 'SO-0001', customerId: 'C-001', currency: 'VND' });

const withLine = (): SalesOrder => unwrap(addLine(draft(), line()));

/** Freezes an order deeply enough to catch an in-place edit. */
function freeze<T extends SalesOrder>(order: T): T {
  for (const l of order.lines) Object.freeze(l);
  Object.freeze(order.lines);
  return Object.freeze(order);
}

describe('SalesOrder draft', () => {
  it('starts empty, in draft', () => {
    expect(draft()).toEqual({
      id: 'SO-0001',
      customerId: 'C-001',
      currency: 'VND',
      lines: [],
      status: 'draft',
    });
  });

  it('copies only the fields it defines', () => {
    const input = {
      id: 'SO-1',
      customerId: 'C-1',
      currency: 'VND' as const,
      extra: 'leak',
    };
    expect('extra' in createDraft(input)).toBe(false);
  });

  it('adds a line', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(order.lines).toHaveLength(1);
  });

  it('refuses a second line for the same product', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(addLine(order, line())).toMatchObject({
      ok: false,
      error: { code: 'duplicate-line' },
    });
  });

  it('refuses a line in another currency', () => {
    expect(
      addLine(
        draft(),
        line({ unitPrice: money(1000, 'USD'), discount: money(0, 'USD') }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'currency-mismatch' } });
  });

  it('changes a quantity', () => {
    const order = unwrap(addLine(draft(), line()));
    const changed = unwrap(changeQuantity(order, 'P-001', 5));
    expect(changed.lines[0]?.quantity).toBe(5);
  });

  it('refuses an invalid quantity or an unknown product', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(changeQuantity(order, 'P-001', 0)).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' },
    });
    expect(changeQuantity(order, 'P-404', 1)).toMatchObject({
      ok: false,
      error: { code: 'line-not-found' },
    });
  });

  it('accepts the largest quantity and refuses one more', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(changeQuantity(order, 'P-001', MAX_LINE_QUANTITY).ok).toBe(true);
    expect(changeQuantity(order, 'P-001', MAX_LINE_QUANTITY + 1)).toMatchObject(
      { ok: false, error: { code: 'invalid-quantity' } },
    );
  });

  it('keeps the line invariants when a quantity drops below the discount', () => {
    const order = unwrap(
      addLine(
        draft(),
        line({
          quantity: 2,
          unitPrice: money(250_000, 'VND'),
          discount: money(400_000, 'VND'),
        }),
      ),
    );
    expect(changeQuantity(order, 'P-001', 1)).toMatchObject({
      ok: false,
      error: { code: 'discount-too-large' },
    });
  });

  it('removes a line', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(unwrap(removeLine(order, 'P-001')).lines).toEqual([]);
  });

  it('refuses to remove an unknown product', () => {
    expect(removeLine(withLine(), 'P-404')).toMatchObject({
      ok: false,
      error: { code: 'line-not-found' },
    });
  });

  it('refuses line changes outside draft', () => {
    const placed = unwrap(place(withLine(), slot(), NOW)).order;
    const notDraft = { ok: false, error: { code: 'not-draft' } };
    expect(addLine(placed, line({ productId: 'P-002' }))).toMatchObject(
      notDraft,
    );
    expect(changeQuantity(placed, 'P-001', 3)).toMatchObject(notDraft);
    expect(removeLine(placed, 'P-001')).toMatchObject(notDraft);
  });

  it('does not mutate its input', () => {
    const order = withLine();
    const before = structuredClone(order);
    freeze(order);
    addLine(order, line({ productId: 'P-002' }));
    changeQuantity(order, 'P-001', 5);
    removeLine(order, 'P-001');
    expect(order).toEqual(before);
  });
});

describe('SalesOrder transitions', () => {
  const placedOrder = (): SalesOrder =>
    unwrap(place(withLine(), slot(), NOW)).order;
  const confirmedOrder = (): SalesOrder => unwrap(confirm(placedOrder())).order;
  const cancelledOrder = (): SalesOrder =>
    unwrap(cancel(withLine(), 'Duplicate', NOW)).order;

  it('has a status for every shape', () => {
    const statuses: OrderStatus[] = [
      draft().status,
      placedOrder().status,
      confirmedOrder().status,
      cancelledOrder().status,
    ];
    expect(statuses).toEqual(['draft', 'placed', 'confirmed', 'cancelled']);
  });

  describe('place', () => {
    it('places a draft with lines into a bookable slot and raises OrderPlaced', () => {
      const { order, events } = unwrap(place(withLine(), slot(), NOW));

      expect(order).toMatchObject({
        status: 'placed',
        slotId: 'slot-2026-10-20-am',
        placedAt: NOW.toISOString(),
      });
      expect(events).toEqual([
        {
          type: 'OrderPlaced',
          occurredAt: NOW.toISOString(),
          payload: {
            orderId: 'SO-0001',
            customerId: 'C-001',
            slotId: 'slot-2026-10-20-am',
            total: money(540_000, 'VND'),
            lines: [{ productId: 'P-001', quantity: 2 }],
          },
        },
      ]);
    });

    it('returns the slot with one more place booked', () => {
      const result = unwrap(place(withLine(), slot({ booked: 2 }), NOW));
      expect(result.slot.booked).toBe(3);
    });

    it('refuses an empty order', () => {
      expect(place(draft(), slot(), NOW)).toMatchObject({
        ok: false,
        error: { code: 'empty-order' },
      });
    });

    it('refuses a full or past slot', () => {
      expect(place(withLine(), slot({ booked: 5 }), NOW)).toMatchObject({
        ok: false,
        error: { code: 'slot-full' },
      });
      expect(
        place(withLine(), slot({ date: '2026-10-17' }), NOW),
      ).toMatchObject({
        ok: false,
        error: { code: 'slot-in-past' },
      });
    });

    it('refuses an order that is not a draft', () => {
      for (const order of [placedOrder(), confirmedOrder(), cancelledOrder()]) {
        expect(place(order, slot(), NOW)).toMatchObject({
          ok: false,
          error: { code: 'invalid-transition' },
        });
      }
    });

    it('does not mutate its input', () => {
      const order = withLine();
      const before = structuredClone(order);
      freeze(order);
      place(order, slot(), NOW);
      expect(order).toEqual(before);
    });
  });

  describe('confirm', () => {
    it('narrows the types of the orders it returns', () => {
      expectTypeOf(
        createDraft({ id: 'SO-1', customerId: 'C-1', currency: 'VND' }),
      ).toEqualTypeOf<DraftOrder>();
      const placed = unwrap(place(withLine(), slot(), NOW));
      expectTypeOf(placed.order).toEqualTypeOf<PlacedOrder>();
      expectTypeOf(
        unwrap(confirm(placed.order)).order,
      ).toEqualTypeOf<PlacedOrder>();
    });

    it('confirms a placed order and raises no event', () => {
      const result = unwrap(confirm(placedOrder()));
      expect(result.events).toEqual([]);
      expect(result.order).toMatchObject({
        status: 'confirmed',
        slotId: 'slot-2026-10-20-am',
        placedAt: NOW.toISOString(),
      });
    });

    it('refuses anything but a placed order', () => {
      for (const order of [withLine(), confirmedOrder(), cancelledOrder()]) {
        expect(confirm(order)).toMatchObject({
          ok: false,
          error: { code: 'invalid-transition' },
        });
      }
    });

    it('does not mutate its input', () => {
      const order = placedOrder();
      const before = structuredClone(order);
      freeze(order);
      confirm(order);
      expect(order).toEqual(before);
    });
  });

  describe('cancel', () => {
    it('cancels a draft, without a slot to release', () => {
      const { order, events } = unwrap(
        cancel(withLine(), 'Customer changed mind', NOW),
      );
      expect(order).toMatchObject({
        status: 'cancelled',
        cancelReason: 'Customer changed mind',
      });
      expect(order).not.toHaveProperty('slotId');
      expect(events[0]?.payload).toEqual({
        orderId: 'SO-0001',
        reason: 'Customer changed mind',
      });
    });

    it('cancels a placed or confirmed order and names the slot to release', () => {
      for (const order of [placedOrder(), confirmedOrder()]) {
        const { events } = unwrap(cancel(order, 'Out of budget', NOW));
        expect(events).toEqual([
          {
            type: 'OrderCancelled',
            occurredAt: NOW.toISOString(),
            payload: {
              orderId: 'SO-0001',
              reason: 'Out of budget',
              slotId: 'slot-2026-10-20-am',
            },
          },
        ]);
      }
    });

    it('keeps the slot and placement time of a cancelled placed order', () => {
      for (const order of [placedOrder(), confirmedOrder()]) {
        expect(unwrap(cancel(order, 'Out of budget', NOW)).order).toMatchObject(
          {
            status: 'cancelled',
            cancelReason: 'Out of budget',
            slotId: 'slot-2026-10-20-am',
            placedAt: NOW.toISOString(),
          },
        );
      }
    });

    it('trims the reason', () => {
      const { order, events } = unwrap(cancel(withLine(), '  x  ', NOW));
      expect(order).toMatchObject({ cancelReason: 'x' });
      expect(events[0]?.payload).toMatchObject({ reason: 'x' });
    });

    it('needs a reason', () => {
      expect(cancel(withLine(), '   ', NOW)).toMatchObject({
        ok: false,
        error: { code: 'reason-required' },
      });
    });

    it('refuses to cancel twice', () => {
      expect(cancel(cancelledOrder(), 'Again', NOW)).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });

    it('does not mutate its input', () => {
      const order = placedOrder();
      const before = structuredClone(order);
      freeze(order);
      cancel(order, 'Out of budget', NOW);
      expect(order).toEqual(before);
    });
  });
});
