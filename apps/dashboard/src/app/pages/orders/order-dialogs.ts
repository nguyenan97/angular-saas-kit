import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Badge,
  Button,
  DIALOG_DATA,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Table,
} from '@angular-saas-kit/ui';

import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatDate,
  formatMoney,
} from '../../data/format';
import type { Order } from '../../data/models';

/** An order's lines and total, opened from its row. */
@Component({
  selector: 'ask-order-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge,
    Button,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    Table,
  ],
  template: `
    <h2 askDialogTitle>{{ order.id }}</h2>
    <p askDialogDescription>
      {{ order.customer }}, {{ date(order.placedAt) }}.
      <ask-badge [variant]="badge[order.status]">{{
        label[order.status]
      }}</ask-badge>
    </p>

    <table askTable class="mt-4">
      <caption class="sr-only">
        Items in
        {{
          order.id
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col" class="text-right">Quantity</th>
          <th scope="col" class="text-right">Price</th>
          <th scope="col" class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        @for (line of order.lines; track $index) {
          <tr>
            <td>{{ line.product }}</td>
            <td class="text-right tabular-nums">{{ line.quantity }}</td>
            <td class="text-right tabular-nums">
              {{ money(line.unitPriceCents) }}
            </td>
            <td class="text-right tabular-nums">
              {{ money(line.quantity * line.unitPriceCents) }}
            </td>
          </tr>
        }
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colspan="3" class="text-right text-foreground">
            Total
          </th>
          <td class="text-right tabular-nums">{{ money(order.totalCents) }}</td>
        </tr>
      </tfoot>
    </table>

    <div askDialogFooter>
      <button type="button" askButton variant="outline" askDialogClose>
        Close
      </button>
    </div>
  `,
})
export class OrderDetails {
  protected readonly order = inject<Order>(DIALOG_DATA);
  protected readonly badge = STATUS_BADGE;
  protected readonly label = STATUS_LABEL;
  protected readonly money = formatMoney;
  protected readonly date = formatDate;
}

/**
 * "Refund ORD-1042?" An alert dialog: it interrupts, and Cancel comes first,
 * so the safe choice is the one that gets the focus.
 */
@Component({
  selector: 'ask-confirm-refund',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, DialogTitle, DialogDescription, DialogFooter, DialogClose],
  template: `
    <h2 askDialogTitle>Refund {{ order.id }}?</h2>
    <p askDialogDescription>
      {{ money(order.totalCents) }} goes back to {{ order.customer }}, and the
      order is marked refunded. This cannot be undone.
    </p>
    <div askDialogFooter>
      <button type="button" askButton variant="outline" askDialogClose>
        Cancel
      </button>
      <button
        type="button"
        askButton
        variant="destructive"
        [askDialogClose]="true"
      >
        Refund {{ money(order.totalCents) }}
      </button>
    </div>
  `,
})
export class ConfirmRefund {
  protected readonly order = inject<Order>(DIALOG_DATA);
  protected readonly money = formatMoney;
}
