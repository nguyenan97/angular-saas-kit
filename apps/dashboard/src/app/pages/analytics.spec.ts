import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Analytics as AnalyticsData } from '../data/models';
import { Analytics } from './analytics';

const report = (days: 7 | 30 | 90): AnalyticsData => ({
  days,
  daily: Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 27 - days + 1 + i)).toISOString(),
    revenueCents: (i + 1) * 10000,
    orders: i % 3,
  })),
  byStatus: [
    { status: 'paid', orders: 6 },
    { status: 'pending', orders: 2 },
    { status: 'refunded', orders: 1 },
    { status: 'failed', orders: 1 },
  ],
  byCategory: [
    { category: 'Furniture', revenueCents: 300000 },
    { category: 'Audio', revenueCents: 100000 },
  ],
  topProducts: [
    { product: 'Cedar Standing Desk', units: 4, revenueCents: 171600 },
  ],
});

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Analytics);
  const http = TestBed.inject(HttpTestingController);
  const el: HTMLElement = fixture.nativeElement;
  const next = () => {
    TestBed.tick();
    return http.expectOne((req) => req.url === '/api/analytics');
  };
  return { fixture, http, el, next };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('Analytics', () => {
  it('asks for the last 30 days, and draws three charts from them', async () => {
    const { fixture, el, next } = await render();

    const req = next();
    expect(req.request.params.get('days')).toBe('30');
    req.flush(report(30));
    await fixture.whenStable();

    expect(
      [...el.querySelectorAll('figcaption > span:first-child')].map((c) =>
        c.textContent?.trim(),
      ),
    ).toEqual(['Revenue per day', 'Orders per day', 'Revenue by category']);
    // Revenue is money on the axis and in the table.
    expect(
      el
        .querySelector('ask-chart details tbody td:last-child')
        ?.textContent?.trim(),
    ).toBe('$100');
  });

  it('asks again when another period is chosen', async () => {
    const { fixture, el, next } = await render();
    next().flush(report(30));
    await fixture.whenStable();

    const week = el.querySelector<HTMLInputElement>(
      'input[type="radio"][value="7"]',
    );
    week?.click();
    const req = next();

    expect(req.request.params.get('days')).toBe('7');
    req.flush(report(7));
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Showing the last 7 days.',
    );
  });

  it('shows the orders by status in words, with their share', async () => {
    const { fixture, el, next } = await render();
    next().flush(report(30));
    await fixture.whenStable();

    const rows = [...el.querySelectorAll('table')]
      .find((table) => table.textContent?.includes('Share'))
      ?.querySelectorAll('tbody tr');
    expect(
      [...(rows ?? [])].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Paid', '6', '60%'],
      ['Pending', '2', '20%'],
      ['Refunded', '1', '10%'],
      ['Failed', '1', '10%'],
    ]);
  });

  it('says when the figures could not be loaded, and tries again', async () => {
    const { fixture, el, next } = await render();
    next().flush('down', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'The figures could not be loaded.',
    );
    el.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    next().flush(report(30));
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });
});
