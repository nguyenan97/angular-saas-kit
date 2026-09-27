import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  Renderer2,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

// What a dialog's content needs to talk back: close it with a result, and
// read the data it was opened with.
export { DIALOG_DATA, DialogRef };

export interface DialogOptions<D = unknown> {
  /** Handed to the content through `inject(DIALOG_DATA)`. */
  readonly data?: D;
  /**
   * `alertdialog` for a confirmation that interrupts, such as "Delete this
   * order?". Order its buttons so the safe one is first: it gets the focus.
   */
  readonly role?: 'dialog' | 'alertdialog';
  /** The panel's width; it never grows wider than the screen. Default 32rem. */
  readonly width?: string;
  /**
   * `false` stops Escape and a click outside from closing it, for a form
   * with work that would be lost. The content must then offer a way out.
   */
  readonly dismissible?: boolean;
}

/** The id the open dialog's title takes, so the dialog is named by it. */
const DIALOG_TITLE_ID = new InjectionToken<string>('ask dialog title id');

let nextId = 0;

const PANEL =
  'max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-lg';

// The same treatment as the dashboard's drawer: the page dims, in both modes.
const BACKDROP = 'bg-background/80 backdrop-blur-sm';

/**
 * Opens a modal dialog on the CDK's `Dialog`, dressed in the kit's tokens.
 *
 * The CDK does the hard parts: focus moves into the dialog and is trapped
 * there, Escape and a click outside close it, the page behind stops
 * scrolling and is hidden from assistive technology, and focus returns to
 * whatever opened it. This adds the styling and names the dialog after its
 * `askDialogTitle`.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    options: DialogOptions<D> = {},
  ): DialogRef<R, C> {
    const titleId = `ask-dialog-title-${nextId++}`;

    return this.dialog.open<R, D, C>(component, {
      data: options.data,
      role: options.role ?? 'dialog',
      ariaModal: true,
      ariaLabelledBy: titleId,
      disableClose: options.dismissible === false,
      width: options.width ?? '32rem',
      maxWidth: 'calc(100vw - 2rem)',
      panelClass: PANEL.split(' '),
      backdropClass: BACKDROP.split(' '),
      providers: [{ provide: DIALOG_TITLE_ID, useValue: titleId }],
    });
  }
}

/** The dialog's heading. Every dialog needs one: it is the dialog's name. */
@Directive({
  selector: '[askDialogTitle]',
  host: { '[id]': 'id', '[class]': 'classes()' },
})
export class DialogTitle {
  protected readonly id =
    inject(DIALOG_TITLE_ID, { optional: true }) ??
    `ask-dialog-title-${nextId++}`;

  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('text-lg leading-tight font-semibold', this.class()),
  );
}

/**
 * Text that explains the dialog. When there is one, the dialog is described
 * by it (`aria-describedby`); when there is none, nothing points at an id
 * that does not exist.
 */
@Directive({
  selector: '[askDialogDescription]',
  host: { '[id]': 'id', '[class]': 'classes()' },
})
export class DialogDescription {
  protected readonly id = `ask-dialog-description-${nextId++}`;

  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('mt-2 text-sm text-muted-foreground', this.class()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);

    afterNextRender(() => {
      const dialog = host.closest('[role="dialog"], [role="alertdialog"]');
      if (dialog && !dialog.hasAttribute('aria-describedby')) {
        renderer.setAttribute(dialog, 'aria-describedby', this.id);
      }
    });
  }
}

/** The row of actions at the bottom. Stacked on a phone, in a row from `sm` up. */
@Directive({
  selector: '[askDialogFooter]',
  host: { '[class]': 'classes()' },
})
export class DialogFooter {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn(
      'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      this.class(),
    ),
  );
}

/**
 * Closes the dialog it is in, with an optional result:
 * `<button askButton [askDialogClose]="true">Delete</button>`.
 */
@Directive({
  selector: 'button[askDialogClose]',
  host: { '(click)': 'close()' },
})
export class DialogClose {
  private readonly ref = inject(DialogRef);

  /** The result `DialogRef.closed` emits. A bare attribute closes with none. */
  readonly result = input<unknown, unknown>(undefined, {
    alias: 'askDialogClose',
    transform: (value: unknown) => (value === '' ? undefined : value),
  });

  protected close(): void {
    this.ref.close(this.result());
  }
}
