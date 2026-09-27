import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Chart, type ChartPoint, type ChartType, niceTicks } from './chart';

const DATA: ChartPoint[] = [
  { label: 'Mon', value: 10 },
  { label: 'Tue', value: 30 },
  { label: 'Wed', value: 20 },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chart],
  template: `
    <ask-chart
      label="Orders per day"
      categoryLabel="Day"
      valueLabel="Orders"
      class="mt-4"
      [type]="type()"
      [color]="2"
      [data]="data()"
      [format]="format"
    />
  `,
})
class Host {
  readonly type = signal<ChartType>('line');
  readonly data = signal<ChartPoint[]>(DATA);
  readonly format = (value: number) => `${value} orders`;
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, el };
}

describe('niceTicks', () => {
  it('counts up in round steps to at least the highest value', () => {
    expect(niceTicks(48)).toEqual([0, 20, 40, 60]);
    expect(niceTicks(9)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks(2410)).toEqual([0, 1000, 2000, 3000]);
  });

  it('still draws an axis for nothing', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe('Chart', () => {
  it('is a figure named by its caption, with a summary in words', async () => {
    const { el } = await render();

    const parts = [...(el.querySelector('figcaption')?.children ?? [])].map(
      (part) => part.textContent?.trim(),
    );
    expect(parts).toEqual([
      'Orders per day',
      'Highest: Tue, 30 orders. Lowest: Mon, 10 orders.',
    ]);
  });

  it('hides the drawing from assistive tech and offers the numbers as a table', async () => {
    const { el } = await render();
    const details = el.querySelector('details');

    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    // A native disclosure: operable by keyboard, closed until asked for.
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')?.textContent?.trim()).toBe(
      'Show the data',
    );
    expect(
      [...(details?.querySelectorAll('th') ?? [])].map((th) =>
        th.textContent?.trim(),
      ),
    ).toEqual(['Day', 'Orders']);
    expect(
      [...(details?.querySelectorAll('tbody tr') ?? [])].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Mon', '10 orders'],
      ['Tue', '30 orders'],
      ['Wed', '20 orders'],
    ]);
  });

  it('draws a line through every point, in the chosen chart colour', async () => {
    const { el } = await render();
    const svg = el.querySelector('svg');

    expect(svg?.querySelectorAll('circle')).toHaveLength(3);
    const line = svg?.querySelector('path[fill="none"]');
    expect(line?.getAttribute('d')).toMatch(
      /^M[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+$/,
    );
    expect(line?.classList).toContain('stroke-chart-2');
    // Each point says its value on hover.
    expect(svg?.querySelector('circle title')?.textContent).toBe(
      'Mon: 10 orders',
    );
  });

  it('draws bars in proportion to their values', async () => {
    const { fixture, el } = await render();

    fixture.componentInstance.type.set('bar');
    await fixture.whenStable();

    const heights = [...el.querySelectorAll('rect')].map((bar) =>
      Number(bar.getAttribute('height')),
    );
    expect(heights).toHaveLength(3);
    expect((heights[1] ?? 0) / (heights[0] ?? 1)).toBeCloseTo(3, 5);
    expect(el.querySelector('rect')?.classList).toContain('fill-chart-2');
  });

  it('labels the value axis with the same format as the table', async () => {
    const { el } = await render();

    const axis = [...el.querySelectorAll('svg text[text-anchor="end"]')].map(
      (text) => text.textContent?.trim(),
    );
    expect(axis).toEqual(['0 orders', '10 orders', '20 orders', '30 orders']);
  });

  it('says so when there is nothing to draw', async () => {
    const { fixture, el } = await render();

    fixture.componentInstance.data.set([]);
    await fixture.whenStable();

    expect(el.querySelector('figcaption')?.textContent).toContain('No data.');
  });

  it('lets a consumer class win on the host', async () => {
    const { el } = await render();

    expect(el.querySelector('ask-chart')?.classList).toContain('mt-4');
  });
});
