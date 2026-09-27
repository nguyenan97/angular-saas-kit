# 0018. Charts: SVG on the chart tokens, with the data as a table

- **Status:** Proposed
- **Date:** 2026-09-27
- **Deciders:** @nguyenan97

## Context

The dashboard needs charts: revenue and orders over time on the Overview and the
Analytics page, and revenue by category. The kit's rules shape the choice. Components never
name a colour ([0004](0004-semantic-design-tokens-and-three-axis-theming.md)), so a chart's
colours have to be the `--chart-*` tokens and follow the mode at runtime. No UI library
brings its own styling ([0005](0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)).
And accessibility is a gate: a chart is a picture of numbers, so the numbers must be
reachable without seeing it (WCAG 1.1.1), and its marks must stand out from the page at
3:1 (WCAG 1.4.11).

The charts needed are two kinds, a line over an area and bars, on one numeric axis.

## Decision

We draw charts ourselves, in SVG, with one component, `ask-chart` (`type` is `line` or
`bar`), in `libs/ui`:

- **Colours are the chart tokens**, as Tailwind classes (`stroke-chart-1`,
  `fill-chart-2/15`), so a chart follows the mode and the theme like everything else. The
  contrast test in `libs/tokens` now holds `--chart-1` to `--chart-5` to 3:1 against the
  page and a card in both modes, which changed three of them.
- **The data is always there as a table.** The drawing is `aria-hidden`; the chart is a
  `figure` whose caption names it and summarises it ("Highest: Sep 17, $2,033. Lowest:
  ..."), and a native `details` ("Show the data") holds the same numbers as a table, for
  anyone, by mouse or keyboard. Hovering a point or a bar shows its value (an SVG `title`).
- **The scale is computed in TypeScript**: round ticks (`niceTicks`), a band for each bar,
  and the width measured with a `ResizeObserver`, so the drawing fills its container.

## Alternatives considered

- **Chart.js** - draws on a canvas, so the chart has no DOM for assistive technology or for
  CSS, and its colours are JavaScript values that would have to be read out of the tokens
  and re-applied on every theme change.
- **Apache ECharts** - capable, but a large dependency (hundreds of kilobytes) with its own
  theming system, for two kinds of chart.
- **ngx-charts** - brings its own styles and d3, and its Angular peer range has to keep up
  with every major; the kit's upgrades would wait on it.
- **d3 (scales and shapes only)** - the least objectionable, but two small helpers are all
  the scale these charts need.

## Consequences

- No new dependency, and a chart costs a few kilobytes in the page that uses it.
- Charts restyle with the theme and meet the same contrast bar as the rest of the kit.
- Only what is built exists: a single series per chart, one value axis, no legend, no
  zoom, no animation. A stacked, multi-series or scatter chart is new work, and should
  keep the table.
- Labels along the bottom are thinned to about six, so a 90-day chart stays legible; the
  table has every label.
- The component measures itself after rendering, so on the server it draws at a default
  width and corrects in the browser. The dashboard does not render on the server.

## References

- [`libs/ui/src/lib/chart/chart.ts`](../../libs/ui/src/lib/chart/chart.ts) and its README
- [`libs/tokens/src/lib/contrast.spec.ts`](../../libs/tokens/src/lib/contrast.spec.ts)
- [0004](0004-semantic-design-tokens-and-three-axis-theming.md), [0005](0005-angular-cdk-and-tailwind-instead-of-a-ui-library.md)
