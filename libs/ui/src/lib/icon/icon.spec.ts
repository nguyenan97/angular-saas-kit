import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Menu } from 'lucide';
import { describe, expect, it } from 'vitest';

import { Icon, type IconNode } from './icon';

/** One of every element Lucide draws with, plus one it never uses. */
const EVERY_SHAPE: IconNode = [
  ['path', { d: 'M4 12h16' }],
  ['circle', { cx: 12, cy: 12, r: 1, fill: 'currentColor' }],
  ['ellipse', { cx: 12, cy: 5, rx: 9, ry: 3 }],
  ['line', { x1: 2, y1: 2, x2: 22, y2: 22 }],
  ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }],
  ['polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }],
  ['polygon', { points: '12 2 22 22 2 22' }],
  ['script', { src: 'nope.js' }],
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <ask-icon id="decorative" [icon]="menu" />
    <ask-icon id="labelled" [icon]="menu" label="Open menu" />
    <ask-icon id="shapes" [icon]="shapes" class="size-6" [strokeWidth]="1.5" />
  `,
})
class Host {
  readonly menu = Menu;
  readonly shapes = EVERY_SHAPE;
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const icon = (id: string): HTMLElement =>
    fixture.nativeElement.querySelector(`#${id}`);
  return { icon };
}

describe('Icon', () => {
  it('is hidden from assistive tech when it only decorates', async () => {
    const { icon } = await render();

    expect(icon('decorative').getAttribute('aria-hidden')).toBe('true');
    expect(icon('decorative').hasAttribute('role')).toBe(false);
  });

  it('is announced as a named image when it has a label', async () => {
    const { icon } = await render();

    expect(icon('labelled').getAttribute('role')).toBe('img');
    expect(icon('labelled').getAttribute('aria-label')).toBe('Open menu');
    expect(icon('labelled').hasAttribute('aria-hidden')).toBe(false);
  });

  it('draws a Lucide icon in the current text colour', async () => {
    const { icon } = await render();
    const svg = icon('decorative').querySelector('svg');

    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(
      [...(svg?.querySelectorAll('path') ?? [])].map((p) =>
        p.getAttribute('d'),
      ),
    ).toEqual(Menu.map(([, attributes]) => attributes['d']));
  });

  it('draws every element Lucide uses, and nothing else', async () => {
    const { icon } = await render();
    const svg = icon('shapes').querySelector('svg');
    const children = [...(svg?.children ?? [])];

    expect(children.map((child) => child.tagName.toLowerCase())).toEqual([
      'path',
      'circle',
      'ellipse',
      'line',
      'rect',
      'polyline',
      'polygon',
    ]);
    expect(svg?.querySelector('circle')?.getAttribute('fill')).toBe(
      'currentColor',
    );
    expect(svg?.querySelector('rect')?.getAttribute('rx')).toBe('2');
    expect(svg?.querySelector('polygon')?.getAttribute('points')).toBe(
      '12 2 22 22 2 22',
    );
    // SVG elements, not unknown HTML ones.
    expect(svg?.querySelector('path')?.namespaceURI).toBe(
      'http://www.w3.org/2000/svg',
    );
  });

  it('takes a consumer size and line weight', async () => {
    const { icon } = await render();

    expect(icon('shapes').classList).toContain('size-6');
    expect(icon('shapes').classList).not.toContain('size-4');
    expect(
      icon('shapes').querySelector('svg')?.getAttribute('stroke-width'),
    ).toBe('1.5');
  });
});
