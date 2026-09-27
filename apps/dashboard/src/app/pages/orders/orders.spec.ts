import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Order, Page } from '../../data/models';
import { Orders } from './orders';

const order = (id: string, overrides: Partial<Order> = {}): Order => ({
  id,
  customerId: 'CUS-001',
  customer: 'Amara Okafor',
  email: 'amara.okafor@example.com',
  placedAt: '2026-09-27T09:00:00Z',
  lines: [
    {
      productId: 'PRD-002',
      product: 'Cedar Standing Desk',
      quantity: 1,
      unitPriceCents: 42900,
    },
    {
      productId: 'PRD-006',
      product: 'Glide Mouse',
      quantity: 2,
      unitPriceCents: 3900,
    },
  ],
  items: 3,
  totalCents: 50700,
  status: 'paid',
  ...overrides,
});

const PAID = order('ORD-1001');
const PENDING = order('ORD-1002', { status: 'pending', customer: 'Bao Tran' });

const page = (items: Order[]): Page<Order> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 10,
});

/** A macrotask: the component opens its dialogs after the menu has closed. */
const tick = () => new Promise((resolve) => setTimeout(resolve));

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Orders);
  const http = TestBed.inject(HttpTestingController);
  const el: HTMLElement = fixture.nativeElement;

  const list = () => {
    TestBed.tick();
    return http.expectOne((req) => req.url === '/api/orders');
  };
  const settle = async () => {
    await fixture.whenStable();
    await tick();
    TestBed.tick();
  };
  const button = (name: string, root: ParentNode = document) =>
    [...root.querySelectorAll<HTMLElement>('button, [role="menuitem"]')].find(
      (candidate) =>
        candidate.textContent?.replace(/\s+/g, ' ').trim() === name ||
        candidate.getAttribute('aria-label') === name,
    ) as HTMLElement;

  list().flush(page([PAID, PENDING]));
  await fixture.whenStable();
  return { fixture, http, el, list, settle, button };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('Orders', () => {
  it('lists the orders and says how many there are', async () => {
    const { el } = await render();

    const rows = [...el.querySelectorAll('tbody tr')].map((row) =>
      row.querySelector('td')?.textContent?.trim(),
    );
    expect(rows).toEqual(['ORD-1001', 'ORD-1002']);
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Showing 1 to 2 of 2 orders',
    );
  });

  it('asks for one status when one is chosen', async () => {
    const { fixture, el, list } = await render();
    const select = el.querySelector<HTMLSelectElement>('#orders-status');

    if (select) {
      select.value = 'paid';
      select.dispatchEvent(new Event('change'));
    }
    const req = list();

    expect(req.request.params.get('status')).toBe('paid');
    expect(req.request.params.get('page')).toBe('1');
    req.flush(page([PAID]));
    await fixture.whenStable();
  });

  it('sorts by a column from its header', async () => {
    const { fixture, el, list, button } = await render();

    button('Total', el).click();
    const req = list();

    expect(req.request.params.get('sort')).toBe('totalCents');
    expect(req.request.params.get('dir')).toBe('asc');
    req.flush(page([PENDING, PAID]));
    await fixture.whenStable();
  });

  it('offers a refund for a paid order only', async () => {
    const { settle, button } = await render();

    button('Actions for ORD-1002').click();
    await settle();
    expect(button('Refund').getAttribute('aria-disabled')).toBe('true');
    button('Refund').click();
    await settle();
    // Nothing opened: no confirmation for an order that cannot be refunded.
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('refunds a paid order after a confirmation, then says so', async () => {
    const { http, el, list, settle, button } = await render();

    button('Actions for ORD-1001').click();
    await settle();
    button('Refund').click();
    await settle();

    const dialog = document.querySelector('[role="alertdialog"]');
    expect(dialog?.querySelector('h2')?.textContent?.trim()).toBe(
      'Refund ORD-1001?',
    );
    button('Refund $507.00', dialog as HTMLElement).click();
    await settle();

    const patch = http.expectOne('/api/orders/ORD-1001');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'refunded' });
    patch.flush({ ...PAID, status: 'refunded' });
    await settle();

    expect(el.textContent).toContain('ORD-1001 was refunded.');
    // The list is asked again, so the row shows its new status.
    list().flush(page([{ ...PAID, status: 'refunded' }, PENDING]));
  });

  it('leaves the order alone when the refund is cancelled', async () => {
    const { settle, button } = await render();

    button('Actions for ORD-1001').click();
    await settle();
    button('Refund').click();
    await settle();
    button('Cancel').click();
    await settle();

    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    // afterEach's verify() proves no PATCH was sent.
  });

  it('shows the lines of an order in a dialog', async () => {
    const { settle, button } = await render();

    button('Actions for ORD-1001').click();
    await settle();
    button('View details').click();
    await settle();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('h2')?.textContent?.trim()).toBe('ORD-1001');
    expect(
      [...(dialog?.querySelectorAll('tbody td:first-child') ?? [])].map(
        (cell) => cell.textContent?.trim(),
      ),
    ).toEqual(['Cedar Standing Desk', 'Glide Mouse']);
    expect(dialog?.querySelector('tfoot')?.textContent).toContain('$507.00');
  });
});
