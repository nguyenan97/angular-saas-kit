import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chart,
  type ChartPoint,
  Table,
} from '@angular-saas-kit/ui';

import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatDate,
  formatKpiChange,
  formatKpiValue,
  formatMoney,
  isGoodChange,
} from '../data/format';
import type { Order, OverviewStats, Page } from '../data/models';

/**
 * The last 30 days at a glance, and the latest orders.
 *
 * Both come from the API (`/api/stats`, `/api/orders`), which the mock
 * backend answers in development and in the demo. Each section shows its
 * own loading, error and empty states, so one slow request does not hold
 * the other back.
 */
@Component({
  selector: 'ask-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Chart,
    RouterLink,
    Table,
  ],
  template: `
    <section aria-labelledby="kpis-heading">
      <h2 id="kpis-heading" class="text-sm font-medium text-muted-foreground">
        Last 30 days
      </h2>

      @if (stats.error()) {
        <div class="mt-3 flex flex-wrap items-center gap-3" role="alert">
          <p class="text-sm">The figures could not be loaded.</p>
          <button
            type="button"
            askButton
            variant="outline"
            size="sm"
            (click)="stats.reload()"
          >
            Try again
          </button>
        </div>
      } @else {
        <div
          class="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          [attr.aria-busy]="stats.isLoading()"
        >
          @for (kpi of stats.value()?.kpis ?? []; track kpi.key) {
            <ask-card class="p-5">
              <h3 class="text-xs font-medium text-muted-foreground">
                {{ kpi.label }}
              </h3>
              <p class="mt-2 text-2xl font-semibold tracking-tight">
                {{ value(kpi) }}
              </p>
              <p class="mt-1 text-xs">
                <span
                  class="font-medium"
                  [class.text-success]="good(kpi)"
                  [class.text-destructive]="!good(kpi)"
                  >{{ change(kpi) }}</span
                >
                <span class="text-muted-foreground">
                  vs the 30 days before</span
                >
              </p>
            </ask-card>
          } @empty {
            @for (placeholder of placeholders; track placeholder) {
              <ask-card class="p-5" aria-hidden="true">
                <div class="h-3 w-20 animate-pulse rounded bg-muted"></div>
                <div class="mt-3 h-7 w-28 animate-pulse rounded bg-muted"></div>
                <div class="mt-2 h-3 w-36 animate-pulse rounded bg-muted"></div>
              </ask-card>
            }
          }
        </div>

        @if (revenue().length) {
          <ask-card class="mt-4">
            <div askCardContent>
              <ask-chart
                type="line"
                label="Revenue per day"
                valueLabel="Revenue"
                [height]="200"
                [data]="revenue()"
                [format]="dollars"
              />
              <a askButton variant="link" routerLink="/analytics" class="mt-2">
                See the analytics
              </a>
            </div>
          </ask-card>
        }
      }
    </section>

    <ask-card class="mt-8">
      <header askCardHeader class="flex-row items-center justify-between">
        <h2 askCardTitle>Latest orders</h2>
        <a askButton variant="link" routerLink="/orders">View all orders</a>
      </header>
      <div askCardContent>
        @if (latest.error()) {
          <div class="flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The orders could not be loaded.</p>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="latest.reload()"
            >
              Try again
            </button>
          </div>
        } @else {
          <div
            class="overflow-x-auto"
            tabindex="0"
            role="region"
            aria-label="Latest orders"
            [attr.aria-busy]="latest.isLoading()"
          >
            <table askTable>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (order of latest.value()?.items ?? []; track order.id) {
                  <tr>
                    <td class="font-medium">{{ order.id }}</td>
                    <td>{{ order.customer }}</td>
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
                  </tr>
                } @empty {
                  @if (latest.isLoading()) {
                    @for (placeholder of placeholders; track placeholder) {
                      <tr aria-hidden="true">
                        <td colspan="5">
                          <div class="h-4 animate-pulse rounded bg-muted"></div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="5" class="text-muted-foreground">
                        No orders yet.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </ask-card>
  `,
})
export class Overview {
  protected readonly stats = httpResource<OverviewStats>(() => '/api/stats');
  protected readonly latest = httpResource<Page<Order>>(() => ({
    url: '/api/orders',
    params: { sort: 'placedAt', dir: 'desc', pageSize: 5 },
  }));

  /** The daily revenue behind the figures, for the chart; none until they load. */
  protected readonly revenue = computed<ChartPoint[]>(() =>
    this.stats.hasValue()
      ? this.stats.value().daily.map((day) => ({
          label: formatDate(day.date),
          value: day.revenueCents,
        }))
      : [],
  );
  protected readonly dollars = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;

  protected readonly value = formatKpiValue;
  protected readonly change = formatKpiChange;
  protected readonly good = isGoodChange;
  protected readonly money = formatMoney;
  protected readonly date = formatDate;
}
