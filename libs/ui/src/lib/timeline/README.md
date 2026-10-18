# Timeline

The steps of a process in order: an order's status history, a shipment's progress.

```html
<ask-timeline label="Order status" [items]="steps()" />
```

```ts
steps = computed<TimelineItem[]>(() => [
  {
    label: 'Created',
    state: 'complete',
    time: '18 Oct, 09:00',
    dateTime: '2026-10-18T02:00:00Z',
  },
  {
    label: 'Placed',
    state: 'current',
    description: 'Delivery 20 Oct, 08:00 to 12:00',
  },
  { label: 'Confirmed', state: 'upcoming' },
]);
```

| Input   | Type                                 | Default |
| ------- | ------------------------------------ | ------- |
| `items` | `readonly TimelineItem[]` (required) |         |
| `label` | `string`, the list's name            | `''`    |
| `class` | `string`, merged last so it wins     | `''`    |

A `TimelineItem` has a `label`, a `state` (`'complete' | 'current' | 'upcoming'`), and optionally a
`time` already formatted for people, its `dateTime` in ISO 8601, a `description`, and a `tone`
(`'destructive'` for a step that ends the flow badly, such as a cancellation).

## Accessibility

- **An ordered list** (`<ol>`), named by `label`, so a screen reader says how many steps there are
  and which one it is on.
- **The state is spoken:** each step starts with hidden text, "Completed:", "Current:" or
  "Upcoming:", and the current step has `aria-current="step"`. The marker and the line are
  `aria-hidden` decoration; colour is never the only signal.
- A time is a `<time>` element with its `datetime`; the time and the description are read after a
  comma.
