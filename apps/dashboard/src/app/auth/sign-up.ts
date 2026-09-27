import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  email,
  form,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Button, Input, Label } from '@angular-saas-kit/ui';

import {
  errorMessage,
  errorShown,
  focusFirstInvalid,
} from '../forms/field-errors';

/** The fewest characters a new password may have. Said before the user types, not after. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Create an account. Like sign-in, it has nothing to call in the kit: a
 * valid form goes to the dashboard, and `createAccount()` is where an app
 * calls its API.
 */
@Component({
  selector: 'ask-sign-up',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FormField, Input, Label, RouterLink],
  template: `
    <form novalidate class="mt-6 flex flex-col gap-4" (submit)="save($event)">
      <div class="flex flex-col gap-1.5">
        <label askLabel for="sign-up-name">Name</label>
        <input
          askInput
          id="sign-up-name"
          autocomplete="name"
          [formField]="form.name"
          [attr.aria-invalid]="shown(form.name) || null"
          [attr.aria-describedby]="
            shown(form.name) ? 'sign-up-name-error' : null
          "
        />
        @if (shown(form.name)) {
          <p id="sign-up-name-error" class="text-sm text-destructive">
            {{ message(form.name) }}
          </p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="sign-up-email">Email</label>
        <input
          askInput
          id="sign-up-email"
          type="email"
          autocomplete="email"
          [formField]="form.email"
          [attr.aria-invalid]="shown(form.email) || null"
          [attr.aria-describedby]="
            shown(form.email) ? 'sign-up-email-error' : null
          "
        />
        @if (shown(form.email)) {
          <p id="sign-up-email-error" class="text-sm text-destructive">
            {{ message(form.email) }}
          </p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="sign-up-password">Password</label>
        <input
          askInput
          id="sign-up-password"
          type="password"
          autocomplete="new-password"
          [formField]="form.password"
          [attr.aria-invalid]="shown(form.password) || null"
          [attr.aria-describedby]="
            shown(form.password)
              ? 'sign-up-password-hint sign-up-password-error'
              : 'sign-up-password-hint'
          "
        />
        <p id="sign-up-password-hint" class="text-sm text-muted-foreground">
          At least {{ minLength }} characters.
        </p>
        @if (shown(form.password)) {
          <p id="sign-up-password-error" class="text-sm text-destructive">
            {{ message(form.password) }}
          </p>
        }
      </div>

      <button type="submit" askButton class="mt-2 w-full">
        Create account
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <a
        routerLink="/sign-in"
        class="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >Sign in</a
      >
    </p>
  `,
})
export class SignUp {
  private readonly router = inject(Router);

  protected readonly minLength = PASSWORD_MIN_LENGTH;
  protected readonly model = signal({ name: '', email: '', password: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, {
      message: 'Enter an email address like name@example.com.',
    });
    required(path.password, { message: 'Choose a password.' });
    minLength(path.password, PASSWORD_MIN_LENGTH, {
      message: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    });
  });

  protected readonly shown = errorShown;
  protected readonly message = errorMessage;

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, {
      action: async () => {
        await this.createAccount();
        return undefined;
      },
      onInvalid: () =>
        focusFirstInvalid([
          this.form.name,
          this.form.email,
          this.form.password,
        ]),
    });
  }

  /** Where an app calls its API. The kit's demo just goes in. */
  private async createAccount(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
