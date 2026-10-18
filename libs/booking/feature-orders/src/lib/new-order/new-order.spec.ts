import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type {
  CustomerDto,
  OrderDto,
  ProductDto,
  SlotDto,
} from '@angular-saas-kit/booking-contracts';
import { money } from '@angular-saas-kit/shared-kernel';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import { afterEach, describe, expect, it } from 'vitest';

import { NewOrder } from './new-order';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Blank {}

/** The local calendar date `days` from today, as the slots carry it. */
function day(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const CUSTOMERS: CustomerDto[] = [
  { id: 'C-01', name: 'Minh Chau Mart', city: 'Ha Noi' },
  { id: 'C-02', name: 'Hoa Binh Grocery', city: 'Da Nang' },
];
const PRODUCTS: ProductDto[] = [
  {
    id: 'P-001',
    name: 'Jasmine rice, 10 kg',
    unitPrice: money(250_000, 'VND'),
    vatRate: 8,
  },
  {
    id: 'P-002',
    name: 'Fish sauce, 1 l',
    unitPrice: money(65_000, 'VND'),
    vatRate: 10,
  },
];
const SLOTS: SlotDto[] = [
  { id: 'slot-past', date: day(-1), window: '08-12', capacity: 3, booked: 0 },
  { id: 'slot-a', date: day(2), window: '08-12', capacity: 3, booked: 1 },
  { id: 'slot-full', date: day(2), window: '13-17', capacity: 3, booked: 3 },
];

async function render({ customersFail = false } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      OrdersRepository,
      provideRouter([
        { path: 'orders/new', component: NewOrder },
        { path: 'orders/:id', component: Blank },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/orders/new', NewOrder);
  const http = TestBed.inject(HttpTestingController);
  if (customersFail) {
    http
      .expectOne('/api/booking/customers')
      .flush(null, { status: 503, statusText: 'Unavailable' });
  } else {
    http.expectOne('/api/booking/customers').flush(CUSTOMERS);
  }
  http.expectOne('/api/booking/products').flush(PRODUCTS);
  http.expectOne('/api/booking/slots').flush(SLOTS);
  await harness.fixture.whenStable();
  const el = () => harness.routeNativeElement as HTMLElement;
  const tick = async () => {
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
  };
  const settle = () => harness.fixture.whenStable();
  const find = <T extends Element>(selector: string) =>
    el().querySelector<T>(selector) as T;
  const button = (name: string) =>
    [...el().querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => text(b) === name,
    ) as HTMLButtonElement;
  const setValue = async (
    input: HTMLInputElement | HTMLSelectElement,
    value: string,
  ) => {
    input.value = value;
    input.dispatchEvent(
      new Event(input instanceof HTMLSelectElement ? 'change' : 'input'),
    );
    await settle();
  };
  const chooseCustomer = async (name: string) => {
    const box = find<HTMLInputElement>('#order-customer');
    box.focus();
    await setValue(box, name);
    [...el().querySelectorAll<HTMLElement>('[role="option"]')]
      .find((o) => text(o)?.startsWith(name))
      ?.click();
    await settle();
  };
  const addLine = async (productId: string, quantity = '1') => {
    await setValue(find<HTMLSelectElement>('#order-product'), productId);
    await setValue(find<HTMLInputElement>('#order-quantity'), quantity);
    button('Add line').click();
    await settle();
  };
  const chooseSlot = async (id: string) => {
    const radio = find<HTMLInputElement>(`input[type="radio"][value="${id}"]`);
    radio.click();
    await settle();
  };
  return {
    harness,
    http,
    el,
    tick,
    settle,
    find,
    button,
    setValue,
    chooseCustomer,
    addLine,
    chooseSlot,
  };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim();

const placed = { id: 'SO-0061', status: 'placed' } as OrderDto;

describe('NewOrder', () => {
  it('offers the slots as native radios grouped in a named fieldset, a full or past slot disabled and saying why', async () => {
    const { el, find } = await render();

    const fieldset = el().querySelector('fieldset');
    expect(text(fieldset?.querySelector('legend'))).toBe('Delivery slot');
    expect(find<HTMLInputElement>('input[value="slot-a"]').disabled).toBe(
      false,
    );
    expect(find<HTMLInputElement>('input[value="slot-full"]').disabled).toBe(
      true,
    );
    expect(find<HTMLInputElement>('input[value="slot-past"]').disabled).toBe(
      true,
    );
    const fullLabel = find<HTMLLabelElement>('label[for="slot-slot-full"]');
    expect(text(fullLabel)).toContain('Full');
    expect(text(find('label[for="slot-slot-past"]'))).toContain('Started');
  });

  it('works out the totals from the domain as lines are added and changed', async () => {
    const { el, addLine, setValue } = await render();

    await addLine('P-001', '2');
    await addLine('P-002', '1');

    const totals = () =>
      [...(el().querySelector('[aria-label="Totals"]')?.children ?? [])]
        .map(text)
        .join(' ');
    expect(totals()).toContain('Subtotal ₫565,000');
    expect(totals()).toContain('VAT ₫46,500');
    expect(totals()).toContain('Total ₫611,500');

    const quantity = el().querySelector<HTMLInputElement>(
      'input[aria-label="Quantity of Jasmine rice, 10 kg"]',
    );
    await setValue(quantity as HTMLInputElement, '1');
    expect(totals()).toContain('Total ₫341,500');
  });

  it('says in the line why a quantity is refused, and leaves that line out of the totals', async () => {
    const { el, addLine, setValue } = await render();
    await addLine('P-001', '2');

    const quantity = el().querySelector<HTMLInputElement>(
      'input[aria-label="Quantity of Jasmine rice, 10 kg"]',
    ) as HTMLInputElement;
    await setValue(quantity, '0');

    expect(quantity.getAttribute('aria-invalid')).toBe('true');
    const error = el().querySelector(
      `#${quantity.getAttribute('aria-describedby')}`,
    );
    expect(text(error)).toBe('A quantity is a whole number from 1 to 100,000.');
    const totals = [
      ...(el().querySelector('[aria-label="Totals"]')?.children ?? []),
    ].map(text);
    expect(totals.slice(-2)).toEqual(['Total', '₫0']);
  });

  it('adds a product already on the order to its line instead of a second line', async () => {
    const { el, addLine } = await render();

    await addLine('P-001', '2');
    await addLine('P-001', '3');

    const rows = el().querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(el().querySelector<HTMLInputElement>('tbody input')?.value).toBe(
      '5',
    );
  });

  it('removes a line', async () => {
    const { el, addLine } = await render();
    await addLine('P-001', '2');

    el()
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Remove Jasmine rice, 10 kg"]',
      )
      ?.click();
    await new Promise((r) => setTimeout(r));

    expect(el().querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('refuses an empty order on the page, says what is missing at each field, and sends nothing', async () => {
    const { el, button, settle, find } = await render();

    button('Place order').click();
    await settle();

    expect(text(find('#order-customer-error'))).toBe('Choose a customer.');
    expect(text(find('#order-lines-error'))).toBe(
      'Add at least one line before placing the order.',
    );
    expect(text(find('#order-slot-error'))).toBe('Choose a delivery slot.');
    expect(
      find<HTMLInputElement>('#order-customer').getAttribute('aria-invalid'),
    ).toBe('true');
    expect(el().querySelector('[role="alert"]')).toBeNull();
  });

  it('places a valid order: creates the draft, places it, and opens it', async () => {
    const { http, button, tick, chooseCustomer, addLine, chooseSlot } =
      await render();
    await chooseCustomer('Minh Chau Mart');
    await addLine('P-001', '2');
    await chooseSlot('slot-a');

    button('Place order').click();
    await tick();
    const create = http.expectOne('/api/booking/orders');
    expect(create.request.body).toEqual({
      customerId: 'C-01',
      lines: [{ productId: 'P-001', quantity: 2 }],
    });
    create.flush(
      { id: 'SO-0061', status: 'draft' },
      { status: 201, statusText: 'Created' },
    );
    await tick();
    const place = http.expectOne('/api/booking/orders/SO-0061/place');
    expect(place.request.body).toEqual({ slotId: 'slot-a' });
    place.flush(placed);
    await tick();

    expect(TestBed.inject(Router).url).toBe('/orders/SO-0061');
  });

  it('shows a refusal from the server above the form, in words', async () => {
    const {
      http,
      el,
      button,
      tick,
      settle,
      chooseCustomer,
      addLine,
      chooseSlot,
    } = await render();
    await chooseCustomer('Minh Chau Mart');
    await addLine('P-001', '1');
    await chooseSlot('slot-a');

    button('Place order').click();
    await tick();
    http
      .expectOne('/api/booking/orders')
      .flush(
        { id: 'SO-0061', status: 'draft' },
        { status: 201, statusText: 'Created' },
      );
    await tick();
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(
        { code: 'slot-full', message: 'full' },
        { status: 409, statusText: 'Conflict' },
      );
    await tick();
    http.expectOne('/api/booking/slots').flush(SLOTS);
    await tick();
    await settle();

    expect(text(el().querySelector('[role="alert"]'))).toContain(
      'That delivery slot is full. Choose another one.',
    );
    expect(TestBed.inject(Router).url).toBe('/orders/new');
  });

  it('offers to try again when the server cannot be reached', async () => {
    const {
      http,
      el,
      button,
      tick,
      settle,
      chooseCustomer,
      addLine,
      chooseSlot,
    } = await render();
    await chooseCustomer('Minh Chau Mart');
    await addLine('P-001', '1');
    await chooseSlot('slot-a');

    button('Place order').click();
    await tick();
    http
      .expectOne('/api/booking/orders')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    await tick();
    await settle();

    const alert = el().querySelector('[role="alert"]');
    expect(text(alert)).toContain('The order could not be sent.');
    button('Retry').click();
    await tick();
    http
      .expectOne('/api/booking/orders')
      .flush(
        { id: 'SO-0061', status: 'draft' },
        { status: 201, statusText: 'Created' },
      );
    await tick();
    http.expectOne('/api/booking/orders/SO-0061/place').flush(placed);
    await tick();
  });

  it('says when the customers, products or slots cannot be loaded, and loads them again on Retry', async () => {
    const { http, el, button, tick, settle } = await render({
      customersFail: true,
    });
    await tick();
    await settle();

    const alert = el().querySelector('[role="alert"]');
    expect(text(alert)).toContain(
      'The customers, products or slots could not be loaded.',
    );

    button('Retry').click();
    await tick();
    http.expectOne('/api/booking/customers').flush(CUSTOMERS);
    await tick();
    await settle();
    expect(el().querySelector('[role="alert"]')).toBeNull();
  });

  it('offers the slots again after a slot was refused, without the refused one chosen', async () => {
    const {
      http,
      el,
      button,
      tick,
      settle,
      chooseCustomer,
      addLine,
      chooseSlot,
    } = await render();
    await chooseCustomer('Minh Chau Mart');
    await addLine('P-001', '1');
    await chooseSlot('slot-a');

    button('Place order').click();
    await tick();
    http
      .expectOne('/api/booking/orders')
      .flush(
        { id: 'SO-0061', status: 'draft' },
        { status: 201, statusText: 'Created' },
      );
    await tick();
    http
      .expectOne('/api/booking/orders/SO-0061/place')
      .flush(
        { code: 'slot-full', message: 'full' },
        { status: 409, statusText: 'Conflict' },
      );
    await tick();

    http
      .expectOne('/api/booking/slots')
      .flush(
        SLOTS.map((slot) =>
          slot.id === 'slot-a' ? { ...slot, booked: 3 } : slot,
        ),
      );
    await tick();
    await settle();

    const a = el().querySelector<HTMLInputElement>('input[value="slot-a"]');
    expect(a?.checked).toBe(false);
    expect(a?.disabled).toBe(true);
  });

  it('moves focus to the refusal, so a keyboard user hears it and starts from there', async () => {
    const {
      http,
      el,
      button,
      tick,
      settle,
      chooseCustomer,
      addLine,
      chooseSlot,
    } = await render();
    await chooseCustomer('Minh Chau Mart');
    await addLine('P-001', '1');
    await chooseSlot('slot-a');

    button('Place order').click();
    await tick();
    http
      .expectOne('/api/booking/orders')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    await tick();
    await settle();

    expect(document.activeElement).toBe(el().querySelector('[role="alert"]'));
  });

  it('moves focus to the first field in error when the form is refused on the page', async () => {
    const { button, settle, find } = await render();

    button('Place order').click();
    await settle();
    await new Promise((r) => setTimeout(r));

    expect(document.activeElement).toBe(find('#order-customer'));
  });
});
