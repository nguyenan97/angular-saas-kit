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

/**
 * Sign in with an email and a password.
 *
 * The kit has no authentication: a valid form goes straight to the
 * dashboard. `signIn()` is where an app calls its own API.
 */
@Component({
  selector: 'ask-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FormField, Input, Label, RouterLink],
  template: `
    <form novalidate class="mt-6 flex flex-col gap-4" (submit)="save($event)">
      <div class="flex flex-col gap-1.5">
        <label askLabel for="sign-in-email">Email</label>
        <input
          askInput
          id="sign-in-email"
          type="email"
          autocomplete="email"
          [formField]="form.email"
          [attr.aria-invalid]="shown(form.email) || null"
          [attr.aria-describedby]="
            shown(form.email) ? 'sign-in-email-error' : null
          "
        />
        @if (shown(form.email)) {
          <p id="sign-in-email-error" class="text-sm text-destructive">
            {{ message(form.email) }}
          </p>
        }
      </div>

      <div class="flex flex-col gap-1.5">
        <label askLabel for="sign-in-password">Password</label>
        <div class="relative">
          <input
            askInput
            id="sign-in-password"
            class="pr-16"
            autocomplete="current-password"
            [type]="revealed() ? 'text' : 'password'"
            [formField]="form.password"
            [attr.aria-invalid]="shown(form.password) || null"
            [attr.aria-describedby]="
              shown(form.password) ? 'sign-in-password-error' : null
            "
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 cursor-pointer rounded-r-md px-3 text-xs text-muted-foreground hover:text-foreground"
            [attr.aria-pressed]="revealed()"
            (click)="revealed.set(!revealed())"
          >
            Show<span class="sr-only"> password</span>
          </button>
        </div>
        @if (shown(form.password)) {
          <p id="sign-in-password-error" class="text-sm text-destructive">
            {{ message(form.password) }}
          </p>
        }
        <!-- After the field, not beside its label: Tab goes from the email
             straight to the password. -->
        <a
          routerLink="/forgot-password"
          class="w-fit rounded-sm text-sm text-primary underline-offset-4 hover:underline"
          >Forgot your password?</a
        >
      </div>

      <button type="submit" askButton class="mt-2 w-full">Sign in</button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      No account yet?
      <a
        routerLink="/sign-up"
        class="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >Create one</a
      >
    </p>
  `,
})
export class SignIn {
  private readonly router = inject(Router);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, {
      message: 'Enter an email address like name@example.com.',
    });
    required(path.password, { message: 'Enter your password.' });
  });

  /** The password shown as text, for checking what was typed. A toggle button, so aria-pressed. */
  protected readonly revealed = signal(false);

  protected readonly shown = errorShown;
  protected readonly message = errorMessage;

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, {
      action: async () => {
        await this.signIn();
        return undefined;
      },
      onInvalid: () => focusFirstInvalid([this.form.email, this.form.password]),
    });
  }

  /** Where an app calls its authentication API. The kit's demo just goes in. */
  private async signIn(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
