import { describe, expect, it } from 'vitest';

import { money } from '@angular-saas-kit/shared-kernel';

import { MAX_LINE_QUANTITY } from './order-line';
import {
  addLine,
  changeQuantity,
  createDraft,
  removeLine,
  type SalesOrder,
} from './sales-order';
import { line } from './testing';

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
