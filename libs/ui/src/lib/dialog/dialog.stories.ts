import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Button } from '../button/button';
import {
  DIALOG_DATA,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogService,
  DialogTitle,
} from './dialog';

@Component({
  selector: 'ask-story-confirm-refund',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, DialogClose, DialogDescription, DialogFooter, DialogTitle],
  template: `
    <h2 askDialogTitle>Refund {{ data.order }}?</h2>
    <p askDialogDescription>
      The customer gets their money back. This cannot be undone.
    </p>
    <div askDialogFooter>
      <button type="button" askButton variant="outline" askDialogClose>
        Keep the order
      </button>
      <button
        type="button"
        askButton
        variant="destructive"
        [askDialogClose]="true"
      >
        Refund
      </button>
    </div>
  `,
})
class ConfirmRefund {
  protected readonly data = inject<{ order: string }>(DIALOG_DATA);
}

/** Opens the dialog, and says what came back. */
@Component({
  selector: 'ask-story-dialog-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <button type="button" askButton variant="destructive" (click)="open()">
      Refund order
    </button>
    <p class="mt-3 text-sm text-muted-foreground" role="status">
      {{ outcome() }}
    </p>
  `,
})
class DialogDemo {
  private readonly dialogs = inject(DialogService);
  protected readonly outcome = signal('');

  protected open(): void {
    this.dialogs
      .open<boolean>(ConfirmRefund, {
        data: { order: '#1042' },
        role: 'alertdialog',
      })
      .closed.subscribe((refunded) =>
        this.outcome.set(refunded ? 'Refunded.' : 'Kept.'),
      );
  }
}

const meta: Meta = {
  title: 'Components/Dialog',
  decorators: [moduleMetadata({ imports: [DialogDemo] })],
};

export default meta;
type Story = StoryObj;

/**
 * Focus moves into the dialog and stays there; Escape or the backdrop closes
 * it, and focus returns to the button that opened it.
 */
export const Confirm: Story = {
  render: () => ({ template: `<ask-story-dialog-demo />` }),
};
