import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
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
  formatMoney,
} from '../data/format';
import {
  ANALYTICS_PERIODS,
  type Analytics as AnalyticsData,
  type AnalyticsPeriod,
} from '../data/models';

const WHOLE_DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const dollars = (cents: number) => WHOLE_DOLLARS.format(cents / 100);
const count = (value: number) => value.toLocaleString('en-US');

/**
 * Sales over the last 7, 30 or 90 days: revenue and orders per day, revenue
 * by category, orders by status, and the best-selling products. Every chart
 * carries its numbers as a table.
 */
@Component({
  selector: 'ask-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Chart,
    Table,
  ],
  template: `
    <fieldset class="flex flex-wrap items-center gap-2">
      <legend class="mb-2 text-sm font-medium">Period</legend>
      @for (period of periods; track period) {
        <label [class]="option(days() === period)">
          <input
            type="radio"
            name="analytics-period"
            class="absolute inset-0 m-0 size-full cursor-pointer opacity-0"
            [value]="period"
            [checked]="days() === period"
            (change)="days.set(period)"
          />
          Last {{ period }} days
        </label>
      }
    </fieldset>

    <p class="sr-only" role="status">{{ status() }}</p>

    @if (report.error() && !current()) {
      <div class="mt-6 flex flex-wrap items-center gap-3" role="alert">
        <p class="text-sm">The figures could not be loaded.</p>
        <button
          type="button"
          askButton
          variant="outline"
          size="sm"
          (click)="report.reload()"
        >
          Try again
        </button>
      </div>
    } @else if (current(); as data) {
      <div
        class="mt-6 grid gap-6 transition-opacity lg:grid-cols-2"
        [class.opacity-60]="report.isLoading()"
        [attr.aria-busy]="report.isLoading()"
      >
        <ask-card class="lg:col-span-2">
          <div askCardContent>
            <ask-chart
              type="line"
              label="Revenue per day"
              valueLabel="Revenue"
              [color]="1"
              [data]="revenue()"
              [format]="dollars"
            />
          </div>
        </ask-card>

        <ask-card>
          <div askCardContent>
            <ask-chart
              type="bar"
              label="Orders per day"
              valueLabel="Orders"
              [color]="2"
              [height]="200"
              [data]="orders()"
              [format]="count"
            />
          </div>
        </ask-card>

        <ask-card>
          <div askCardContent>
            <ask-chart
              type="bar"
              label="Revenue by category"
              categoryLabel="Category"
              valueLabel="Revenue"
              [color]="3"
              [height]="200"
              [data]="categories()"
              [format]="dollars"
            />
          </div>
        </ask-card>

        <ask-card>
          <header askCardHeader>
            <h2 askCardTitle>Orders by status</h2>
          </header>
          <div askCardContent>
            <table askTable>
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col" class="text-right">Orders</th>
                  <th scope="col" class="text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                @for (row of data.byStatus; track row.status) {
                  <tr>
                    <td>
                      <ask-badge [variant]="badge[row.status]">{{
                        label[row.status]
                      }}</ask-badge>
                    </td>
                    <td class="text-right tabular-nums">{{ row.orders }}</td>
                    <td class="text-right tabular-nums">
                      {{ share(row.orders) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ask-card>

        <ask-card>
          <header askCardHeader>
            <h2 askCardTitle>Best-selling products</h2>
          </header>
          <div askCardContent>
            <table askTable>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" class="text-right">Units</th>
                  <th scope="col" class="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                @for (row of data.topProducts; track row.product) {
                  <tr>
                    <td>{{ row.product }}</td>
                    <td class="text-right tabular-nums">{{ row.units }}</td>
                    <td class="text-right tabular-nums">
                      {{ money(row.revenueCents) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="text-muted-foreground">
                      No sales in this period.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ask-card>
      </div>
    } @else {
      <div class="mt-6 grid gap-6 lg:grid-cols-2" aria-busy="true">
        @for (placeholder of [1, 2, 3]; track placeholder) {
          <div
            class="h-72 animate-pulse rounded-lg bg-muted first:lg:col-span-2"
            aria-hidden="true"
          ></div>
        }
      </div>
    }
  `,
})
export class Analytics {
  protected readonly periods = ANALYTICS_PERIODS;
  protected readonly days = signal<AnalyticsPeriod>(30);

  protected readonly report = httpResource<AnalyticsData>(() => ({
    url: '/api/analytics',
    params: { days: this.days() },
  }));

  /** The last report that arrived, kept on screen while the next loads. */
  protected readonly current = signal<AnalyticsData | undefined>(undefined);

  protected readonly revenue = computed<ChartPoint[]>(() =>
    (this.current()?.daily ?? []).map((day) => ({
      label: formatDate(day.date),
      value: day.revenueCents,
    })),
  );
  protected readonly orders = computed<ChartPoint[]>(() =>
    (this.current()?.daily ?? []).map((day) => ({
      label: formatDate(day.date),
      value: day.orders,
    })),
  );
  protected readonly categories = computed<ChartPoint[]>(() =>
    (this.current()?.byCategory ?? []).map((row) => ({
      label: row.category,
      value: row.revenueCents,
    })),
  );

  /** What a screen reader hears when a new period has loaded. */
  protected readonly status = computed(() => {
    const data = this.current();
    return data && !this.report.isLoading()
      ? `Showing the last ${data.days} days.`
      : '';
  });

  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;
  protected readonly money = formatMoney;
  protected readonly dollars = dollars;
  protected readonly count = count;

  constructor() {
    effect(() => {
      if (this.report.hasValue()) {
        this.current.set(this.report.value());
      }
    });
  }

  protected share(orders: number): string {
    const total = (this.current()?.byStatus ?? []).reduce(
      (sum, row) => sum + row.orders,
      0,
    );
    return total === 0 ? '0%' : `${Math.round((orders / total) * 100)}%`;
  }

  protected option(selected: boolean): string {
    return [
      'relative cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors',
      'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
      selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
    ].join(' ');
  }
}
