# Alert

A message that stays on the page: "Payment failed", "Saved".

```html
<ask-alert variant="destructive"
  ><strong>Payment failed.</strong> Check the card.</ask-alert
>
<ask-alert variant="success">Saved.</ask-alert>
```

| Input     | Type                                                             | Default     |
| --------- | ---------------------------------------------------------------- | ----------- |
| `variant` | `'neutral' \| 'success' \| 'warning' \| 'destructive' \| 'info'` | `'neutral'` |
| `class`   | `string`, merged last so it wins                                 | `''`        |

## Accessibility

- `destructive` and `warning` get `role="alert"` and are announced at once; the other variants
  get `role="status"` and wait for a pause.
- The accent is a left border only; the text keeps the `card-foreground` colour, and the words say
  what happened. Colour is never the only signal.
- Screen readers announce a live region when its content changes, so an alert that is present at
  page load is not announced; render it when the event happens.
