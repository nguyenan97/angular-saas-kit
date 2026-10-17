import { describe, expect, it } from 'vitest';

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
  type SalesOrder,
} from './sales-order';
import { NOW, line, slot } from './testing';

function unwrap<T>(
  result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
  if (!result.ok)
    throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}

const draft = (): SalesOrder =>
  createDraft({ id: 'SO-0001', customerId: 'C-001', currency: 'VND' });

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

  it('removes a line', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(unwrap(removeLine(order, 'P-001')).lines).toEqual([]);
  });

  it('refuses line changes outside draft', () => {
    const placed: SalesOrder = {
      ...unwrap(addLine(draft(), line())),
      status: 'placed',
    };
    const notDraft = { ok: false, error: { code: 'not-draft' } };
    expect(addLine(placed, line({ productId: 'P-002' }))).toMatchObject(
      notDraft,
    );
    expect(changeQuantity(placed, 'P-001', 3)).toMatchObject(notDraft);
    expect(removeLine(placed, 'P-001')).toMatchObject(notDraft);
  });
});

describe('SalesOrder transitions', () => {
  const withLine = (): SalesOrder => unwrap(addLine(draft(), line()));

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
      const { order } = unwrap(place(withLine(), slot(), NOW));
      expect(place(order, slot(), NOW)).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });
  });

  describe('confirm', () => {
    it('confirms a placed order', () => {
      const { order } = unwrap(place(withLine(), slot(), NOW));
      expect(unwrap(confirm(order)).status).toBe('confirmed');
    });

    it('refuses anything but a placed order', () => {
      expect(confirm(withLine())).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
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
      expect(events[0]?.payload).toEqual({
        orderId: 'SO-0001',
        reason: 'Customer changed mind',
      });
    });

    it('cancels a placed or confirmed order and names the slot to release', () => {
      const placed = unwrap(place(withLine(), slot(), NOW)).order;
      const confirmed = unwrap(confirm(placed));
      for (const order of [placed, confirmed]) {
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

    it('needs a reason', () => {
      expect(cancel(withLine(), '   ', NOW)).toMatchObject({
        ok: false,
        error: { code: 'reason-required' },
      });
    });

    it('refuses to cancel twice', () => {
      const { order } = unwrap(cancel(withLine(), 'Duplicate', NOW));
      expect(cancel(order, 'Again', NOW)).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });
  });
});
