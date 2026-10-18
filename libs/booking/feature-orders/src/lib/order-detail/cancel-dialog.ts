import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  Button,
  DIALOG_DATA,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogRef,
  DialogTitle,
  Input,
  Label,
} from '@angular-saas-kit/ui';

import { ERROR_MESSAGE } from '../format';

/**
 * Asks why an order is cancelled. Closes with the reason, or with nothing
 * when the person keeps the order. An empty reason is refused here, with the
 * domain's own message, before anything is sent.
 */
@Component({
  selector: 'ask-cancel-order-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    Input,
    Label,
  ],
  template: `
    <form novalidate (submit)="submit($event)">
      <h2 askDialogTitle>Cancel {{ data.orderId }}?</h2>
      <p askDialogDescription>
        The order will not be delivered, and its delivery slot is freed.
      </p>
      <div class="mt-4 flex flex-col gap-1.5">
        <label askLabel for="cancel-reason">Reason</label>
        <textarea
          askInput
          id="cancel-reason"
          [value]="reason()"
          [attr.aria-invalid]="missing() || null"
          [attr.aria-describedby]="missing() ? 'cancel-reason-error' : null"
          (input)="reason.set(value($event))"
        ></textarea>
        @if (missing()) {
          <p id="cancel-reason-error" class="text-sm text-destructive">
            {{ required }}
          </p>
        }
      </div>
      <div askDialogFooter>
        <button type="button" askButton variant="outline" askDialogClose>
          Keep the order
        </button>
        <button type="submit" askButton variant="destructive">
          Cancel order
        </button>
      </div>
    </form>
  `,
})
export class CancelOrderDialog {
  protected readonly data = inject<{ orderId: string }>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly reason = signal('');
  protected readonly missing = signal(false);
  protected readonly required = ERROR_MESSAGE['reason-required'];

  protected submit(event: Event): void {
    event.preventDefault();
    const reason = this.reason().trim();
    if (!reason) {
      this.missing.set(true);
      return;
    }
    this.ref.close(reason);
  }

  protected value(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }
}
