import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Order, OverviewStats, Page } from '../data/models';
import { Overview } from './overview';

const STATS: OverviewStats = {
  kpis: [
    {
      key: 'revenue',
      label: 'Revenue',
      value: 4812000,
      format: 'money',
      change: 0.124,
      better: 'up',
    },
    {
      key: 'refundRate',
      label: 'Refund rate',
      value: 0.024,
      format: 'percent',
      change: 0.006,
      better: 'down',
    },
  ],
  daily: [],
};

const ORDER: Order = {
  id: 'ORD-1042',
  customerId: 'CUS-001',
  customer: 'Amara Okafor',
  email: 'amara.okafor@example.com',
  placedAt: '2026-09-27T09:00:00Z',
  lines: [],
  items: 2,
  totalCents: 12900,
  status: 'paid',
};

const page = (items: Order[]): Page<Order> => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 5,
});

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Overview);
  // Runs the resources' effects, which send the requests.
  TestBed.tick();

  const http = TestBed.inject(HttpTestingController);
  const stats = () => http.expectOne('/api/stats');
  const latest = () =>
    http.expectOne(
      (req) =>
        req.url === '/api/orders' &&
        req.params.get('sort') === 'placedAt' &&
        req.params.get('dir') === 'desc' &&
        req.params.get('pageSize') === '5',
    );
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, http, stats, latest, el };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('Overview', () => {
  it('marks the figures busy until they arrive', async () => {
    const { fixture, stats, latest, el } = await render();

    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();

    stats().flush(STATS);
    latest().flush(page([ORDER]));
    await fixture.whenStable();

    expect(el.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows each figure, coloured by whether its change is good news', async () => {
    const { fixture, stats, latest, el } = await render();
    stats().flush(STATS);
    latest().flush(page([ORDER]));
    await fixture.whenStable();

    const cards = [...el.querySelectorAll('ask-card')].slice(0, 2);
    expect(cards.map((card) => card.querySelector('h3')?.textContent)).toEqual([
      'Revenue',
      'Refund rate',
    ]);
    expect(cards[0]?.textContent).toContain('$48,120');
    const [revenueChange, refundChange] = cards.map((card) =>
      card.querySelector('p:last-child span'),
    );
    expect(revenueChange?.textContent).toBe('+12.4%');
    expect(revenueChange?.classList).toContain('text-success');
    // More refunds is bad news, so the rise is shown as one.
    expect(refundChange?.textContent).toBe('+0.6 pts');
    expect(refundChange?.classList).toContain('text-destructive');
  });

  it('lists the latest orders with their status in words', async () => {
    const { fixture, stats, latest, el } = await render();
    stats().flush(STATS);
    latest().flush(page([ORDER]));
    await fixture.whenStable();

    const cells = [...el.querySelectorAll('tbody td')].map((cell) =>
      cell.textContent?.trim(),
    );
    expect(cells).toEqual([
      'ORD-1042',
      'Amara Okafor',
      'Sep 27',
      'Paid',
      '$129.00',
    ]);
    expect(el.querySelector('tbody ask-badge')?.classList).toContain(
      'bg-success',
    );
  });

  it('says when there are no orders', async () => {
    const { fixture, stats, latest, el } = await render();
    stats().flush(STATS);
    latest().flush(page([]));
    await fixture.whenStable();

    expect(el.querySelector('tbody')?.textContent?.trim()).toBe(
      'No orders yet.',
    );
  });

  it('says when the figures could not be loaded, and tries again', async () => {
    const { fixture, http, stats, latest, el } = await render();
    stats().flush('down', { status: 500, statusText: 'Server Error' });
    latest().flush(page([ORDER]));
    await fixture.whenStable();

    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('The figures could not be loaded.');

    alert?.querySelector('button')?.click();
    TestBed.tick();
    stats().flush(STATS);
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.textContent).toContain('$48,120');
    http.verify();
  });
});
