import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { OrderStatus } from '@angular-saas-kit/booking-domain';
import type { OrderDto } from '@angular-saas-kit/booking-contracts';
import { OrdersStore } from '@angular-saas-kit/booking-data-access';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  DialogService,
  Table,
  Timeline,
  type TimelineItem,
} from '@angular-saas-kit/ui';
import { firstValueFrom, map } from 'rxjs';

import {
  STATUS_BADGE,
  STATUS_LABEL,
  failureMessage,
  formatDateTime,
  formatMoney,
  formatSlotDate,
} from '../format';
import { CancelOrderDialog } from './cancel-dialog';

const STEP_LABEL: Record<OrderStatus, string> = {
  draft: 'Created',
  placed: 'Placed',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

/** The status history as timeline steps, with what is still to come unless it was cancelled. */
export function statusSteps(order: OrderDto): TimelineItem[] {
  const reached: TimelineItem[] = order.history.map((change, i, all) => ({
    label: STEP_LABEL[change.status],
    state: i === all.length - 1 ? 'current' : 'complete',
    time: formatDateTime(change.at),
    dateTime: change.at,
    description: change.status === 'cancelled' ? order.cancelReason : undefined,
    tone: change.status === 'cancelled' ? 'destructive' : 'default',
  }));
  if (order.status === 'cancelled') return reached;
  const flow: OrderStatus[] = ['draft', 'placed', 'confirmed'];
  const upcoming = flow
    .filter(
      (status) => !order.history.some((change) => change.status === status),
    )
    .map((status): TimelineItem => ({
      label: STEP_LABEL[status],
      state: 'upcoming',
    }));
  return [...reached, ...upcoming];
}

/**
 * One sales order: its lines, totals and status timeline, and what can be
 * done next. A placed order can be confirmed; any order not yet cancelled
 * can be cancelled, with a reason asked in a dialog.
 */
@Component({
  selector: 'ask-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    Badge,
    Button,
    Card,
    CardContent,
    RouterLink,
    Table,
    Timeline,
  ],
  providers: [OrdersStore],
  template: `
    <div class="flex max-w-5xl flex-col gap-6">
      <p class="text-sm" role="status">{{ notice() }}</p>

      @if (refusal(); as message) {
        @if (store.order()) {
          <ask-alert variant="destructive">{{ message }}</ask-alert>
        } @else {
          <ask-alert variant="destructive">
            {{ message }}
            <a routerLink=".." class="underline underline-offset-4"
              >Back to orders</a
            >
          </ask-alert>
        }
      }
      @if (networkFailed()) {
        <ask-alert variant="destructive">
          <div class="flex flex-wrap items-center gap-3">
            <span>The order could not be loaded or changed.</span>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="reload()"
            >
              Retry
            </button>
          </div>
        </ask-alert>
      }

      @if (store.order(); as order) {
        <div class="flex flex-wrap items-center gap-3">
          <h2
            #heading
            tabindex="-1"
            class="text-lg font-semibold focus-visible:outline-none"
          >
            {{ order.id }}
          </h2>
          <ask-badge [variant]="badge[order.status]">{{
            label[order.status]
          }}</ask-badge>
          <div class="ml-auto flex gap-2">
            @if (order.status === 'placed') {
              <button
                type="button"
                askButton
                [disabled]="store.saving()"
                (click)="confirm()"
              >
                Confirm
              </button>
            }
            @if (order.status !== 'cancelled') {
              <button
                type="button"
                askButton
                variant="outline"
                [disabled]="store.saving()"
                (click)="cancel()"
              >
                Cancel order
              </button>
            }
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
          <ask-card class="lg:col-span-2">
            <div askCardContent class="flex flex-col gap-4">
              <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt class="text-muted-foreground">Customer</dt>
                <dd>{{ order.customerName }}</dd>
                <dt class="text-muted-foreground">Created</dt>
                <dd>{{ dateTime(order.createdAt) }}</dd>
                <dt class="text-muted-foreground">Delivery</dt>
                <dd>{{ delivery() }}</dd>
                @if (order.cancelReason) {
                  <dt class="text-muted-foreground">Cancel reason</dt>
                  <dd>{{ order.cancelReason }}</dd>
                }
              </dl>

              <div class="overflow-x-auto">
                <table askTable>
                  <caption class="sr-only">
                    Lines of
                    {{
                      order.id
                    }}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col" class="text-right">Quantity</th>
                      <th scope="col" class="text-right">Unit price</th>
                      <th scope="col" class="text-right">VAT</th>
                      <th scope="col" class="text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of order.lines; track line.productId) {
                      <tr>
                        <td>{{ line.name }}</td>
                        <td class="text-right tabular-nums">
                          {{ line.quantity }}
                        </td>
                        <td class="text-right tabular-nums">
                          {{ money(line.unitPrice) }}
                        </td>
                        <td class="text-right tabular-nums">
                          {{ line.vatRate }}%
                        </td>
                        <td class="text-right tabular-nums">
                          {{ money(line.net) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colspan="4" class="text-right">
                        Subtotal
                      </th>
                      <td class="text-right tabular-nums">
                        {{ money(order.totals.subtotal) }}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" colspan="4" class="text-right">VAT</th>
                      <td class="text-right tabular-nums">
                        {{ money(order.totals.vat) }}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" colspan="4" class="text-right">Total</th>
                      <td class="text-right font-medium tabular-nums">
                        {{ money(order.totals.total) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </ask-card>

          <ask-card>
            <div askCardContent class="flex flex-col gap-3">
              <h3 class="text-sm font-semibold">Status</h3>
              <ask-timeline label="Order status" [items]="steps()" />
            </div>
          </ask-card>
        </div>
      } @else if (store.loading()) {
        <p class="text-sm text-muted-foreground">Loading the order...</p>
      }
    </div>
  `,
})
export class OrderDetail {
  protected readonly store = inject(OrdersStore);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly dialogs = inject(DialogService);
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('id') ?? ''),
    ),
    { requireSync: true },
  );

  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;
  protected readonly money = formatMoney;
  protected readonly dateTime = formatDateTime;

  /** What the last action did, read out by the status region. */
  protected readonly notice = signal('');

  protected readonly refusal = computed(() =>
    failureMessage(this.store.failure()),
  );
  protected readonly networkFailed = computed(
    () => this.store.failure()?.kind === 'network',
  );
  protected readonly steps = computed(() => {
    const order = this.store.order();
    return order ? statusSteps(order) : [];
  });
  protected readonly delivery = computed(() => {
    const slot = this.store.order()?.deliverySlot;
    if (!slot) return 'Not booked yet';
    return `${formatSlotDate(slot.date)}, ${slot.window.slice(0, 2)}:00 to ${slot.window.slice(3)}:00`;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.store.load(id));
    });
  }

  /**
   * Says what happened, and moves focus to the order's heading: the button
   * that was pressed is gone once the order changes status.
   */
  private done(message: string): void {
    this.notice.set(message);
    afterNextRender(() => this.heading()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected reload(): void {
    void this.store.load(this.id());
  }

  protected async confirm(): Promise<void> {
    this.notice.set('');
    if (await this.store.confirm()) this.done(`${this.id()} was confirmed.`);
  }

  protected async cancel(): Promise<void> {
    this.notice.set('');
    const reason = await firstValueFrom(
      this.dialogs.open<string>(CancelOrderDialog, {
        data: { orderId: this.id() },
      }).closed,
    );
    if (!reason) return;
    if (await this.store.cancel(reason))
      this.done(`${this.id()} was cancelled.`);
  }
}
