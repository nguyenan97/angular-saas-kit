import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { OrdersRepository } from './orders.repository';

let repository: OrdersRepository;
let http: HttpTestingController;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  repository = TestBed.inject(OrdersRepository);
  http = TestBed.inject(HttpTestingController);
});

afterEach(() => http.verify());

describe('OrdersRepository', () => {
  it('lists orders with only the filters that are set', async () => {
    const page = firstValueFrom(
      repository.list({ status: 'placed', q: ' so-1 ', page: 2 }),
    );

    const req = http.expectOne(
      (r) => r.url === '/api/booking/orders' && r.method === 'GET',
    );
    expect(req.request.params.keys().sort()).toEqual(['page', 'q', 'status']);
    expect(req.request.params.get('q')).toBe('so-1');
    req.flush({ items: [], total: 0, page: 2, pageSize: 10 });
    expect(await page).toMatchObject({ page: 2 });
  });

  it('leaves out an empty search and an empty status', () => {
    repository.list({ status: '', q: '  ' }).subscribe();

    const req = http.expectOne('/api/booking/orders');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ items: [], total: 0, page: 1, pageSize: 10 });
  });

  it('reads one order by its encoded id', () => {
    repository.get('SO 1').subscribe();

    http.expectOne('/api/booking/orders/SO%201').flush({});
  });

  it('posts a new draft', () => {
    const request = {
      customerId: 'C-01',
      lines: [{ productId: 'P-001', quantity: 2 }],
    };
    repository.create(request).subscribe();

    const req = http.expectOne('/api/booking/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({}, { status: 201, statusText: 'Created' });
  });

  it('posts the place, confirm and cancel actions with their bodies', () => {
    repository.place('SO-1', 'slot-a').subscribe();
    repository.confirm('SO-1').subscribe();
    repository.cancel('SO-1', 'Wrong address').subscribe();

    const place = http.expectOne('/api/booking/orders/SO-1/place');
    const confirm = http.expectOne('/api/booking/orders/SO-1/confirm');
    const cancel = http.expectOne('/api/booking/orders/SO-1/cancel');
    expect(place.request.body).toEqual({ slotId: 'slot-a' });
    expect(confirm.request.body).toEqual({});
    expect(cancel.request.body).toEqual({ reason: 'Wrong address' });
    for (const req of [place, confirm, cancel]) {
      expect(req.request.method).toBe('POST');
      req.flush({});
    }
  });

  it('reads the reference data and the overview', () => {
    repository.customers().subscribe();
    repository.products().subscribe();
    repository.slots().subscribe();
    repository.overview().subscribe();

    for (const url of [
      '/api/booking/customers',
      '/api/booking/products',
      '/api/booking/slots',
      '/api/booking/overview',
    ]) {
      http.expectOne(url).flush([]);
    }
  });

  it('hands a 409 to the caller as an error with its body', async () => {
    const placing = firstValueFrom(repository.place('SO-1', 'slot-a'));

    http
      .expectOne('/api/booking/orders/SO-1/place')
      .flush(
        { code: 'slot-full', message: 'full' },
        { status: 409, statusText: 'Conflict' },
      );

    await expect(placing).rejects.toMatchObject({
      status: 409,
      error: { code: 'slot-full' },
    });
  });
});
