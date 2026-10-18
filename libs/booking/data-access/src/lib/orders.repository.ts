import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BOOKING_API,
  orderUrl,
  type BookingOverviewDto,
  type CreateOrderRequest,
  type CustomerDto,
  type OrderDto,
  type OrderSummaryDto,
  type Page,
  type ProductDto,
  type SlotDto,
} from '@angular-saas-kit/booking-contracts';
import type { Observable } from 'rxjs';

/** What the orders list asks for. Empty values are left out of the request. */
export interface OrdersQuery {
  readonly status?: string;
  readonly q?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/**
 * The Booking API over HTTP. In the suite's development and demo builds the
 * mock backend answers; a real backend has to serve the same paths. Errors
 * reach the caller as `HttpErrorResponse`; `toFailure` sorts them.
 *
 * Provide it next to `provideHttpClient(...)`, in the same injector: a
 * root-provided repository would take the root `HttpClient`, which has none
 * of the interceptors (the mock backend among them) a route adds.
 */
@Injectable()
export class OrdersRepository {
  private readonly http = inject(HttpClient);

  list(query: OrdersQuery): Observable<Page<OrderSummaryDto>> {
    const params: Record<string, string | number> = {};
    const q = query.q?.trim();
    if (q) params['q'] = q;
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = query.page;
    if (query.pageSize) params['pageSize'] = query.pageSize;
    return this.http.get<Page<OrderSummaryDto>>(BOOKING_API.orders, {
      params,
    });
  }

  get(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(orderUrl(id));
  }

  create(request: CreateOrderRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>(BOOKING_API.orders, request);
  }

  place(id: string, slotId: string): Observable<OrderDto> {
    return this.http.post<OrderDto>(orderUrl(id, 'place'), { slotId });
  }

  confirm(id: string): Observable<OrderDto> {
    return this.http.post<OrderDto>(orderUrl(id, 'confirm'), {});
  }

  cancel(id: string, reason: string): Observable<OrderDto> {
    return this.http.post<OrderDto>(orderUrl(id, 'cancel'), { reason });
  }

  customers(): Observable<CustomerDto[]> {
    return this.http.get<CustomerDto[]>(BOOKING_API.customers);
  }

  products(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(BOOKING_API.products);
  }

  slots(): Observable<SlotDto[]> {
    return this.http.get<SlotDto[]>(BOOKING_API.slots);
  }

  overview(): Observable<BookingOverviewDto> {
    return this.http.get<BookingOverviewDto>(BOOKING_API.overview);
  }
}
