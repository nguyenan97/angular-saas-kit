# Badge

A short status or count: "Paid", "3 new".

```html
<ask-badge variant="success">Paid</ask-badge>
<ask-badge variant="warning">Pending</ask-badge>
<ask-badge variant="success" class="bg-primary">Pinned</ask-badge>
```

| Input     | Type                                                                                       | Default     |
| --------- | ------------------------------------------------------------------------------------------ | ----------- |
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'destructive' \| 'info' \| 'outline'` | `'neutral'` |
| `class`   | `string`, merged last so it wins                                                           | `''`        |

## Accessibility

- **The text is the status.** The colour repeats it for those who can see it, and is never
  the only signal.
- Every variant pairs a colour with its own `-foreground`, and the contrast test in
  `libs/tokens` holds each pair to 4.5:1 in both modes.
- A badge that changes while the user watches (a live count) needs a live region around it;
  the badge does not announce itself.
