# Chart

A line over an area, to show change over time, or bars, to compare. Drawn in SVG from the
chart tokens, and always with its numbers as a table.

```html
<ask-chart
  type="line"
  label="Revenue per day"
  valueLabel="Revenue"
  [color]="1"
  [data]="revenue()"
  [format]="dollars"
/>
```

`data` is a list of `{ label, value }`: `[{ label: 'Sep 26', value: 241000 }, ...]`.

| Input           | Type                        | Default                   | Notes                                              |
| --------------- | --------------------------- | ------------------------- | -------------------------------------------------- |
| `type`          | `'line' \| 'bar'`           | `'line'`                  |                                                    |
| `data`          | `readonly ChartPoint[]`     | —                         | Required.                                          |
| `label`         | `string`                    | —                         | Required. The caption, and the table's name.       |
| `format`        | `(value: number) => string` | `toLocaleString('en-US')` | Used on the axis, in the summary and in the table. |
| `categoryLabel` | `string`                    | `'Date'`                  | The table's first column.                          |
| `valueLabel`    | `string`                    | `'Value'`                 | The table's second column.                         |
| `color`         | `1 \| 2 \| 3 \| 4 \| 5`     | `1`                       | Which `--chart-*` token.                           |
| `height`        | `number`                    | `240`                     | Pixels. The width follows the container.           |
| `class`         | `string`                    | `''`                      | Merged last onto the host.                         |

`niceTicks(max)` is exported too: round axis steps (1, 2, 2.5 or 5 times a power of ten).

## Accessibility

- **A chart is a picture of a table, so the table is always there.** The drawing is hidden
  from assistive technology. The chart is a `figure`: its caption names it and says its
  highest and lowest points, and **Show the data** (a native `details`) opens the numbers as
  a table, for anyone, by mouse or keyboard.
- The five chart colours are held to 3:1 against the page and a card, in both modes, by the
  contrast test in `libs/tokens` (WCAG 1.4.11).
- Hovering a point or a bar shows its value. That is a convenience for mouse users; the
  table is the accessible route to the same numbers.

Why SVG and not a chart library: [ADR 0018](../../../../../docs/adr/0018-charts-as-svg-on-the-chart-tokens-with-a-data-table.md).
