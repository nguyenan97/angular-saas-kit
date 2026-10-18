import { Injectable, inject, signal } from '@angular/core';
import type {
  CreateOrderRequest,
  OrderDto,
} from '@angular-saas-kit/booking-contracts';
import { firstValueFrom, type Observable } from 'rxjs';

import { toFailure, type BookingFailure } from './failure';
import { OrdersRepository } from './orders.repository';

/**
 * The order a page is working on, and the commands on it, as signals. Provide
 * it with the page (`providers: [OrdersStore]`), so each page starts clean.
 * Commands resolve to the outcome and never throw: a failure lands in
 * `failure()` for the page to show.
 */
@Injectable()
export class OrdersStore {
  private readonly repository = inject(OrdersRepository);
  private readonly current = signal<OrderDto | undefined>(undefined);
  private readonly busy = signal<'loading' | 'saving' | null>(null);
  private readonly lastFailure = signal<BookingFailure | null>(null);
  /** The request the current draft was made from, to reuse it on a retry. */
  private draftRequest: string | null = null;

  readonly order = this.current.asReadonly();
  readonly failure = this.lastFailure.asReadonly();
  readonly loading = () => this.busy() === 'loading';
  readonly saving = () => this.busy() === 'saving';

  clearFailure(): void {
    this.lastFailure.set(null);
  }

  async load(id: string): Promise<void> {
    await this.run('loading', this.repository.get(id));
  }

  /**
   * Creates a draft from `request` and places it in the slot. When placing is
   * refused the draft stays, and a retry with the same lines places that
   * draft instead of making another.
   */
  async placeNew(
    request: CreateOrderRequest,
    slotId: string,
  ): Promise<OrderDto | undefined> {
    const key = JSON.stringify(request);
    let draft = this.current();
    if (draft?.status !== 'draft' || this.draftRequest !== key) {
      draft = await this.run('saving', this.repository.create(request));
      if (!draft) return undefined;
      this.draftRequest = key;
    }
    return this.run('saving', this.repository.place(draft.id, slotId));
  }

  async confirm(): Promise<boolean> {
    const order = this.current();
    if (!order) return false;
    return !!(await this.run('saving', this.repository.confirm(order.id)));
  }

  async cancel(reason: string): Promise<boolean> {
    const order = this.current();
    if (!order) return false;
    return !!(await this.run(
      'saving',
      this.repository.cancel(order.id, reason),
    ));
  }

  private async run(
    state: 'loading' | 'saving',
    request: Observable<OrderDto>,
  ): Promise<OrderDto | undefined> {
    this.busy.set(state);
    try {
      const order = await firstValueFrom(request);
      this.current.set(order);
      this.lastFailure.set(null);
      return order;
    } catch (error) {
      this.lastFailure.set(toFailure(error));
      return undefined;
    } finally {
      this.busy.set(null);
    }
  }
}
