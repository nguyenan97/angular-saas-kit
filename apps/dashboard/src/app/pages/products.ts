import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Pagination,
  SortHeader,
  Table,
} from '@angular-saas-kit/ui';

import { formatMoney } from '../data/format';
import { listQuery } from '../data/list-query';
import type { Product, ProductStatus } from '../data/models';

const STATUSES: readonly ProductStatus[] = ['active', 'draft', 'archived'];

const STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

const STATUS_BADGE: Record<ProductStatus, BadgeVariant> = {
  active: 'success',
  draft: 'neutral',
  archived: 'outline',
};

/** At or below this many left, a product is called low on stock. */
const LOW_STOCK = 5;

/** The catalogue: prices, stock and whether each product is on sale. */
@Component({
  selector: 'ask-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
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
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex min-w-48 flex-1 flex-col gap-1.5">
            <label askLabel for="products-search">Search</label>
            <input
              askInput
              id="products-search"
              type="search"
              placeholder="Name, SKU or category"
              [value]="list.search()"
              (input)="list.search.set(value($event))"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label askLabel for="products-status">Status</label>
            <select
              askInput
              id="products-status"
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

        <p class="text-sm text-muted-foreground" role="status">
          {{ summary() }}
        </p>

        @if (list.resource.error() && !list.current()) {
          <div class="flex flex-wrap items-center gap-3" role="alert">
            <p class="text-sm">The products could not be loaded.</p>
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
            aria-label="Products"
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
                      >Product</ask-sort-header
                    >
                  </th>
                  <th scope="col">
                    <ask-sort-header column="category" [(sort)]="list.sort"
                      >Category</ask-sort-header
                    >
                  </th>
                  <th scope="col" class="text-right">
                    <ask-sort-header column="priceCents" [(sort)]="list.sort"
                      >Price</ask-sort-header
                    >
                  </th>
                  <th scope="col" class="text-right">
                    <ask-sort-header column="stock" [(sort)]="list.sort"
                      >Stock</ask-sort-header
                    >
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (
                  product of list.current()?.items ?? [];
                  track product.id
                ) {
                  <tr>
                    <td>
                      <div class="font-medium">{{ product.name }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ product.sku }}
                      </div>
                    </td>
                    <td>{{ product.category }}</td>
                    <td class="text-right tabular-nums">
                      {{ money(product.priceCents) }}
                    </td>
                    <td class="text-right tabular-nums whitespace-nowrap">
                      @if (product.stock === 0) {
                        <ask-badge variant="destructive"
                          >Out of stock</ask-badge
                        >
                      } @else {
                        @if (product.stock <= lowStock) {
                          <ask-badge variant="warning" class="mr-2"
                            >Low</ask-badge
                          >
                        }
                        {{ product.stock }}
                      }
                    </td>
                    <td>
                      <ask-badge [variant]="badge[product.status]">{{
                        label[product.status]
                      }}</ask-badge>
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
                        No products match. Try another search or status.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <ask-pagination
            label="Products pages"
            [total]="list.current()?.total ?? 0"
            [pageSize]="list.pageSize"
            [(page)]="list.page"
          />
        }
      </div>
    </ask-card>
  `,
})
export class Products {
  protected readonly list = listQuery<Product>({
    url: '/api/products',
    sort: { column: 'name', direction: 'asc' },
  });

  protected readonly selectedStatus = computed(
    () => this.list.filters()['status'] ?? '',
  );

  protected readonly summary = computed(() => {
    const range = this.list.range();
    if (!range) {
      return this.list.resource.error() ? '' : 'Loading products...';
    }
    return range.total === 0
      ? 'No products match.'
      : `Showing ${range.first} to ${range.last} of ${range.total} products`;
  });

  protected readonly statuses = STATUSES;
  protected readonly label = STATUS_LABEL;
  protected readonly badge = STATUS_BADGE;
  protected readonly lowStock = LOW_STOCK;
  protected readonly money = formatMoney;
  protected readonly placeholders = [1, 2, 3, 4, 5];

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
