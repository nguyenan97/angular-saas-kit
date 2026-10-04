# Radio

`askRadio` styles a native `<input type="radio">`. The radios of one choice share a `name`
inside a `<fieldset>`, and the browser supplies the arrow keys and the single tab stop. A
`button role="radio"` would have to build both by hand.

<!-- prettier-ignore -->
```html
<fieldset>
  <legend>Billing</legend>
  <input askRadio id="monthly" type="radio" name="billing" value="monthly" [formControl]="billing" />
  <label askLabel for="monthly">Monthly</label>
  <input askRadio id="yearly" type="radio" name="billing" value="yearly" [formControl]="billing" />
  <label askLabel for="yearly">Yearly</label>
</fieldset>
```

| Directive | Selector                      | Input   |
| --------- | ----------------------------- | ------- |
| `Radio`   | `input[type=radio][askRadio]` | `class` |

`class` is merged last, so it wins.

## Accessibility

- **A `<fieldset>` and a `<legend>` name the group**, and each radio has its own label.
- Arrow keys move and select within the group; Tab enters and leaves it. This is the
  browser's, and is not reimplemented.
- Preselect a default (`checked`) unless "no answer" is a real state.
