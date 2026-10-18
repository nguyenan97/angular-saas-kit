import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  type TestRequest,
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
  OrderSummaryDto,
  Page,
} from '@angular-saas-kit/booking-contracts';
import { money } from '@angular-saas-kit/shared-kernel';
import { afterEach, describe, expect, it } from 'vitest';

import { OrdersList, SEARCH_DEBOUNCE_MS } from './orders-list';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Blank {}

const summary = (id: string, status: OrderSummaryDto['status']) =>
  ({
    id,
    customerId: 'C-01',
    customerName: 'Minh Chau Mart',
    status,
    total: money(540_000, 'VND'),
    lineCount: 2,
    createdAt: '2026-10-18T02:00:00.000Z',
  }) satisfies OrderSummaryDto;

const page = (
  items: OrderSummaryDto[],
  total = items.length,
  number = 1,
): Page<OrderSummaryDto> => ({ items, total, page: number, pageSize: 10 });

async function render(url = '/orders') {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([
        { path: 'orders', component: OrdersList },
        { path: 'orders/new', component: Blank },
        { path: 'orders/:id', component: Blank },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, OrdersList);
  const http = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const el = () => harness.routeNativeElement as HTMLElement;
  const settle = async () => {
    await harness.fixture.whenStable();
  };
  /** Lets a navigation finish while a request is open (whenStable would wait for the request). */
  const tick = async () => {
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
  };
  const listRequest = (): TestRequest =>
    http.expectOne((r) => r.url === '/api/booking/orders');
  return { harness, http, router, el, settle, tick, listRequest };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim();

describe('OrdersList', () => {
  it('asks for the list the URL describes, and opens the tab of its status', async () => {
    const { listRequest, el, settle } = await render(
      '/orders?status=placed&q=minh&page=2',
    );

    const req = listRequest();
    expect(req.request.params.get('status')).toBe('placed');
    expect(req.request.params.get('q')).toBe('minh');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('10');
    req.flush(page([summary('SO-0011', 'placed')], 11, 2));
    await settle();

    const selected = el().querySelector('[role="tab"][aria-selected="true"]');
    expect(text(selected)).toBe('Placed');
    expect(text(el().querySelector('[role="status"]'))).toBe(
      'Showing 11 to 11 of 11 orders',
    );
  });

  it('shows each order with a link to it, its status in words and its total', async () => {
    const { listRequest, el, settle } = await render();

    listRequest().flush(page([summary('SO-0060', 'confirmed')]));
    await settle();

    const row = el().querySelector('tbody tr');
    const link = row?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/orders/SO-0060');
    expect(text(row)).toContain('Minh Chau Mart');
    expect(text(row)).toContain('Confirmed');
    expect(text(row)).toContain('₫540,000');
  });

  it('puts the chosen status in the URL and goes back to page 1', async () => {
    const { listRequest, el, settle, tick, router } =
      await render('/orders?page=3');
    listRequest().flush(page([], 0, 3));
    await settle();

    const tabs = [...el().querySelectorAll<HTMLElement>('[role="tab"]')];
    tabs.find((tab) => text(tab) === 'Cancelled')?.click();
    await tick();

    expect(router.url).toBe('/orders?status=cancelled');
    listRequest().flush(page([]));
    await settle();
  });

  it('puts the search in the URL once the typing stops', async () => {
    const { listRequest, el, settle, tick, router } = await render();
    listRequest().flush(page([]));
    await settle();

    const box = el().querySelector<HTMLInputElement>('input[type="search"]');
    (box as HTMLInputElement).value = 'SO-0007';
    box?.dispatchEvent(new Event('input'));
    await tick();
    expect(router.url).toBe('/orders');

    await new Promise((resolve) =>
      setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50),
    );
    await tick();

    expect(router.url).toBe('/orders?q=SO-0007');
    const req = listRequest();
    expect(req.request.params.get('q')).toBe('SO-0007');
    req.flush(page([]));
    await settle();
  });

  it('pages through the URL', async () => {
    const { listRequest, el, settle, tick, router } = await render();
    listRequest().flush(
      page(
        Array.from({ length: 10 }, (_, i) =>
          summary(`SO-00${10 + i}`, 'draft'),
        ),
        25,
      ),
    );
    await settle();

    [...el().querySelectorAll<HTMLButtonElement>('nav button')]
      .find((button) => text(button) === 'Next page')
      ?.click();
    await tick();

    expect(router.url).toBe('/orders?page=2');
    listRequest().flush(page([], 25, 2));
    await settle();
  });

  it('says when nothing matches', async () => {
    const { listRequest, el, settle } = await render('/orders?q=zzz');

    listRequest().flush(page([]));
    await settle();

    expect(text(el().querySelector('tbody'))).toBe(
      'No orders match. Try another search or status.',
    );
  });

  it('reports a failure with a Retry button that asks again', async () => {
    const { listRequest, el, settle, tick } = await render();

    listRequest().flush(null, { status: 503, statusText: 'Unavailable' });
    await settle();
    const alert = el().querySelector('[role="alert"]');
    expect(text(alert)).toContain('The orders could not be loaded.');

    alert?.querySelector('button')?.click();
    await tick();

    listRequest().flush(page([summary('SO-0001', 'draft')]));
    await settle();
    expect(el().querySelector('[role="alert"]')).toBeNull();
  });

  it('links to a new order', async () => {
    const { listRequest, el, settle } = await render();
    listRequest().flush(page([]));
    await settle();

    const link = [...el().querySelectorAll('a')].find(
      (a) => text(a) === 'New order',
    );
    expect(link?.getAttribute('href')).toBe('/orders/new');
  });
});
