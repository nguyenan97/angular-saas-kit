import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Timeline, type TimelineItem } from './timeline';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Timeline],
  template: `<ask-timeline
    label="Order status"
    class="max-w-sm"
    [items]="items()"
  />`,
})
class Host {
  readonly items = signal<TimelineItem[]>([
    {
      label: 'Created',
      state: 'complete',
      time: '18 Oct, 09:00',
      dateTime: '2026-10-18T02:00:00.000Z',
    },
    { label: 'Placed', state: 'current', description: 'Slot 20 Oct, 08-12' },
    { label: 'Confirmed', state: 'upcoming' },
  ]);
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const items = () => [...el.querySelectorAll<HTMLElement>('li')];
  return { fixture, el, items };
}

describe('Timeline', () => {
  it('is a named, ordered list with one item per step', async () => {
    const { el, items } = await render();

    const list = el.querySelector('ol');
    expect(list?.getAttribute('aria-label')).toBe('Order status');
    expect(items()).toHaveLength(3);
  });

  it('says the state of each step in words, not only with colour', async () => {
    const { items } = await render();

    expect(
      items().map((item) => item.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual([
      'Completed: Created, 18 Oct, 09:00',
      'Current: Placed, Slot 20 Oct, 08-12',
      'Upcoming: Confirmed',
    ]);
  });

  it('marks the current step with aria-current, and only that one', async () => {
    const { items } = await render();

    expect(items().map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      'step',
      null,
    ]);
  });

  it('gives a time its machine-readable value', async () => {
    const { el } = await render();

    expect(el.querySelector('time')?.getAttribute('datetime')).toBe(
      '2026-10-18T02:00:00.000Z',
    );
  });

  it('draws a destructive step, such as a cancellation, with its own marker', async () => {
    const { fixture, items } = await render();
    fixture.componentInstance.items.set([
      { label: 'Created', state: 'complete' },
      { label: 'Cancelled', state: 'current', tone: 'destructive' },
    ]);
    await fixture.whenStable();

    const marker = items()[1]?.querySelector('[data-marker]');
    expect(marker?.className).toContain('bg-destructive');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps its markers and line visible in forced colours, where backgrounds are dropped', async () => {
    const { items } = await render();

    for (const item of items()) {
      const marker = item.querySelector('[data-marker]');
      expect(marker?.className).toMatch(/border/);
    }
    expect(items()[0]?.querySelector('[data-line]')?.className).toContain(
      'border-l',
    );
  });

  it('tells the states apart in forced colours: a system fill for steps reached, an outline for the current one', async () => {
    const { items } = await render();
    const marker = (i: number) =>
      items()[i]?.querySelector('[data-marker]')?.className ?? '';

    expect(marker(0)).toContain('forced-colors:bg-[CanvasText]');
    expect(marker(1)).toContain('forced-colors:bg-[CanvasText]');
    expect(marker(1)).toMatch(/(^| )outline-2( |$)/);
    expect(marker(2)).not.toContain('forced-colors:bg-[CanvasText]');
    expect(marker(0)).not.toMatch(/(^| )outline-2( |$)/);
  });

  it("lets a consumer's class win", async () => {
    const { el } = await render();

    expect(el.querySelector('ask-timeline')?.className).toContain('max-w-sm');
  });
});
