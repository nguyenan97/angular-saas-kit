import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Badge } from '../badge/badge';
import { type Sort, SortHeader, Table } from './table';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly status: 'Paid' | 'Pending';
  readonly total: number;
}

const ORDERS: Order[] = [
  { id: '#1042', customer: 'Alex Morgan', status: 'Paid', total: 249 },
  { id: '#1041', customer: 'Sam Lee', status: 'Pending', total: 1280 },
  { id: '#1040', customer: 'Jordan Diaz', status: 'Paid', total: 87 },
  { id: '#1039', customer: 'Riley Chen', status: 'Paid', total: 512 },
];

/** A sortable table, with its sort held in a signal. */
@Component({
  selector: 'ask-story-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, SortHeader, Table],
  template: `
    <div
      class="overflow-x-auto"
      tabindex="0"
      role="region"
      aria-label="Latest orders"
    >
      <table askTable>
        <caption class="sr-only">
          Latest orders
        </caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">
              <ask-sort-header column="customer" [(sort)]="sort"
                >Customer</ask-sort-header
              >
            </th>
            <th scope="col">Status</th>
            <th scope="col" class="text-right">
              <ask-sort-header column="total" [(sort)]="sort"
                >Total</ask-sort-header
              >
            </th>
          </tr>
        </thead>
        <tbody>
          @for (order of sorted(); track order.id) {
            <tr>
              <td>{{ order.id }}</td>
              <td>{{ order.customer }}</td>
              <td>
                <ask-badge
                  [variant]="order.status === 'Paid' ? 'success' : 'warning'"
                  >{{ order.status }}</ask-badge
                >
              </td>
              <td class="text-right tabular-nums">\${{ order.total }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
class OrdersTable {
  protected readonly sort = signal<Sort | null>(null);

  protected readonly sorted = computed(() => {
    const sort = this.sort();
    if (!sort) return ORDERS;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...ORDERS].sort((a, b) => {
      const key = sort.column as 'customer' | 'total';
      return a[key] < b[key] ? -factor : a[key] > b[key] ? factor : 0;
    });
  });
}

const meta: Meta = {
  title: 'Components/Table',
  decorators: [moduleMetadata({ imports: [OrdersTable] })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/** A sort header is a button; the sorted column's header cell gets aria-sort. */
export const Sortable: Story = {
  render: () => ({ template: `<ask-story-orders-table />` }),
};
