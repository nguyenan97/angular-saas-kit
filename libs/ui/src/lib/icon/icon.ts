import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

/**
 * What an icon draws: SVG elements and their attributes on a 24 x 24 grid.
 *
 * The shape of Lucide's `IconNode`, so every Lucide icon fits as it is
 * (`import { Menu } from 'lucide'`), and so does a drawing of your own.
 */
export type IconNode = readonly (readonly [
  tag: string,
  attributes: Readonly<Record<string, string | number | undefined>>,
])[];

/**
 * An inline SVG icon, drawn in `currentColor` so it takes the colour of the
 * text around it.
 *
 * Decorative unless it has a `label`: hidden from assistive technology when
 * the text next to it already says what it means, announced as an image with
 * that name when it stands alone.
 *
 * Drawn from the template, element by element, rather than from an HTML
 * string, so nothing is sanitised or trusted and it renders on the server.
 */
@Component({
  selector: 'ask-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="block size-full"
    >
      @for (node of icon(); track $index) {
        @switch (node[0]) {
          @case ('path') {
            <path [attr.d]="node[1]['d']" />
          }
          @case ('circle') {
            <circle
              [attr.cx]="node[1]['cx']"
              [attr.cy]="node[1]['cy']"
              [attr.r]="node[1]['r']"
              [attr.fill]="node[1]['fill']"
            />
          }
          @case ('ellipse') {
            <ellipse
              [attr.cx]="node[1]['cx']"
              [attr.cy]="node[1]['cy']"
              [attr.rx]="node[1]['rx']"
              [attr.ry]="node[1]['ry']"
            />
          }
          @case ('line') {
            <line
              [attr.x1]="node[1]['x1']"
              [attr.y1]="node[1]['y1']"
              [attr.x2]="node[1]['x2']"
              [attr.y2]="node[1]['y2']"
            />
          }
          @case ('rect') {
            <rect
              [attr.x]="node[1]['x']"
              [attr.y]="node[1]['y']"
              [attr.width]="node[1]['width']"
              [attr.height]="node[1]['height']"
              [attr.rx]="node[1]['rx']"
              [attr.ry]="node[1]['ry']"
            />
          }
          @case ('polyline') {
            <polyline [attr.points]="node[1]['points']" />
          }
          @case ('polygon') {
            <polygon [attr.points]="node[1]['points']" />
          }
        }
      }
    </svg>
  `,
})
export class Icon {
  /** The drawing: a Lucide icon, or any `IconNode`. */
  readonly icon = input.required<IconNode>();

  /**
   * The icon's name for assistive technology. Leave it empty when visible
   * text beside the icon says the same thing.
   */
  readonly label = input('');

  /** Line weight on the 24-unit grid. */
  readonly strokeWidth = input(2);

  /** Merged last, so a consumer's size or colour wins. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn('inline-block size-4 shrink-0', this.class()),
  );
}
