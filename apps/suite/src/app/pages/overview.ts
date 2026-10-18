import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import {
  Button,
  Card,
  CardContent,
  Chart,
  type ChartPoint,
} from '@angular-saas-kit/ui';

import { formatMoney } from '../data/money';
import { ACTIVITY_URL, type ActivityEntry } from '../data/activity';

const DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "Oct 5" for a local calendar date. */
function dayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return DAY.format(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

/**
 * The suite at a glance: Booking's four figures, its orders per day, and the
 * activity feed of the domain events the suite's event bus carried. Each
 * section loads and fails on its own.
 */
@Component({
  selector: 'ask-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, CardContent, Chart, RouterLink],
  template: `
    <div class="flex flex-col gap-6">
      <section aria-labelledby="kpis-heading">
        <h2 id="kpis-heading" class="text-sm font-medium text-muted-foreground">
          Booking
        </h2>
        @if (overview.error()) {
          <div class="mt-3 flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The figures could not be loaded.</p>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="overview.reload()"
            >
              Retry
            </button>
          </div>
        } @else {
          <div
            class="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            [attr.aria-busy]="overview.isLoading()"
          >
            @for (kpi of kpis(); track kpi.label) {
              <ask-card class="p-5" data-kpi>
                <h3 class="text-xs font-medium text-muted-foreground">
                  {{ kpi.label }}
                </h3>
                <p class="mt-2 text-2xl font-semibold tracking-tight">
                  {{ kpi.value }}
                </p>
              </ask-card>
            }
          </div>
        }
      </section>

      <div class="grid gap-6 xl:grid-cols-3">
        <ask-card class="xl:col-span-2">
          <div askCardContent>
            @if (daily().length > 0) {
              <ask-chart
                type="bar"
                label="Orders per day, last 14 days"
                valueLabel="Orders"
                [color]="2"
                [data]="daily()"
              />
            } @else if (overview.isLoading()) {
              <p class="text-sm text-muted-foreground">Loading the chart...</p>
            } @else if (overview.error()) {
              <p class="text-sm text-muted-foreground">
                The chart is not available: the figures could not be loaded.
              </p>
            }
          </div>
        </ask-card>

        <ask-card>
          <section
            askCardContent
            aria-labelledby="activity-heading"
            class="flex flex-col gap-3"
          >
            <h2 id="activity-heading" class="text-sm font-semibold">
              Activity
            </h2>
            @if (activity.error()) {
              <div class="flex flex-wrap items-center gap-3" role="alert">
                <p class="text-sm">The activity could not be loaded.</p>
                <button
                  type="button"
                  askButton
                  variant="outline"
                  size="sm"
                  (click)="activity.reload()"
                >
                  Retry
                </button>
              </div>
            } @else {
              <ol
                class="flex flex-col gap-3"
                [attr.aria-busy]="activity.isLoading()"
              >
                @for (entry of activity.value() ?? []; track $index) {
                  <li class="flex flex-col gap-0.5 text-sm">
                    <a
                      class="underline-offset-4 hover:underline"
                      [routerLink]="['/booking/orders', entry.orderId]"
                      >{{ entry.text }}</a
                    >
                    <time
                      class="text-xs text-muted-foreground"
                      [attr.datetime]="entry.occurredAt"
                      >{{ time(entry.occurredAt) }}</time
                    >
                  </li>
                } @empty {
                  @if (!activity.isLoading()) {
                    <li class="text-sm text-muted-foreground">
                      Nothing has happened yet.
                    </li>
                  }
                }
              </ol>
            }
          </section>
        </ask-card>
      </div>
    </div>
  `,
})
export class Overview {
  private readonly repository = inject(OrdersRepository);
  private readonly http = inject(HttpClient);

  protected readonly overview = rxResource({
    stream: () => this.repository.overview(),
  });
  protected readonly activity = rxResource({
    stream: () => this.http.get<ActivityEntry[]>(ACTIVITY_URL),
  });

  /** The figures, or undefined while loading or after a failure (`value()` throws then). */
  private readonly figures = computed(() =>
    this.overview.hasValue() ? this.overview.value() : undefined,
  );

  protected readonly kpis = computed(() => {
    const figures = this.figures();
    if (!figures) return [];
    return [
      { label: 'Orders today', value: String(figures.ordersToday) },
      {
        label: 'Awaiting confirmation',
        value: String(figures.awaitingConfirmation),
      },
      {
        label: 'Revenue this week',
        value: formatMoney(figures.revenueThisWeek),
      },
      {
        label: 'Cancellation rate, 30 days',
        value: `${(figures.cancellationRate * 100).toFixed(1)}%`,
      },
    ];
  });

  protected readonly daily = computed<ChartPoint[]>(() =>
    (this.figures()?.daily ?? []).map((day) => ({
      label: dayLabel(day.date),
      value: day.orders,
    })),
  );

  protected time(iso: string): string {
    return TIME.format(new Date(iso));
  }
}
