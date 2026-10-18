import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { OrderStatus } from '@angular-saas-kit/booking-domain';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Pagination,
  Tab,
  Table,
  Tabs,
} from '@angular-saas-kit/ui';

import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatDateTime,
  formatMoney,
} from '../format';

/** The status tabs, in the order an order goes through them. "" is every order. */
const TABS: readonly {
  readonly status: OrderStatus | '';
  readonly label: string;
}[] = [
  { status: '', label: 'All' },
  { status: 'draft', label: 'Draft' },
  { status: 'placed', label: 'Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'cancelled', label: 'Cancelled' },
];

/** How long the search box waits for the typing to stop before it asks. */
export const SEARCH_DEBOUNCE_MS = 300;

export const PAGE_SIZE = 10;

/**
 * Every sales order: a tab per status, a search by order id or customer, in
 * pages of ten. The query lives in the URL (`?status=placed&q=minh&page=2`),
 * so a filtered list can be shared, reloaded and gone back to.
 */
@Component({
  selector: 'ask-orders-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    Card,
    CardContent,
    Input,
    Label,
    NgTemplateOutlet,
    Pagination,
    RouterLink,
    Tab,
    Table,
    Tabs,
  ],
  template: `
    <ask-card>
      <div askCardContent class="flex flex-col gap-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <label askLabel for="orders-search">Search</label>
            <input
              askInput
              id="orders-search"
              type="search"
              placeholder="Order id or customer"
              [value]="search()"
              (input)="search.set(value($event))"
            />
          </div>
          <a askButton routerLink="new">New order</a>
        </div>

        <ask-tabs
          label="Order status"
          [selectedIndex]="tabIndex()"
          (selectedIndexChange)="selectTab($event)"
        >
          @for (tab of tabs; track tab.status) {
            <ask-tab [label]="tab.label">
              <ng-container [ngTemplateOutlet]="results" />
            </ask-tab>
          }
        </ask-tabs>
      </div>
    </ask-card>

    <ng-template #results>
      <!-- One element around the alert and the results, so focus has
           somewhere to stay while Retry swaps one for the other. -->
      <div
        data-results
        tabindex="-1"
        class="flex flex-col gap-4 focus-visible:outline-none"
      >
        <p class="text-sm text-muted-foreground" role="status">
          {{ summary() }}
        </p>

        @if (orders.error() && !orders.isLoading()) {
          <div class="flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The orders could not be loaded.</p>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="retry($event)"
            >
              Retry
            </button>
          </div>
        } @else {
          <div
            class="overflow-x-auto"
            tabindex="0"
            role="region"
            aria-label="Orders"
            [attr.aria-busy]="orders.isLoading()"
          >
            <table askTable [class.opacity-60]="orders.isLoading() && !!page()">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Created</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="text-right">Lines</th>
                  <th scope="col" class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (order of page()?.items ?? []; track order.id) {
                  <tr>
                    <td class="font-medium whitespace-nowrap">
                      <a
                        class="underline-offset-4 hover:underline"
                        [routerLink]="order.id"
                        >{{ order.id }}</a
                      >
                    </td>
                    <td>{{ order.customerName }}</td>
                    <td class="whitespace-nowrap">
                      {{ dateTime(order.createdAt) }}
                    </td>
                    <td>
                      <ask-badge [variant]="badge[order.status]">{{
                        label[order.status]
                      }}</ask-badge>
                    </td>
                    <td class="text-right tabular-nums">
                      {{ order.lineCount }}
                    </td>
                    <td class="text-right tabular-nums">
                      {{ money(order.total) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-muted-foreground">
                      {{
                        orders.isLoading()
                          ? 'Loading orders...'
                          : 'No orders match. Try another search or status.'
                      }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <ask-pagination
            label="Orders pages"
            [total]="page()?.total ?? 0"
            [pageSize]="pageSize"
            [page]="pageNumber()"
            (pageChange)="go({ page: $event })"
          />
        }
      </div>
    </ng-template>
  `,
})
export class OrdersList {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(OrdersRepository);
  private readonly query = toSignal(this.route.queryParamMap, {
    requireSync: true,
  });

  protected readonly tabs = TABS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;
  protected readonly money = formatMoney;
  protected readonly dateTime = formatDateTime;

  /** A status the tabs know, or '' (every order) for anything else in the URL. */
  protected readonly status = computed(() => {
    const status = this.query().get('status') ?? '';
    return TABS.some((tab) => tab.status === status) ? status : '';
  });
  protected readonly q = computed(() => this.query().get('q') ?? '');
  protected readonly pageNumber = computed(() =>
    Math.max(1, Math.trunc(Number(this.query().get('page'))) || 1),
  );
  protected readonly tabIndex = computed(() =>
    Math.max(
      0,
      TABS.findIndex((tab) => tab.status === this.status()),
    ),
  );

  /** What is in the box; it reaches the URL once the typing stops. */
  protected readonly search = linkedSignal(() => this.q());

  protected readonly orders = rxResource({
    params: () => ({
      status: this.status(),
      q: this.q(),
      page: this.pageNumber(),
      pageSize: PAGE_SIZE,
    }),
    stream: ({ params }) => this.repository.list(params),
  });

  /** The last page that arrived, kept while the next one loads. */
  protected readonly page =
    signal<ReturnType<typeof this.orders.value>>(undefined);

  protected readonly summary = computed(() => {
    const shown = this.page();
    if (!shown) return this.orders.isLoading() ? 'Loading orders...' : '';
    if (shown.total === 0) return 'No orders match.';
    const first = (shown.page - 1) * shown.pageSize + 1;
    const last = Math.min(shown.page * shown.pageSize, shown.total);
    return `Showing ${first} to ${last} of ${shown.total} orders`;
  });

  constructor() {
    effect(() => {
      if (this.orders.hasValue()) this.page.set(this.orders.value());
    });
    effect((onCleanup) => {
      const typed = this.search().trim();
      if (typed === untracked(this.q)) return;
      const timer = setTimeout(
        () => this.go({ q: typed, page: 1 }),
        SEARCH_DEBOUNCE_MS,
      );
      onCleanup(() => clearTimeout(timer));
    });
  }

  /**
   * Asks again. The alert and its Retry button give way while the list
   * reloads, so focus moves to what holds the alert and the results.
   */
  protected retry(event: Event): void {
    (event.target as HTMLElement)
      .closest<HTMLElement>('[data-results]')
      ?.focus();
    this.orders.reload();
  }

  protected selectTab(index: number): void {
    this.go({ status: TABS[index]?.status ?? '', page: 1 });
  }

  /** Changes the query in the URL; an empty value or page 1 leaves its parameter out. */
  protected go(change: { status?: string; q?: string; page?: number }): void {
    const next = {
      status: change.status ?? this.status(),
      q: change.q ?? this.q(),
      page: change.page ?? this.pageNumber(),
    };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: next.status || null,
        q: next.q || null,
        page: next.page > 1 ? next.page : null,
      },
    });
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
