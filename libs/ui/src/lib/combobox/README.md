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
- **Keys:** Down and Up open the list and move through it (wrapping; with nothing active, Down goes
  to the first option and Up to the last), Enter chooses, Escape closes the list and, when it is
  closed, clears the box. Alt+Down opens the list without moving, Alt+Up closes it. Home and End
  move in the text, as in any text box. Tab leaves the box as a blur does.
- **State is announced:** `aria-expanded` on the box (true only while there are options to show),
  `aria-selected` on the chosen option, and "No matches" through a status region that is always in
  the page, so screen readers hear it change. An option's description is read after a comma.
- **No false choices:** leaving the box after typing puts the chosen label back; emptying it clears
  the value, whether the user tabs away or clicks away. A pointer click chooses without taking focus
  from the box, and a press anywhere in the list (its scrollbar included) keeps focus there too.
- The active option is drawn with an outline as well as a background, so it shows in forced colours.
