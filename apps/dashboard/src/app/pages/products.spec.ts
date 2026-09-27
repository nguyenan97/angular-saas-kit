import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Page, Product } from '../data/models';
import { Products } from './products';

const product = (
  id: string,
  stock: number,
  overrides: Partial<Product> = {},
): Product => ({
  id,
  name: `Product ${id}`,
  sku: `SKU-${id}`,
  category: 'Accessories',
  priceCents: 5900,
  stock,
  status: 'active',
  ...overrides,
});

async function render(items: Product[]) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(Products);
  const http = TestBed.inject(HttpTestingController);
  TestBed.tick();
  http
    .expectOne((r) => r.url === '/api/products')
    .flush({
      items,
      total: items.length,
      page: 1,
      pageSize: 10,
    } satisfies Page<Product>);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const stockOf = (id: string) =>
    [...el.querySelectorAll('tbody tr')]
      .find((row) => row.textContent?.includes(`SKU-${id}`))
      ?.querySelectorAll('td')[3]
      ?.textContent?.replace(/\s+/g, ' ')
      .trim();
  return { fixture, http, el, stockOf };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('Products', () => {
  it('says in words when stock is low or gone, not only in colour', async () => {
    const { stockOf } = await render([
      product('1', 40),
      product('2', 3),
      product('3', 0),
    ]);

    expect(stockOf('1')).toBe('40');
    expect(stockOf('2')).toBe('Low 3');
    expect(stockOf('3')).toBe('Out of stock');
  });

  it('shows whether each product is on sale', async () => {
    const { el } = await render([
      product('1', 10),
      product('2', 10, { status: 'draft' }),
      product('3', 10, { status: 'archived' }),
    ]);

    expect(
      [...el.querySelectorAll('tbody tr')].map((row) =>
        row.querySelector('td:last-child')?.textContent?.trim(),
      ),
    ).toEqual(['Active', 'Draft', 'Archived']);
  });

  it('asks for one status when one is chosen', async () => {
    const { fixture, http, el } = await render([product('1', 10)]);
    const select = el.querySelector<HTMLSelectElement>('#products-status');

    if (select) {
      select.value = 'draft';
      select.dispatchEvent(new Event('change'));
    }
    TestBed.tick();
    const req = http.expectOne((r) => r.url === '/api/products');

    expect(req.request.params.get('status')).toBe('draft');
    req.flush({ items: [], total: 0, page: 1, pageSize: 10 });
    await fixture.whenStable();
  });
});
