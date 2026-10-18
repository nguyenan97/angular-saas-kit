import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { OrderDto } from '@angular-saas-kit/booking-contracts';
import { money } from '@angular-saas-kit/shared-kernel';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import { afterEach, describe, expect, it } from 'vitest';

import { OrderDetail } from './order-detail';

const vnd = (amount: number) => money(amount, 'VND');

function order(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: 'SO-0061',
    customerId: 'C-01',
    customerName: 'Minh Chau Mart',
    currency: 'VND',
    status: 'placed',
    lines: [
      {
        productId: 'P-001',
        name: 'Jasmine rice, 10 kg',
        quantity: 2,
        unitPrice: vnd(250_000),
        discount: vnd(0),
        vatRate: 8,
        net: vnd(500_000),
      },
    ],
    totals: { subtotal: vnd(500_000), vat: vnd(40_000), total: vnd(540_000) },
    createdAt: '2026-10-18T02:00:00.000Z',
    history: [
      { status: 'draft', at: '2026-10-18T02:00:00.000Z' },
      { status: 'placed', at: '2026-10-18T02:30:00.000Z' },
    ],
    slotId: 'slot-2026-10-20-am',
    placedAt: '2026-10-18T02:30:00.000Z',
    deliverySlot: { date: '2026-10-20', window: '08-12' },
    ...overrides,
  };
}

async function render(loaded: OrderDto | null = order()) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      OrdersRepository,
      provideRouter([{ path: 'orders/:id', component: OrderDetail }]),
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/orders/SO-0061', OrderDetail);
  const http = TestBed.inject(HttpTestingController);
  const tick = async () => {
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
  };
  const settle = async () => {
    await tick();
    await harness.fixture.whenStable();
  };
  const req = http.expectOne('/api/booking/orders/SO-0061');
  if (loaded) req.flush(loaded);
  else
    req.flush(
      { code: 'not-found', message: 'No order.' },
      { status: 404, statusText: 'Not Found' },
    );
  await settle();
  const el = () => harness.routeNativeElement as HTMLElement;
  const button = (name: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => text(b) === name,
    );
  return { harness, http, el, settle, tick, button };
}

afterEach(() => {
  TestBed.inject(HttpTestingController).verify();
  document
    .querySelectorAll('.cdk-overlay-container')
    .forEach((n) => n.remove());
});

const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim();

describe('OrderDetail', () => {
  it('shows the order: customer, delivery slot, lines and totals', async () => {
    const { el } = await render();

    const page = text(el());
    expect(page).toContain('Minh Chau Mart');
    expect(page).toContain('Tue, Oct 20, 08:00 to 12:00');
    expect(text(el().querySelector('tbody tr'))).toContain(
      'Jasmine rice, 10 kg',
    );
    expect(page).toContain('₫540,000');
  });

  it('draws the status history as a timeline, the current status marked and the next one to come', async () => {
    const { el } = await render();

    const steps = [...el().querySelectorAll('ask-timeline li')];
    expect(steps.map((s) => text(s)?.split(',')[0])).toEqual([
      'Completed: Created',
      'Current: Placed',
      'Upcoming: Confirmed',
    ]);
  });

  it('confirms a placed order and says so', async () => {
    const { http, el, button, settle, tick } = await render();

    button('Confirm')?.click();
    await tick();
    http.expectOne('/api/booking/orders/SO-0061/confirm').flush(
      order({
        status: 'confirmed',
        history: [
          ...order().history,
          { status: 'confirmed', at: '2026-10-18T05:00:00.000Z' },
        ],
      }),
    );
    await settle();

    expect(text(el().querySelector('[role="status"]'))).toBe(
      'SO-0061 was confirmed.',
    );
    // The Confirm button is gone, so focus moves to the order's heading.
    expect(document.activeElement).toBe(el().querySelector('h2'));
    expect(button('Confirm')).toBeUndefined();
  });

  it('cancels with a reason given in a dialog', async () => {
    const { http, el, button, settle, tick } = await render();

    button('Cancel order')?.click();
    await settle();
    const dialog = document.querySelector('[role="dialog"]');
    expect(text(dialog?.querySelector('h2'))).toBe('Cancel SO-0061?');
    const reason = dialog?.querySelector('textarea') as HTMLTextAreaElement;
    reason.value = 'Wrong address';
    reason.dispatchEvent(new Event('input'));
    await settle();
    (
      dialog?.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click();
    await tick();

    const req = http.expectOne('/api/booking/orders/SO-0061/cancel');
    expect(req.request.body).toEqual({ reason: 'Wrong address' });
    req.flush(order({ status: 'cancelled', cancelReason: 'Wrong address' }));
    await settle();

    expect(text(el().querySelector('[role="status"]'))).toBe(
      'SO-0061 was cancelled.',
    );
    expect(document.activeElement).toBe(el().querySelector('h2'));
    expect(text(el())).toContain('Wrong address');
  });

  it('asks for a reason in the dialog before cancelling, and sends nothing without one', async () => {
    const { button, settle } = await render();

    button('Cancel order')?.click();
    await settle();
    const dialog = document.querySelector('[role="dialog"]');
    (
      dialog?.querySelector('button[type="submit"]') as HTMLButtonElement
    ).click();
    await settle();

    const reason = dialog?.querySelector('textarea');
    expect(reason?.getAttribute('aria-invalid')).toBe('true');
    expect(
      text(
        document.getElementById(reason?.getAttribute('aria-describedby') ?? ''),
      ),
    ).toBe('Give a reason for cancelling.');
  });

  it('has no Cancel button on a cancelled order', async () => {
    const { button, el } = await render(
      order({
        status: 'cancelled',
        cancelReason: 'Duplicate order',
        history: [
          ...order().history,
          { status: 'cancelled', at: '2026-10-18T05:00:00.000Z' },
        ],
      }),
    );

    expect(button('Cancel order')).toBeUndefined();
    expect(button('Confirm')).toBeUndefined();
    const last = [...el().querySelectorAll('ask-timeline li')].at(-1);
    expect(text(last)).toContain('Current: Cancelled');
  });

  it('shows a refusal from the server in words', async () => {
    const { http, el, button, settle, tick } = await render();

    button('Confirm')?.click();
    await tick();
    http
      .expectOne('/api/booking/orders/SO-0061/confirm')
      .flush(
        { code: 'invalid-transition', message: 'x' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(text(el().querySelector('[role="alert"]'))).toContain(
      'The order has changed since you opened it.',
    );
  });

  it('says when there is no such order, with a way back to the list', async () => {
    const { el } = await render(null);

    expect(text(el())).toContain('There is no such order.');
    expect(
      [...el().querySelectorAll('a')].some((a) => text(a) === 'Back to orders'),
    ).toBe(true);
  });
});
