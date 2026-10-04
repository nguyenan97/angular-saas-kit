# Switch

`askSwitch` styles a native `<input type="checkbox">` as a switch and gives it
`role="switch"`, so a screen reader says "on" or "off" instead of "checked". It stays the real
checkbox: Space toggles it, and forms and `[formControl]` work.

```html
<input askSwitch id="digest" type="checkbox" [formControl]="digest" />
<label askLabel for="digest">Weekly digest</label>
```

| Directive | Selector                          | Input   |
| --------- | --------------------------------- | ------- |
| `Switch`  | `input[type=checkbox][askSwitch]` | `class` |

`class` is merged last, so it wins.

## Accessibility

- **The label names the setting**, never its state: "Weekly digest", not "Turn on weekly
  digest". The switch itself says on or off.
- Use a switch for a setting that applies the moment it flips; for a choice submitted later,
  use [Checkbox](../checkbox/README.md).
- The track is `bg-input` (held to 3:1 against the page by the contrast test in
  `libs/tokens`) and the thumb is `bg-background`, so the thumb is found in both modes.
  `checked` is exposed to assistive technology; the thumb position is not the only signal.
- The thumb is drawn with `::before` on the input, which needs `appearance: none`. The
  keyboard focus ring is the kit's global `:focus-visible` outline.
