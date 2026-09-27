# Dialog

A modal dialog on the Angular CDK's `Dialog`, in the kit's tokens. Open it from code with
`DialogService`; build its content from the parts.

```ts
import {
  Button,
  DIALOG_DATA,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogService,
  DialogTitle,
} from '@angular-saas-kit/ui';

@Component({
  imports: [Button, DialogTitle, DialogDescription, DialogFooter, DialogClose],
  template: `
    <h2 askDialogTitle>Delete {{ data.name }}?</h2>
    <p askDialogDescription>This cannot be undone.</p>
    <div askDialogFooter>
      <button type="button" askButton variant="outline" askDialogClose>
        Cancel
      </button>
      <button
        type="button"
        askButton
        variant="destructive"
        [askDialogClose]="true"
      >
        Delete
      </button>
    </div>
  `,
})
export class ConfirmDelete {
  protected readonly data = inject<{ name: string }>(DIALOG_DATA);
}

// In the page:
const ref = inject(DialogService).open<boolean>(ConfirmDelete, {
  data: { name: order.id },
  role: 'alertdialog',
});
ref.closed.subscribe((confirmed) => confirmed && this.delete(order));
```

| `open()` option | Type                        | Default    | Notes                                                   |
| --------------- | --------------------------- | ---------- | ------------------------------------------------------- |
| `data`          | any                         | —          | Read in the content with `inject(DIALOG_DATA)`.         |
| `role`          | `'dialog' \| 'alertdialog'` | `'dialog'` | `alertdialog` for a confirmation that interrupts.       |
| `width`         | `string`                    | `'32rem'`  | Never wider than the screen.                            |
| `dismissible`   | `boolean`                   | `true`     | `false`: Escape and a click outside no longer close it. |

| Part                | Selector                 | Notes                                                               |
| ------------------- | ------------------------ | ------------------------------------------------------------------- |
| `DialogTitle`       | `[askDialogTitle]`       | Required: the dialog is named by it (`aria-labelledby`).            |
| `DialogDescription` | `[askDialogDescription]` | Optional: when present, the dialog is described by it.              |
| `DialogFooter`      | `[askDialogFooter]`      | The actions. Stacked on a phone, a row from `sm` up.                |
| `DialogClose`       | `button[askDialogClose]` | Closes the dialog; `[askDialogClose]="value"` closes with a result. |

`DialogRef` and `DIALOG_DATA` are re-exported from the CDK, so the content can close itself
(`inject(DialogRef).close(result)`) without importing the CDK.

## Accessibility

The CDK implements the WAI-ARIA dialog pattern: focus moves into the dialog and is trapped
there, Tab and Shift+Tab cycle inside it, Escape closes it, the page behind stops scrolling and
is hidden from assistive technology, and focus returns to what opened it.

- **Give every dialog a title.** It is the dialog's name. Without one, the dialog is announced
  with no name.
- **Put the safe action first** in the footer of an `alertdialog`: the first focusable element
  gets the focus when it opens, and it should not be "Delete". (On a phone the footer stacks in
  reverse, so the first button sits at the bottom.)
- A dialog that cannot be dismissed (`dismissible: false`) must still offer a way out: a Cancel
  button.
