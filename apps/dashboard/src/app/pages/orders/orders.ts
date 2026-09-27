import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DialogService,
  Icon,
  Input,
  Label,
  MenuItem,
  MenuPanel,
  MenuSeparator,
  MenuTrigger,
  Pagination,
  SortHeader,
  Table,
} from '@angular-saas-kit/ui';
import { Ellipsis, Eye, RotateCcw } from 'lucide';
import { firstValueFrom } from 'rxjs';

import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatDate,
  formatMoney,
} from '../../data/format';
import { listQuery } from '../../data/list-query';
import { ORDER_STATUSES, type Order } from '../../data/models';
import { ConfirmRefund, OrderDetails } from './order-dialogs';

/** Lets the menu that was clicked close, and hand focus back to its button, first. */
const afterMenuCloses = () =>
  new Promise<void>((resolve) => setTimeout(resolve));

/**
 * Every order: searchable, filterable by status, sortable by column, in
 * pages of ten. Each row has a menu: its details, and a refund for a paid
 * order, after a confirmation.
 */
@Component({
  selector: 'ask-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    Card,
    CardContent,
    Icon,
    Input,
    Label,
    MenuItem,
    MenuPanel,
    MenuSeparator,
    MenuTrigger,
    Pagination,
    SortHeader,
    Table,
  ],
  template: `
    <ask-card>
      <div askCardContent class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <label askLabel for="orders-search">Search</label>
            <input
              askInput
              id="orders-search"
              type="search"
              placeholder="Order, customer or email"
              [value]="list.search()"
              (input)="list.search.set(value($event))"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label askLabel for="orders-status">Status</label>
            <select
              askInput
              id="orders-status"
              class="w-40"
              (change)="list.filter('status', value($event))"
            >
              <option value="">All</option>
              @for (status of statuses; track status) {
                <option
                  [value]="status"
                  [selected]="status === selectedStatus()"
                >
                  {{ label[status] }}
                </option>
              }
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm text-muted-foreground" role="status">
            {{ summary() }}
          </p>
          <p class="text-sm" role="status">{{ notice() }}</p>
        </div>

        @if (list.resource.error() && !list.current()) {
          <div class="flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The orders could not be loaded.</p>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="list.resource.reload()"
            >
              Try again
            </button>
          </div>
        } @else {
          <div
            class="overflow-x-auto"
            tabindex="0"
            role="region"
            aria-label="Orders"
            [attr.aria-busy]="list.resource.isLoading()"
          >
            <table
              askTable
              class="transition-opacity"
              [class.opacity-60]="list.resource.isLoading() && !!list.current()"
            >
              <thead>
                <tr>
                  <th scope="col">
                    <ask-sort-header column="id" [(sort)]="list.sort"
                      >Order</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="customer" [(sort)]="list.sort"
                      >Customer</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="placedAt" [(sort)]="list.sort"
                      >Date</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="status" [(sort)]="list.sort"
                      >Status</ask-sort-header
                    >
                  </th>
                  <th scope="col" class="text-right">
                    <ask-sort-header column="totalCents" [(sort)]="list.sort"
                      >Total</ask-sort-header
                    >
                  </th>
                  <th scope="col"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                @for (order of list.current()?.items ?? []; track order.id) {
                  <tr>
                    <td class="font-medium whitespace-nowrap">
                      {{ order.id }}
                    </td>
                    <td>
                      <div>{{ order.customer }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ order.email }}
                      </div>
                    </td>
                    <td class="whitespace-nowrap">
                      {{ date(order.placedAt) }}
                    </td>
                    <td>
                      <ask-badge [variant]="badge[order.status]">{{
                        label[order.status]
                      }}</ask-badge>
                    </td>
                    <td class="text-right tabular-nums">
                      {{ money(order.totalCents) }}
                    </td>
                    <td class="w-12 text-right">
                      <button
                        type="button"
                        askButton
                        variant="ghost"
                        size="icon"
                        [askMenuTrigger]="actions"
                        [menuData]="{ $implicit: order }"
                        [attr.aria-label]="'Actions for ' + order.id"
                      >
                        <ask-icon [icon]="icons.more" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  @if (list.resource.isLoading()) {
                    @for (placeholder of placeholders; track placeholder) {
                      <tr aria-hidden="true">
                        <td colspan="6">
                          <div class="h-5 animate-pulse rounded bg-muted"></div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="6" class="text-muted-foreground">
                        No orders match. Try another search or status.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <ask-pagination
            label="Orders pages"
            [total]="list.current()?.total ?? 0"
            [pageSize]="list.pageSize"
            [(page)]="list.page"
          />
        }
      </div>
    </ask-card>

    <ng-template #actions let-order>
      <div askMenu>
        <button type="button" askMenuItem (triggered)="view(order)">
          <ask-icon [icon]="icons.view" />
          View details
        </button>
        <div askMenuSeparator></div>
        <button
          type="button"
          askMenuItem
          [disabled]="order.status !== 'paid'"
          (triggered)="refund(order)"
        >
          <ask-icon [icon]="icons.refund" />
          Refund
        </button>
      </div>
    </ng-template>
  `,
})
export class Orders {
  private readonly http = inject(HttpClient);
  private readonly dialogs = inject(DialogService);

  protected readonly list = listQuery<Order>({
    url: '/api/orders',
    sort: { column: 'placedAt', direction: 'desc' },
  });

  /** What the last action did, read out by the status region. */
  protected readonly notice = signal('');

  protected readonly selectedStatus = computed(
    () => this.list.filters()['status'] ?? '',
  );

  protected readonly summary = computed(() => {
    const range = this.list.range();
    if (!range) {
      return this.list.resource.error() ? '' : 'Loading orders...';
    }
    return range.total === 0
      ? 'No orders match.'
      : `Showing ${range.first} to ${range.last} of ${range.total} orders`;
  });

  protected readonly statuses = ORDER_STATUSES;
  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;
  protected readonly money = formatMoney;
  protected readonly date = formatDate;
  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly icons = { more: Ellipsis, view: Eye, refund: RotateCcw };

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected async view(order: Order): Promise<void> {
    await afterMenuCloses();
    this.dialogs.open(OrderDetails, { data: order, width: '36rem' });
  }

  protected async refund(order: Order): Promise<void> {
    await afterMenuCloses();
    const confirmed = await firstValueFrom(
      this.dialogs.open<boolean>(ConfirmRefund, {
        data: order,
        role: 'alertdialog',
      }).closed,
    );
    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.patch<Order>(`/api/orders/${order.id}`, {
          status: 'refunded',
        }),
      );
      this.notice.set(`${order.id} was refunded.`);
      this.list.resource.reload();
    } catch {
      this.notice.set(
        `${order.id} could not be refunded. Nothing changed; try again.`,
      );
    }
  }
}
