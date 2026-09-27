import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Customer, Page } from '../data/models';
import { Customers } from './customers';

const CUSTOMER: Customer = {
  id: 'CUS-001',
  name: 'Amara Okafor',
  email: 'amara.okafor@example.com',
  country: 'Vietnam',
  joinedAt: '2025-03-14T00:00:00Z',
  orders: 7,
  spentCents: 123450,
};

async function render(items: Customer[]) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Customers);
  TestBed.tick();
  const req = TestBed.inject(HttpTestingController).expectOne(
    (r) => r.url === '/api/customers',
  );
  expect(req.request.params.get('sort')).toBe('name');
  req.flush({
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
  } satisfies Page<Customer>);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('Customers', () => {
  it('lists each customer with what they have ordered and spent', async () => {
    const el = await render([CUSTOMER]);
    const cells = [...el.querySelectorAll('tbody td')].map((cell) =>
      cell.textContent?.replace(/\s+/g, ' ').trim(),
    );

    // The initials are decoration: hidden from assistive tech.
    expect(
      el.querySelector('tbody [aria-hidden="true"]')?.textContent?.trim(),
    ).toBe('AO');
    expect(el.querySelector('tbody div.font-medium')?.textContent?.trim()).toBe(
      'Amara Okafor',
    );
    expect(cells[0]).toContain('amara.okafor@example.com');
    expect(cells.slice(1)).toEqual(['Vietnam', '7', '$1,234.50', 'Mar 14']);
  });

  it('says so when no customer matches', async () => {
    const el = await render([]);

    expect(el.querySelector('tbody')?.textContent?.trim()).toBe(
      'No customers match that search.',
    );
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'No customers match.',
    );
  });
});
