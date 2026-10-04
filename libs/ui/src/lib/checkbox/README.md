# Checkbox

`askCheckbox` styles a native `<input type="checkbox">`. The browser draws the box and the
tick, coloured from the `primary` token, so Space, `indeterminate`, forms and forced-colors
mode all keep working.

```html
<input askCheckbox id="terms" type="checkbox" [formControl]="terms" />
<label askLabel for="terms">Accept the terms</label>
```

| Directive  | Selector                            | Input   |
| ---------- | ----------------------------------- | ------- |
| `Checkbox` | `input[type=checkbox][askCheckbox]` | `class` |

`class` is merged last, so it wins.

## Accessibility

- **Every checkbox has a label:** `<label for>` with the input's `id`, or the input inside
  the label. The label is also a click target.
- A group is a `<fieldset>` with a `<legend>` that asks the question.
- Show an error in text and connect it with `aria-describedby`; set `aria-invalid="true"`
  on the input.
- For a setting that takes effect at once, use [Switch](../switch/README.md).
