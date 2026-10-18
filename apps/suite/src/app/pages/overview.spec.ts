import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BookingOverviewDto } from '@angular-saas-kit/booking-contracts';
import { money } from '@angular-saas-kit/shared-kernel';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import { afterEach, describe, expect, it } from 'vitest';

import type { ActivityEntry } from '../data/activity';
import { Overview } from './overview';

const OVERVIEW: BookingOverviewDto = {
  ordersToday: 3,
  awaitingConfirmation: 14,
  revenueThisWeek: money(12_540_000, 'VND'),
  cancellationRate: 0.2,
  daily: Array.from({ length: 14 }, (_, i) => ({
    date: `2026-10-${String(5 + i).padStart(2, '0')}`,
    orders: i,
  })),
};

const ACTIVITY: ActivityEntry[] = [
  {
    type: 'OrderCancelled',
    occurredAt: '2026-10-18T03:00:00.000Z',
    orderId: 'SO-0058',
    text: 'SO-0058 was cancelled: Wrong address',
  },
  {
    type: 'OrderPlaced',
    occurredAt: '2026-10-18T02:00:00.000Z',
    orderId: 'SO-0057',
    text: 'SO-0057 was placed for Minh Chau Mart, ₫540,000',
  },
];

async function render() {
  await TestBed.configureTestingModule({
    imports: [Overview],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      OrdersRepository,
      provideRouter([]),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(Overview);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  const tick = async () => {
    for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
  };
  return { fixture, http, el: fixture.nativeElement as HTMLElement, tick };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

const text = (node: Element | null | undefined) =>
  node?.textContent?.replace(/\s+/g, ' ').trim();

describe('Overview', () => {
  it('shows the four Booking figures', async () => {
    const { http, el, tick } = await render();

    http.expectOne('/api/booking/overview').flush(OVERVIEW);
    http.expectOne('/api/suite/activity').flush(ACTIVITY);
    await tick();

    const kpis = [...el.querySelectorAll('[data-kpi]')].map(text);
    expect(kpis).toEqual([
      'Orders today 3',
      'Awaiting confirmation 14',
      'Revenue this week ₫12,540,000',
      'Cancellation rate, 30 days 20.0%',
    ]);
  });

  it('charts the orders of each of the last 14 days, with the numbers as a table', async () => {
    const { http, el, tick } = await render();

    http.expectOne('/api/booking/overview').flush(OVERVIEW);
    http.expectOne('/api/suite/activity').flush(ACTIVITY);
    await tick();

    const chart = el.querySelector('ask-chart');
    expect(text(chart?.querySelector('figcaption'))).toContain(
      'Orders per day',
    );
    expect(chart?.querySelectorAll('tbody tr')).toHaveLength(14);
  });

  it('lists the latest domain events, newest first, each linked to its order', async () => {
    const { http, el, tick } = await render();

    http.expectOne('/api/booking/overview').flush(OVERVIEW);
    http.expectOne('/api/suite/activity').flush(ACTIVITY);
    await tick();

    const items = [
      ...el.querySelectorAll('[aria-labelledby="activity-heading"] li'),
    ];
    expect(items.map((li) => text(li.querySelector('a')))).toEqual([
      'SO-0058 was cancelled: Wrong address',
      'SO-0057 was placed for Minh Chau Mart, ₫540,000',
    ]);
    expect(items[0]?.querySelector('a')?.getAttribute('href')).toBe(
      '/booking/orders/SO-0058',
    );
    expect(items[0]?.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-18T03:00:00.000Z',
    );
  });

  it('reports each section that fails on its own, with a Retry', async () => {
    const { http, el, tick } = await render();

    http
      .expectOne('/api/booking/overview')
      .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne('/api/suite/activity').flush(ACTIVITY);
    await tick();

    const alerts = [...el.querySelectorAll('[role="alert"]')];
    expect(alerts.map(text)).toEqual([
      'The figures could not be loaded. Retry',
    ]);
    expect(
      el.querySelectorAll('[aria-labelledby="activity-heading"] li'),
    ).toHaveLength(2);

    alerts[0]?.querySelector('button')?.click();
    await new Promise((r) => setTimeout(r));
    http.expectOne('/api/booking/overview').flush(OVERVIEW);
    await tick();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });
});
