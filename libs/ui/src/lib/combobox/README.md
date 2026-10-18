# Combobox

A text box that filters a list of options as the user types, and keeps the chosen option's
`value`: a customer, a product.

```html
<label askLabel for="customer">Customer</label>
<ask-combobox
  inputId="customer"
  placeholder="Search customers"
  [options]="customers"
  [(value)]="customerId"
/>
```

```ts
customers: ComboboxOption[] = [{ value: 'C-01', label: 'Minh Chau Mart', description: 'Ha Noi' }];
customerId = signal<string | null>(null);
```

| Input / model | Type                                            | Default        |
| ------------- | ----------------------------------------------- | -------------- |
| `options`     | `readonly ComboboxOption[]` (required)          |                |
| `value`       | `model<string \| null>`: the chosen `value`     | `null`         |
| `inputId`     | `string`, the text box's id for `<label for>`   | a generated id |
| `label`       | `string`, a name when there is no visible label | `''`           |
| `placeholder` | `string`                                        | `''`           |
| `describedBy` | `string`, ids of a hint or an error             | `''`           |
| `invalid`     | `boolean`, sets `aria-invalid`                  | `false`        |
| `disabled`    | `boolean`                                       | `false`        |
| `emptyText`   | `string`, said when nothing matches             | `'No matches'` |
| `class`       | `string`, merged last so it wins                | `''`           |

`ComboboxOption` is `{ value, label, description? }`; typing matches `label`, ignoring case.

## Accessibility

It follows the WAI-ARIA combobox pattern with a listbox popup and list autocomplete:

- **Focus stays in the text box.** `aria-activedescendant` names the active option; the CDK's
  `ActiveDescendantKeyManager` moves it.
- **Keys:** Down and Up open the list and move through it (wrapping), Enter chooses, Escape closes
  the list and, when it is closed, clears the box. Home and End move in the text, as in any text
  box. Tab closes the list.
- **State is announced:** `aria-expanded` on the box, `aria-selected` on the chosen option, and a
  status message when nothing matches. An option's description is read after a comma.
- **No false choices:** leaving the box after typing puts the chosen label back; emptying it clears
  the value. A pointer click chooses without taking focus from the box.
- The active option is drawn with an outline as well as a background, so it shows in forced colours.
