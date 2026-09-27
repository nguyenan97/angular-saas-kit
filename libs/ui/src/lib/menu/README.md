# Menu

A menu of actions opened from a button, on the Angular CDK's menu.

```html
<button
  type="button"
  askButton
  variant="ghost"
  size="icon"
  [askMenuTrigger]="actions"
  aria-label="Order actions"
>
  <ask-icon [icon]="ellipsis" />
</button>

<ng-template #actions>
  <div askMenu>
    <button type="button" askMenuItem (triggered)="edit()">Edit</button>
    <button type="button" askMenuItem (triggered)="duplicate()">
      Duplicate
    </button>
    <div askMenuSeparator></div>
    <button
      type="button"
      askMenuItem
      [disabled]="!canDelete()"
      (triggered)="remove()"
    >
      Delete
    </button>
  </div>
</ng-template>
```

| Directive       | Selector             | Inputs and outputs                                                                          |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `MenuTrigger`   | `[askMenuTrigger]`   | `askMenuTrigger` (the template), `menuPosition`, `menuData`; `(menuOpened)`, `(menuClosed)` |
| `MenuPanel`     | `[askMenu]`          | `class`                                                                                     |
| `MenuItem`      | `[askMenuItem]`      | `disabled`, `class`; `(triggered)`                                                          |
| `MenuSeparator` | `[askMenuSeparator]` | `class`                                                                                     |

The menu's class is `MenuPanel`, not `Menu`, so it does not clash with Lucide's `Menu` icon in
the same file.

## Accessibility

The CDK implements the WAI-ARIA menu button pattern:

- The trigger has `aria-haspopup="menu"` and `aria-expanded`. Enter, Space or Down opens the
  menu and focuses the first item; Up opens it on the last.
- In the menu, the arrow keys move between items, Home and End go to the ends, and typing a
  letter jumps to the item that starts with it. Escape closes the menu and returns focus to the
  trigger; Tab closes it and moves on.
- `(triggered)` fires for a click, Enter and Space alike. Use it, not `(click)`.
- A disabled item keeps its place in the arrow-key order and is announced as disabled, so a
  keyboard user can find out that it exists.
- An icon-only trigger needs a name: `aria-label` on the button.
