import { orderTotals, slotStart } from '@angular-saas-kit/booking-domain';
import { describe, expect, it } from 'vitest';

import { createBookingDataset, localDate } from './seed';

const NOW = new Date(2026, 9, 18, 10, 30);

describe('createBookingDataset', () => {
  const data = createBookingDataset(NOW);

  it('holds 20 customers and a catalogue of 30 products, each with its own id', () => {
    expect(new Set(data.customers.map((c) => c.id)).size).toBe(20);
    expect(new Set(data.products.map((p) => p.id)).size).toBe(30);
  });

  it('is the same data for the same day, so every load shows the same distributor', () => {
    expect(createBookingDataset(NOW)).toEqual(data);
  });

  it('has a morning and an afternoon slot for each of the 14 days back and the 14 ahead', () => {
    const dates = new Set(data.slots.map((slot) => slot.date));

    expect(data.slots).toHaveLength(56);
    expect(dates.has(localDate(NOW, -14))).toBe(true);
    expect(dates.has(localDate(NOW, 13))).toBe(true);
    expect(dates.has(localDate(NOW, 14))).toBe(false);
  });

  it('holds about 60 orders, in every status', () => {
    const statuses = new Set(data.orders.map((record) => record.order.status));

    expect(data.orders).toHaveLength(60);
    expect([...statuses].sort()).toEqual([
      'cancelled',
      'confirmed',
      'draft',
      'placed',
    ]);
  });

  it('numbers the orders in the order they were created, and continues from there', () => {
    expect(data.orders[0]?.order.id).toBe('SO-0001');
    expect(data.orders[59]?.order.id).toBe('SO-0060');
    const created = data.orders.map((record) => record.createdAt);
    expect([...created].sort()).toEqual(created);
    expect(data.nextId).toBe(61);
  });

  it('builds every order through the domain, so totals hold and a placed order has a real slot booked before it opened', () => {
    const slots = new Map(data.slots.map((slot) => [slot.id, slot]));
    for (const { order } of data.orders) {
      expect(() => orderTotals(order)).not.toThrow();
      if (order.status === 'placed' || order.status === 'confirmed') {
        const slot = slots.get(order.slotId);
        expect(slot).toBeDefined();
        expect(Date.parse(order.placedAt)).toBeLessThan(
          slotStart(slot as NonNullable<typeof slot>).getTime(),
        );
      }
    }
  });

  it("records each status change no later than now, ending with the order's status", () => {
    for (const record of data.orders) {
      const { history } = record;
      expect(history[0]).toEqual({ status: 'draft', at: record.createdAt });
      expect(history.at(-1)?.status).toBe(record.order.status);
      for (const change of history) {
        expect(Date.parse(change.at)).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });

  it('counts in each slot the orders that occupy it, never more than it holds', () => {
    for (const slot of data.slots) {
      const occupying = data.orders.filter(
        ({ order }) =>
          (order.status === 'placed' || order.status === 'confirmed') &&
          order.slotId === slot.id,
      ).length;
      expect(slot.booked).toBe(occupying);
      expect(slot.booked).toBeLessThanOrEqual(slot.capacity);
    }
  });

  it('has full slots still to come, so the slot picker shows one', () => {
    const full = data.slots.filter(
      (slot) => slot.booked === slot.capacity && slotStart(slot) > NOW,
    );

    expect(full.length).toBeGreaterThanOrEqual(2);
  });

  it('has orders created today, for the Overview', () => {
    const today = data.orders.filter(
      (record) =>
        localDate(new Date(record.createdAt), 0) === localDate(NOW, 0),
    );

    expect(today.length).toBeGreaterThan(0);
  });
});

describe('localDate', () => {
  it('is the local calendar date, days from the given one', () => {
    expect(localDate(new Date(2026, 11, 31, 23), 1)).toBe('2027-01-01');
    expect(localDate(new Date(2026, 0, 1, 0), -1)).toBe('2025-12-31');
  });
});
