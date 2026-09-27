import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Pagination,
  SortHeader,
  Table,
} from '@angular-saas-kit/ui';

import { formatDate, formatMoney } from '../data/format';
import { listQuery } from '../data/list-query';
import type { Customer } from '../data/models';

/** Everyone who has an account: what they have ordered and spent. */
@Component({
  selector: 'ask-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    Card,
    CardContent,
    Input,
    Label,
    Pagination,
    SortHeader,
    Table,
  ],
  template: `
    <ask-card>
      <div askCardContent class="flex flex-col gap-4">
        <div class="flex max-w-sm flex-col gap-1.5">
          <label askLabel for="customers-search">Search</label>
          <input
            askInput
            id="customers-search"
            type="search"
            placeholder="Name, email or country"
            [value]="list.search()"
            (input)="list.search.set(value($event))"
          />
        </div>

        <p class="text-sm text-muted-foreground" role="status">
          {{ summary() }}
        </p>

        @if (list.resource.error() && !list.current()) {
          <div class="flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The customers could not be loaded.</p>
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
            aria-label="Customers"
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
                    <ask-sort-header column="name" [(sort)]="list.sort"
                      >Customer</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="country" [(sort)]="list.sort"
                      >Country</ask-sort-header
                    >
                  </th>
                  <th scope="col" class="text-right">
                    <ask-sort-header column="orders" [(sort)]="list.sort"
                      >Orders</ask-sort-header
                    >
                  </th>
                  <th scope="col" class="text-right">
                    <ask-sort-header column="spentCents" [(sort)]="list.sort"
                      >Spent</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="joinedAt" [(sort)]="list.sort"
                      >Joined</ask-sort-header
                    >
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (
                  customer of list.current()?.items ?? [];
                  track customer.id
                ) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <span
                          class="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                          aria-hidden="true"
                          >{{ initials(customer.name) }}</span
                        >
                        <div>
                          <div class="font-medium">{{ customer.name }}</div>
                          <div class="text-xs text-muted-foreground">
                            {{ customer.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="whitespace-nowrap">{{ customer.country }}</td>
                    <td class="text-right tabular-nums">
                      {{ customer.orders }}
                    </td>
                    <td class="text-right tabular-nums">
                      {{ money(customer.spentCents) }}
                    </td>
                    <td class="whitespace-nowrap">
                      {{ date(customer.joinedAt) }}
                    </td>
                  </tr>
                } @empty {
                  @if (list.resource.isLoading()) {
                    @for (placeholder of placeholders; track placeholder) {
                      <tr aria-hidden="true">
                        <td colspan="5">
                          <div class="h-8 animate-pulse rounded bg-muted"></div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="5" class="text-muted-foreground">
                        No customers match that search.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <ask-pagination
            label="Customers pages"
            [total]="list.current()?.total ?? 0"
            [pageSize]="list.pageSize"
            [(page)]="list.page"
          />
        }
      </div>
    </ask-card>
  `,
})
export class Customers {
  protected readonly list = listQuery<Customer>({
    url: '/api/customers',
    sort: { column: 'name', direction: 'asc' },
  });

  protected readonly summary = computed(() => {
    const range = this.list.range();
    if (!range) {
      return this.list.resource.error() ? '' : 'Loading customers...';
    }
    return range.total === 0
      ? 'No customers match.'
      : `Showing ${range.first} to ${range.last} of ${range.total} customers`;
  });

  protected readonly money = formatMoney;
  protected readonly date = formatDate;
  protected readonly placeholders = [1, 2, 3, 4, 5];

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
