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
import { Button, Input } from '@angular-saas-kit/ui';

import { focusFirstInvalid } from '../forms/field-errors';
import { FormFieldFrame } from '../forms/form-field';

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
  imports: [Button, FormField, FormFieldFrame, Input, RouterLink],
  template: `
    <form novalidate class="mt-6 flex flex-col gap-4" (submit)="save($event)">
      <ask-form-field label="Name">
        <input
          askInput
          id="sign-up-name"
          autocomplete="name"
          [formField]="form.name"
        />
      </ask-form-field>

      <ask-form-field label="Email">
        <input
          askInput
          id="sign-up-email"
          type="email"
          autocomplete="email"
          [formField]="form.email"
        />
      </ask-form-field>

      <ask-form-field label="Password" [hint]="passwordHint">
        <input
          askInput
          id="sign-up-password"
          type="password"
          autocomplete="new-password"
          [formField]="form.password"
        />
      </ask-form-field>

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

  protected readonly passwordHint = `At least ${PASSWORD_MIN_LENGTH} characters.`;
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
