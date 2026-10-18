import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import {
  isBookable,
  type DeliverySlot,
} from '@angular-saas-kit/booking-domain';
import { Radio } from '@angular-saas-kit/ui';

import { formatSlotDate, formatWindow } from '../format';

/**
 * Delivery slots as days and windows: one native radio per slot in a named
 * fieldset, so the browser gives the arrow keys and the single tab stop. A
 * slot the domain will not book (started, or full) is disabled and says why.
 */
@Component({
  selector: 'ask-slot-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Radio],
  template: `
    <fieldset
      class="flex flex-col gap-3"
      [attr.aria-describedby]="describedBy() || null"
    >
      <legend class="mb-2 text-sm font-medium">Delivery slot</legend>
      @for (day of days(); track day.date) {
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span class="w-28 text-sm text-muted-foreground">{{
            day.label
          }}</span>
          @for (slot of day.slots; track slot.id) {
            <span class="flex items-center gap-2">
              <input
                askRadio
                type="radio"
                name="delivery-slot"
                [id]="'slot-' + slot.id"
                [value]="slot.id"
                [checked]="slot.id === value()"
                [disabled]="!!slot.refusal"
                (change)="value.set(slot.id)"
              />
              <label
                class="text-sm"
                [class.text-muted-foreground]="!!slot.refusal"
                [for]="'slot-' + slot.id"
              >
                <span class="sr-only">{{ day.label }}, </span>{{ slot.window }}
                @if (slot.refusal) {
                  <span>({{ slot.refusal }})</span>
                } @else {
                  <span class="text-muted-foreground"
                    >({{ slot.free }} free)</span
                  >
                }
              </label>
            </span>
          }
        </div>
      }
    </fieldset>
  `,
})
export class SlotPicker {
  readonly slots = input.required<readonly DeliverySlot[]>();

  /** The clock the rules run on. */
  readonly now = input.required<Date>();

  /** Two-way: the chosen slot's id. */
  readonly value = model<string | null>(null);

  /** Ids of what describes the group: its error. */
  readonly describedBy = input('');

  protected readonly days = computed(() => {
    const byDate = new Map<string, DeliverySlot[]>();
    for (const slot of this.slots()) {
      byDate.set(slot.date, [...(byDate.get(slot.date) ?? []), slot]);
    }
    return [...byDate].map(([date, slots]) => ({
      date,
      label: formatSlotDate(date),
      slots: slots.map((slot) => {
        const bookable = isBookable(slot, this.now());
        return {
          id: slot.id,
          window: formatWindow(slot.window),
          free: slot.capacity - slot.booked,
          refusal: bookable.ok
            ? null
            : bookable.error.code === 'slot-full'
              ? 'Full'
              : 'Started',
        };
      }),
    }));
  });
}
