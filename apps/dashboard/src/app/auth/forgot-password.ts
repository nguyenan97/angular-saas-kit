import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormField,
  email,
  form,
  required,
  submit,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Button, Input, Label } from '@angular-saas-kit/ui';

import {
  errorMessage,
  errorShown,
  focusFirstInvalid,
} from '../forms/field-errors';

/**
 * Ask for a password reset link.
 *
 * The answer is the same whether or not the address has an account, so the
 * page cannot be used to find out who has one. An app sends the email from
 * `requestReset()`; the kit's demo only says it would have.
 */
@Component({
  selector: 'ask-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FormField, Input, Label, RouterLink],
  template: `
    <p class="mt-2 text-sm text-muted-foreground">
      Enter the email address you signed up with, and we will send you a link to
      choose a new password.
    </p>

    <form novalidate class="mt-6 flex flex-col gap-4" (submit)="save($event)">
      <div class="flex flex-col gap-1.5">
        <label askLabel for="reset-email">Email</label>
        <input
          askInput
          id="reset-email"
          type="email"
          autocomplete="email"
          [formField]="form.email"
          [attr.aria-invalid]="shown(form.email) || null"
          [attr.aria-describedby]="
            shown(form.email) ? 'reset-email-error' : null
          "
        />
        @if (shown(form.email)) {
          <p id="reset-email-error" class="text-sm text-destructive">
            {{ message(form.email) }}
          </p>
        }
      </div>

      <button type="submit" askButton class="mt-2 w-full">Send the link</button>
    </form>

    <p class="mt-4 text-sm" role="status">{{ sent() }}</p>

    <p class="mt-2 text-center text-sm text-muted-foreground">
      <a
        routerLink="/sign-in"
        class="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >Back to sign in</a
      >
    </p>
  `,
})
export class ForgotPassword {
  protected readonly model = signal({ email: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email address.' });
    email(path.email, {
      message: 'Enter an email address like name@example.com.',
    });
  });

  /** What was done, read out by the status region. */
  protected readonly sent = signal('');

  protected readonly shown = errorShown;
  protected readonly message = errorMessage;

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, {
      action: async () => {
        await this.requestReset(this.model().email);
        this.sent.set(
          `If ${this.model().email} has an account, a link to reset its password is on its way.`,
        );
        return undefined;
      },
      onInvalid: () => focusFirstInvalid([this.form.email]),
    });
  }

  /** Where an app asks its API to send the email. The kit's demo sends nothing. */
  private async requestReset(_email: string): Promise<void> {
    return;
  }
}
