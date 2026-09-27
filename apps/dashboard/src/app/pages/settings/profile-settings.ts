import { HttpClient, httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  type FieldTree,
  FormField,
  email,
  form,
  required,
  submit,
} from '@angular/forms/signals';
import { Button, Input, Label } from '@angular-saas-kit/ui';
import { firstValueFrom } from 'rxjs';

import { type Profile, TIME_ZONES } from '../../data/models';

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
  imports: [Button, FormField, Input, Label],
  template: `
    <form novalidate class="flex flex-col gap-5" (submit)="save($event)">
      <div class="flex flex-col gap-1.5">
        <label askLabel for="profile-name">Name</label>
        <input
          askInput
          id="profile-name"
          autocomplete="name"
          [formField]="profile.name"
          [attr.aria-invalid]="shown(profile.name) || null"
          [attr.aria-describedby]="
            shown(profile.name) ? 'profile-name-error' : null
          "
        />
        @if (shown(profile.name)) {
          <p id="profile-name-error" class="text-sm text-destructive">
            {{ message(profile.name) }}
          </p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="profile-email">Email</label>
        <input
          askInput
          id="profile-email"
          type="email"
          autocomplete="email"
          [formField]="profile.email"
          [attr.aria-invalid]="shown(profile.email) || null"
          [attr.aria-describedby]="
            shown(profile.email) ? 'profile-email-error' : null
          "
        />
        @if (shown(profile.email)) {
          <p id="profile-email-error" class="text-sm text-destructive">
            {{ message(profile.email) }}
          </p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="profile-company">
          Company
          <span class="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          askInput
          id="profile-company"
          autocomplete="organization"
          [formField]="profile.company"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="profile-time-zone">Time zone</label>
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
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" askButton [attr.aria-disabled]="saving() || null">
          {{ saving() ? 'Saving...' : 'Save profile' }}
        </button>
        <p class="text-sm text-muted-foreground" role="status">
          {{ status() }}
        </p>
      </div>
    </form>
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

  private readonly stored = httpResource<Profile>(() => '/api/profile');

  protected readonly saving = signal(false);
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

  /** An error is shown once the field has been left, or the form submitted. */
  protected shown(field: FieldTree<string>): boolean {
    return field().touched() && field().invalid();
  }

  protected message(field: FieldTree<string>): string {
    return field().errors()[0]?.message ?? '';
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
      onInvalid: () => {
        // Take the user to the first thing to fix.
        const first = [this.profile.name, this.profile.email].find((field) =>
          field().invalid(),
        );
        first?.().focusBoundControl();
      },
    });
  }
}
