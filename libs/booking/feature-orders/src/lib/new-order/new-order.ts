import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { money } from '@angular-saas-kit/shared-kernel';
import {
  lineNet,
  orderLine,
  orderTotals,
  type OrderLine,
} from '@angular-saas-kit/booking-domain';
import type { CreateOrderRequest } from '@angular-saas-kit/booking-contracts';
import {
  OrdersRepository,
  OrdersStore,
} from '@angular-saas-kit/booking-data-access';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Combobox,
  Input,
  Label,
  Table,
  type ComboboxOption,
} from '@angular-saas-kit/ui';

import { ERROR_MESSAGE, failureMessage, formatMoney } from '../format';
import { SlotPicker } from './slot-picker';

interface DraftLine {
  readonly productId: string;
  readonly quantity: number;
}

/**
 * A new sales order: a customer, lines, a delivery slot. The totals and each
 * line's checks come from `booking-domain` as the person types, the same
 * rules the backend applies when the order is placed. Placing creates the
 * draft and places it; a refusal is shown above the form in words.
 */
@Component({
  selector: 'ask-new-order',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Alert,
    Button,
    Card,
    CardContent,
    Combobox,
    Input,
    Label,
    SlotPicker,
    Table,
  ],
  providers: [OrdersStore],
  template: `
    <form
      class="flex max-w-4xl flex-col gap-6"
      novalidate
      (submit)="submit($event)"
    >
      @if (referenceFailed()) {
        <ask-alert variant="destructive">
          <div class="flex flex-wrap items-center gap-3">
            <span>The customers, products or slots could not be loaded.</span>
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="reloadReference()"
            >
              Retry
            </button>
          </div>
        </ask-alert>
      }
      @if (refusal(); as message) {
        <ask-alert variant="destructive" tabindex="-1">{{ message }}</ask-alert>
      }
      @if (networkFailed()) {
        <ask-alert variant="destructive" tabindex="-1">
          <div class="flex flex-wrap items-center gap-3">
            <span
              >The order could not be sent. Check the connection and try
              again.</span
            >
            <button
              type="button"
              askButton
              variant="outline"
              size="sm"
              (click)="place()"
            >
              Retry
            </button>
          </div>
        </ask-alert>
      }

      <ask-card>
        <div askCardContent class="flex flex-col gap-2">
          <h2 class="text-base font-semibold">Customer</h2>
          <label askLabel for="order-customer">Customer</label>
          <ask-combobox
            inputId="order-customer"
            placeholder="Search customers"
            [options]="customerOptions()"
            [(value)]="customerId"
            [invalid]="showErrors() && !customerId()"
            [describedBy]="
              showErrors() && !customerId() ? 'order-customer-error' : ''
            "
          />
          @if (showErrors() && !customerId()) {
            <p id="order-customer-error" class="text-sm text-destructive">
              Choose a customer.
            </p>
          }
        </div>
      </ask-card>

      <ask-card>
        <div askCardContent class="flex flex-col gap-4">
          <h2 class="text-base font-semibold">Lines</h2>
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex min-w-56 flex-1 flex-col gap-1.5">
              <label askLabel for="order-product">Product</label>
              <select
                askInput
                id="order-product"
                [value]="productToAdd()"
                (change)="productToAdd.set(value($event))"
              >
                <option value="">Choose a product</option>
                @for (product of productList(); track product.id) {
                  <option [value]="product.id">
                    {{ product.name }}, {{ money(product.unitPrice) }}
                  </option>
                }
              </select>
            </div>
            <div class="flex w-28 flex-col gap-1.5">
              <label askLabel for="order-quantity">Quantity</label>
              <input
                askInput
                id="order-quantity"
                type="number"
                min="1"
                max="100000"
                [value]="quantityToAdd()"
                (input)="quantityToAdd.set(value($event))"
              />
            </div>
            <button
              type="button"
              askButton
              variant="outline"
              [disabled]="!productToAdd()"
              (click)="addLine()"
            >
              Add line
            </button>
          </div>

          @if (rows().length > 0) {
            <div class="overflow-x-auto">
              <table askTable>
                <caption class="sr-only">
                  Lines of the new order
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col" class="text-right">Unit price</th>
                    <th scope="col" class="text-right">Quantity</th>
                    <th scope="col" class="text-right">Net</th>
                    <th scope="col"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track row.productId) {
                    <tr>
                      <td>{{ row.name }}</td>
                      <td class="text-right tabular-nums">
                        {{ row.unitPrice }}
                      </td>
                      <td class="text-right">
                        <input
                          askInput
                          type="number"
                          min="1"
                          max="100000"
                          class="ml-auto w-24 text-right"
                          [attr.aria-label]="'Quantity of ' + row.name"
                          [attr.aria-invalid]="row.error ? true : null"
                          [attr.aria-describedby]="
                            row.error ? 'line-error-' + row.productId : null
                          "
                          [value]="row.quantity"
                          (input)="changeQuantity(row.productId, value($event))"
                        />
                        @if (row.error) {
                          <p
                            class="mt-1 text-sm text-destructive"
                            [id]="'line-error-' + row.productId"
                          >
                            {{ row.error }}
                          </p>
                        }
                      </td>
                      <td class="text-right tabular-nums">{{ row.net }}</td>
                      <td class="text-right">
                        <button
                          type="button"
                          askButton
                          variant="ghost"
                          size="sm"
                          [attr.aria-label]="'Remove ' + row.name"
                          (click)="removeLine(row.productId)"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (showErrors() && rows().length === 0) {
            <p id="order-lines-error" class="text-sm text-destructive">
              {{ emptyOrder }}
            </p>
          }

          <div role="group" aria-label="Totals" class="ml-auto w-64">
            <dl class="grid grid-cols-2 gap-1 text-sm">
              <dt class="text-muted-foreground">Subtotal</dt>
              <dd class="text-right tabular-nums">{{ totals().subtotal }}</dd>
              <dt class="text-muted-foreground">VAT</dt>
              <dd class="text-right tabular-nums">{{ totals().vat }}</dd>
              <dt class="font-medium">Total</dt>
              <dd class="text-right font-medium tabular-nums">
                {{ totals().total }}
              </dd>
            </dl>
          </div>
        </div>
      </ask-card>

      <ask-card>
        <div askCardContent class="flex flex-col gap-2">
          <ask-slot-picker
            [slots]="slotList()"
            [now]="now"
            [(value)]="slotId"
            [describedBy]="showErrors() && !slotId() ? 'order-slot-error' : ''"
          />
          @if (showErrors() && !slotId()) {
            <p id="order-slot-error" class="text-sm text-destructive">
              Choose a delivery slot.
            </p>
          }
        </div>
      </ask-card>

      <div class="flex justify-end">
        <button type="submit" askButton [disabled]="store.saving()">
          {{ store.saving() ? 'Placing...' : 'Place order' }}
        </button>
      </div>
    </form>
  `,
})
export class NewOrder {
  private readonly repository = inject(OrdersRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly store = inject(OrdersStore);

  protected readonly now = new Date();
  protected readonly money = formatMoney;
  protected readonly emptyOrder = ERROR_MESSAGE['empty-order'];

  protected readonly customers = rxResource({
    stream: () => this.repository.customers(),
  });
  protected readonly products = rxResource({
    stream: () => this.repository.products(),
  });
  protected readonly slots = rxResource({
    stream: () => this.repository.slots(),
  });

  /** The reference data, or none while it loads or after a failure (`value()` throws then). */
  protected readonly productList = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly slotList = computed(() =>
    this.slots.hasValue() ? this.slots.value() : [],
  );
  protected readonly referenceFailed = computed(
    () =>
      !!(this.customers.error() || this.products.error() || this.slots.error()),
  );

  protected readonly customerId = signal<string | null>(null);
  protected readonly slotId = signal<string | null>(null);
  protected readonly productToAdd = signal('');
  protected readonly quantityToAdd = signal('1');
  private readonly lines = signal<readonly DraftLine[]>([]);
  /** Field errors show once the person has tried to place the order. */
  protected readonly showErrors = signal(false);

  protected readonly customerOptions = computed<ComboboxOption[]>(() =>
    (this.customers.hasValue() ? this.customers.value() : []).map((c) => ({
      value: c.id,
      label: c.name,
      description: c.city,
    })),
  );

  /** Each line checked by the domain: its net, or why it is refused. */
  private readonly checked = computed(() => {
    const catalogue = new Map(this.productList().map((p) => [p.id, p]));
    return this.lines().flatMap((line) => {
      const product = catalogue.get(line.productId);
      if (!product) return [];
      const result = orderLine({
        productId: product.id,
        name: product.name,
        quantity: line.quantity,
        unitPrice: product.unitPrice,
        discount: money(0, product.unitPrice.currency),
        vatRate: product.vatRate,
      });
      return [{ line, product, result }];
    });
  });

  protected readonly rows = computed(() =>
    this.checked().map(({ line, product, result }) => ({
      productId: line.productId,
      name: product.name,
      quantity: line.quantity,
      unitPrice: formatMoney(product.unitPrice),
      net: result.ok ? formatMoney(lineNet(result.value)) : '',
      error: result.ok ? null : ERROR_MESSAGE[result.error.code],
    })),
  );

  protected readonly totals = computed(() => {
    const valid: OrderLine[] = this.checked().flatMap(({ result }) =>
      result.ok ? [result.value] : [],
    );
    const currency = this.productList()[0]?.unitPrice.currency ?? 'VND';
    const totals = orderTotals({ lines: valid, currency });
    return {
      subtotal: formatMoney(totals.subtotal),
      vat: formatMoney(totals.vat),
      total: formatMoney(totals.total),
    };
  });

  protected readonly refusal = computed(() =>
    failureMessage(this.store.failure()),
  );
  protected readonly networkFailed = computed(
    () => this.store.failure()?.kind === 'network',
  );

  protected addLine(): void {
    const productId = this.productToAdd();
    const quantity = Number(this.quantityToAdd());
    if (!productId) return;
    this.lines.update((lines) =>
      lines.some((l) => l.productId === productId)
        ? lines.map((l) =>
            l.productId === productId
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          )
        : [...lines, { productId, quantity }],
    );
    this.productToAdd.set('');
    this.quantityToAdd.set('1');
  }

  protected changeQuantity(productId: string, value: string): void {
    this.lines.update((lines) =>
      lines.map((l) =>
        l.productId === productId ? { ...l, quantity: Number(value) } : l,
      ),
    );
  }

  protected removeLine(productId: string): void {
    this.lines.update((lines) =>
      lines.filter((l) => l.productId !== productId),
    );
  }

  protected reloadReference(): void {
    for (const resource of [this.customers, this.products, this.slots]) {
      if (resource.error()) resource.reload();
    }
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.showErrors.set(true);
    if (!this.ready()) {
      this.focusLater(this.firstInvalid());
      return;
    }
    void this.place();
  }

  /** Whether the form holds an order the domain will take, as far as the page can tell. */
  private ready(): boolean {
    return (
      !!this.customerId() &&
      !!this.slotId() &&
      this.lines().length > 0 &&
      this.checked().every(({ result }) => result.ok)
    );
  }

  /** The first field in error, as the dashboard's forms do: focus goes there. */
  private firstInvalid(): string {
    if (!this.customerId()) return '#order-customer';
    if (this.lines().length === 0) return '#order-product';
    if (!this.checked().every(({ result }) => result.ok)) {
      return 'tbody input[aria-invalid="true"]';
    }
    return 'input[name="delivery-slot"]:not(:disabled)';
  }

  /** Focuses what `selector` finds once the page has drawn the change. */
  private focusLater(selector: string): void {
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }

  /** Places the order when the form holds one; a refused line stops it on the page. */
  protected async place(): Promise<void> {
    const customerId = this.customerId();
    const slotId = this.slotId();
    if (!customerId || !slotId || !this.ready()) return;
    const request: CreateOrderRequest = {
      customerId,
      lines: this.lines().map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    };
    const order = await this.store.placeNew(request, slotId);
    if (order) {
      await this.router.navigate(['..', order.id], { relativeTo: this.route });
      return;
    }
    const failure = this.store.failure();
    // The slot was taken or has started meanwhile: offer the slots as they are now.
    if (
      failure?.kind === 'business' &&
      (failure.code === 'slot-full' || failure.code === 'slot-in-past')
    ) {
      this.slotId.set(null);
      this.slots.reload();
    }
    // The button pressed is disabled while saving; the refusal takes focus.
    this.focusLater('[role="alert"][tabindex="-1"]');
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
