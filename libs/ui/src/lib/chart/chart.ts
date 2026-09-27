import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { Table } from '../table/table';
import { cn } from '../utils/cn';

/** One point of a series: what it is ("Sep 26") and how much. */
export interface ChartPoint {
  readonly label: string;
  readonly value: number;
}

/** Which of the five chart tokens to draw in (`--chart-1` to `--chart-5`). */
export type ChartColor = 1 | 2 | 3 | 4 | 5;

export type ChartType = 'line' | 'bar';

// Written out in full so Tailwind finds each class in the source.
const STROKE: Record<ChartColor, string> = {
  1: 'stroke-chart-1',
  2: 'stroke-chart-2',
  3: 'stroke-chart-3',
  4: 'stroke-chart-4',
  5: 'stroke-chart-5',
};
const FILL: Record<ChartColor, string> = {
  1: 'fill-chart-1',
  2: 'fill-chart-2',
  3: 'fill-chart-3',
  4: 'fill-chart-4',
  5: 'fill-chart-5',
};
const AREA: Record<ChartColor, string> = {
  1: 'fill-chart-1/15',
  2: 'fill-chart-2/15',
  3: 'fill-chart-3/15',
  4: 'fill-chart-4/15',
  5: 'fill-chart-5/15',
};

/**
 * Round numbers for an axis from 0 to at least `max`: steps of 1, 2, 2.5 or 5
 * times a power of ten, about `count` of them.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) {
    return [0, 1];
  }
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ??
    10 * power;
  const ticks: number[] = [];
  for (let i = 0; i * step < max + step; i++) {
    ticks.push(Math.round(i * step * 1e6) / 1e6);
  }
  return ticks;
}

/** Space around the plot for the axis labels, in pixels. */
const PAD = { top: 8, right: 8, bottom: 24, left: 56 };

/**
 * A line over an area, to show change over time, or bars, to compare.
 *
 * Drawn in SVG from the chart tokens, and a picture of a table: the drawing
 * is hidden from assistive technology, the caption names the chart, a
 * summary gives its highest and lowest points, and "Show the data" opens
 * the same numbers as a table, for anyone. Hovering a point or a bar shows
 * its value.
 */
@Component({
  selector: 'ask-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Table],
  host: { '[class]': 'classes()' },
  template: `
    <figure class="flex flex-col gap-3">
      <figcaption>
        <span class="text-sm font-medium">{{ label() }}</span>
        <span class="block text-xs text-muted-foreground">{{ summary() }}</span>
      </figcaption>

      <div #frame class="w-full">
        <svg
          aria-hidden="true"
          class="block w-full overflow-visible"
          [attr.height]="height()"
          [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        >
          @for (tick of ticks(); track tick) {
            <line
              class="stroke-border"
              [attr.x1]="plot().left"
              [attr.x2]="plot().right"
              [attr.y1]="y(tick)"
              [attr.y2]="y(tick)"
            />
            <text
              class="fill-muted-foreground text-[10px]"
              text-anchor="end"
              dominant-baseline="middle"
              [attr.x]="plot().left - 8"
              [attr.y]="y(tick)"
            >
              {{ format()(tick) }}
            </text>
          }
          @for (item of xLabels(); track item.index) {
            <text
              class="fill-muted-foreground text-[10px]"
              text-anchor="middle"
              [attr.x]="x(item.index)"
              [attr.y]="plot().bottom + 16"
            >
              {{ item.point.label }}
            </text>
          }

          @if (type() === 'line') {
            <path [class]="area()" [attr.d]="areaPath()" />
            <path
              [class]="stroke()"
              fill="none"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              [attr.d]="linePath()"
            />
            @for (point of data(); track $index) {
              <circle
                [class]="fill()"
                r="3"
                [attr.cx]="x($index)"
                [attr.cy]="y(point.value)"
              >
                <title>{{ point.label }}: {{ format()(point.value) }}</title>
              </circle>
            }
          } @else {
            @for (point of data(); track $index) {
              <rect
                [class]="fill()"
                rx="2"
                [attr.x]="x($index) - barWidth() / 2"
                [attr.y]="y(point.value)"
                [attr.width]="barWidth()"
                [attr.height]="plot().bottom - y(point.value)"
              >
                <title>{{ point.label }}: {{ format()(point.value) }}</title>
              </rect>
            }
          }
        </svg>
      </div>

      <details class="text-sm">
        <summary
          class="w-fit cursor-pointer rounded-sm text-muted-foreground hover:text-foreground"
        >
          Show the data
        </summary>
        <div
          class="mt-2 max-h-64 overflow-y-auto"
          tabindex="0"
          role="region"
          [attr.aria-label]="label() + ', data'"
        >
          <table askTable>
            <caption class="sr-only">
              {{
                label()
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ categoryLabel() }}</th>
                <th scope="col" class="text-right">{{ valueLabel() }}</th>
              </tr>
            </thead>
            <tbody>
              @for (point of data(); track $index) {
                <tr>
                  <td>{{ point.label }}</td>
                  <td class="text-right tabular-nums">
                    {{ format()(point.value) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  `,
})
export class Chart {
  /** A line over an area for change over time; bars to compare. */
  readonly type = input<ChartType>('line');

