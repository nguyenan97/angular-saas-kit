import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Button } from '@angular-saas-kit/ui';
import { firstValueFrom } from 'rxjs';

import type { NotificationSettings as Settings } from '../../data/models';

/** Which emails to get, as native checkboxes in a fieldset. */
@Component({
  selector: 'ask-notification-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FormField],
  template: `
    <form class="flex flex-col gap-5" (submit)="save($event)">
      <fieldset class="flex flex-col gap-4">
        <legend class="mb-1 text-sm font-medium">Email me about</legend>

        @for (option of options; track option.key) {
          <div class="flex gap-3">
            <input
              type="checkbox"
              class="mt-0.5 size-4 shrink-0 accent-primary"
              [id]="'notify-' + option.key"
              [attr.aria-describedby]="'notify-' + option.key + '-hint'"
              [formField]="settings[option.key]"
            />
            <div>
              <label
                class="text-sm font-medium"
                [for]="'notify-' + option.key"
                >{{ option.label }}</label
              >
              <p
                class="text-sm text-muted-foreground"
                [id]="'notify-' + option.key + '-hint'"
              >
                {{ option.hint }}
              </p>
            </div>
          </div>
        }
      </fieldset>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" askButton [attr.aria-disabled]="saving() || null">
          {{ saving() ? 'Saving...' : 'Save notifications' }}
        </button>
        <p class="text-sm text-muted-foreground" role="status">
          {{ status() }}
        </p>
      </div>
    </form>
  `,
})
export class NotificationSettingsForm {
  private readonly http = inject(HttpClient);

  protected readonly model = signal<Settings>({
    orders: false,
    weeklySummary: false,
    productNews: false,
  });
  protected readonly settings = form(this.model);

  private readonly stored = httpResource<Settings>(() => '/api/notifications');

  protected readonly saving = signal(false);
  protected readonly status = signal('');

  protected readonly options: readonly {
    readonly key: keyof Settings;
    readonly label: string;
    readonly hint: string;
  }[] = [
    {
      key: 'orders',
      label: 'Orders',
      hint: 'A new order, a failed payment or a refund.',
    },
    {
      key: 'weeklySummary',
      label: 'Weekly summary',
      hint: 'Revenue and orders for the week, every Monday.',
    },
    {
      key: 'productNews',
      label: 'Product news',
      hint: 'New features, now and then.',
    },
  ];

  constructor() {
    effect(() => {
      if (this.stored.hasValue()) {
        this.model.set(this.stored.value());
      }
    });
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.status.set('');
    try {
      this.model.set(
        await firstValueFrom(
          this.http.put<Settings>('/api/notifications', this.model()),
        ),
      );
      this.status.set('Notifications saved.');
    } catch {
      this.status.set('The notifications could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
