import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormField,
  email,
  form,
  required,
  submit,
} from '@angular/forms/signals';
import { Button, Input } from '@angular-saas-kit/ui';
import { firstValueFrom } from 'rxjs';

import { type Profile, TIME_ZONES } from '../../data/models';
import { focusFirstInvalid } from '../../forms/field-errors';
import { FormFieldFrame } from '../../forms/form-field';

const EMPTY: Profile = { name: '', email: '', company: '', timeZone: 'UTC' };

/**
 * The signed-in person's name, email, company and time zone.
 *
 * A signal form: the model is a signal, the rules are declared once, and
 * `submit()` marks every field touched, runs the save only when the form is
 * valid, and otherwise leaves the errors on screen. Each error is text under
 * its field, tied to it with `aria-describedby`, and the first field in
 * error gets the focus.
 */
@Component({
  selector: 'ask-profile-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FormField, FormFieldFrame, Input],
  template: `
    <!-- One element around every state, so the focus has somewhere to
         stay when Try again swaps the alert for the loading state. -->
    <div #state tabindex="-1" class="rounded-md focus-visible:outline-none">
      @if (stored.isLoading()) {
        <!-- Nothing to save until it arrives: an empty form saved now would
           overwrite what is stored. -->
        <div class="flex flex-col gap-5" aria-busy="true">
          <p class="sr-only">Loading your profile...</p>
          @for (placeholder of [1, 2, 3, 4]; track placeholder) {
            <div
              class="h-9 animate-pulse rounded-md bg-muted"
              aria-hidden="true"
            ></div>
          }
        </div>
      } @else if (stored.error()) {
        <div class="flex flex-wrap items-center gap-3" role="alert">
          <p class="text-sm">Your profile could not be loaded.</p>
          <button
            type="button"
            askButton
            variant="outline"
            size="sm"
            (click)="retry()"
          >
            Try again
          </button>
        </div>
      } @else if (stored.hasValue()) {
        <form novalidate class="flex flex-col gap-5" (submit)="save($event)">
          <ask-form-field label="Name">
            <input
              askInput
              id="profile-name"
              autocomplete="name"
              [formField]="profile.name"
            />
          </ask-form-field>

          <ask-form-field label="Email">
            <input
              askInput
              id="profile-email"
              type="email"
              autocomplete="email"
              [formField]="profile.email"
            />
          </ask-form-field>

          <ask-form-field label="Company" optional>
            <input
              askInput
              id="profile-company"
              autocomplete="organization"
              [formField]="profile.company"
            />
          </ask-form-field>

          <ask-form-field label="Time zone">
            <select
              askInput
              id="profile-time-zone"
              class="max-w-xs"
              [formField]="profile.timeZone"
            >
              @for (zone of timeZones; track zone) {
                <option [value]="zone">{{ zone }}</option>
              }
            </select>
          </ask-form-field>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              askButton
              [attr.aria-disabled]="saving() || null"
            >
              {{ saving() ? 'Saving...' : 'Save profile' }}
            </button>
            <p class="text-sm text-muted-foreground" role="status">
              {{ status() }}
            </p>
          </div>
        </form>
      }
    </div>
  `,
})
export class ProfileSettings {
  private readonly http = inject(HttpClient);

  protected readonly model = signal<Profile>(EMPTY);
  protected readonly profile = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, {
      message: 'Enter an email address like name@example.com.',
    });
  });

  protected readonly stored = httpResource<Profile>(() => '/api/profile');

  protected readonly saving = signal(false);
  private readonly state = viewChild.required<ElementRef<HTMLElement>>('state');
  protected readonly status = signal('');
  protected readonly timeZones = TIME_ZONES;

  constructor() {
    // What the API has becomes what the form edits.
    effect(() => {
      if (this.stored.hasValue()) {
        this.model.set(this.stored.value());
      }
    });
  }

  /**
   * Loads again. The alert gives way to the loading state and takes the
   * Try again button with it, so the focus moves to what holds them both.
   */
  protected retry(): void {
    this.stored.reload();
    this.state().nativeElement.focus();
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }

    this.status.set('');
    await submit(this.profile, {
      action: async () => {
        this.saving.set(true);
        try {
          const saved = await firstValueFrom(
            this.http.put<Profile>('/api/profile', this.model()),
          );
          this.model.set(saved);
          this.status.set('Profile saved.');
        } catch {
          this.status.set(
            'The profile could not be saved. Nothing changed; try again.',
          );
        } finally {
          this.saving.set(false);
        }
        return undefined;
      },
      onInvalid: () =>
        focusFirstInvalid([this.profile.name, this.profile.email]),
    });
  }
}