  /** The series, in order. */
  readonly data = input.required<readonly ChartPoint[]>();

  /** The chart's name, shown as its caption: "Revenue per day". */
  readonly label = input.required<string>();

  /** How a value is written on the axis and in the table. */
  readonly format = input<(value: number) => string>((value) =>
    value.toLocaleString('en-US'),
  );

  /** The table's column headings. */
  readonly categoryLabel = input('Date');
  readonly valueLabel = input('Value');

  readonly color = input<ChartColor>(1);

  /** Height of the drawing, in pixels. */
  readonly height = input(240);

  /** Merged last onto the host, so a consumer's classes win. */
  readonly class = input('');

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  /** The drawing's width, measured; a sensible guess where nothing can measure. */
  protected readonly width = signal(640);

  protected readonly ticks = computed(() =>
    niceTicks(Math.max(0, ...this.data().map((point) => point.value))),
  );
  private readonly top = computed(() => this.ticks().at(-1) ?? 1);
  protected readonly plot = computed(() => ({
    left: PAD.left,
    right: this.width() - PAD.right,
    top: PAD.top,
    bottom: this.height() - PAD.bottom,
  }));

  /** "Highest: Sep 26, $2,410. Lowest: Sep 3, $0." */
  protected readonly summary = computed(() => {
    const data = this.data();
    if (data.length === 0) {
      return 'No data.';
    }
    const high = data.reduce((a, b) => (b.value > a.value ? b : a));
    const low = data.reduce((a, b) => (b.value < a.value ? b : a));
    const format = this.format();
    return `Highest: ${high.label}, ${format(high.value)}. Lowest: ${low.label}, ${format(low.value)}.`;
  });

  /** A few labels along the bottom, not all thirty: first, last and some between. */
  protected readonly xLabels = computed(() => {
    const data = this.data();
    const every = Math.max(1, Math.ceil(data.length / 6));
    return data
      .map((point, index) => ({ point, index }))
      .filter(({ index }) => index % every === 0 || index === data.length - 1);
  });

  /** Each bar's slot, of which the bar takes most. */
  private readonly band = computed(() => {
    const { left, right } = this.plot();
    return (right - left) / Math.max(1, this.data().length);
  });
  protected readonly barWidth = computed(() => Math.max(1, this.band() * 0.7));

  protected readonly linePath = computed(() =>
    this.data()
      .map(
        (point, i) =>
          `${i === 0 ? 'M' : 'L'}${this.x(i)},${this.y(point.value)}`,
      )
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const data = this.data();
    if (data.length === 0) {
      return '';
    }
    const base = this.plot().bottom;
    return `${this.linePath()} L${this.x(data.length - 1)},${base} L${this.x(0)},${base} Z`;
  });

  protected readonly stroke = computed(() => STROKE[this.color()]);
  protected readonly fill = computed(() => FILL[this.color()]);
  protected readonly area = computed(() => AREA[this.color()]);
  protected readonly classes = computed(() => cn('block', this.class()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(([entry]) => {
        const width = Math.round(entry?.contentRect.width ?? 0);
        if (width > 0) {
          this.width.set(width);
        }
      });
      observer.observe(this.frame().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Where the i-th point sits across: spread edge to edge for a line, centred in its slot for a bar. */
  protected x(index: number): number {
    const { left, right } = this.plot();
    if (this.type() === 'bar') {
      return left + this.band() * (index + 0.5);
    }
    const last = Math.max(1, this.data().length - 1);
    return left + (index / last) * (right - left);
  }

  protected y(value: number): number {
    const { top, bottom } = this.plot();
    return bottom - (value / this.top()) * (bottom - top);
  }
}
