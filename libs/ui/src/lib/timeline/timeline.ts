import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

export type TimelineState = 'complete' | 'current' | 'upcoming';

/** One step of an `ask-timeline`. */
export interface TimelineItem {
  readonly label: string;
  readonly state: TimelineState;
  /** When it happened, already formatted for people: "18 Oct, 09:00". */
  readonly time?: string;
  /** The same moment for machines (ISO 8601), set on the `<time>` element. */
  readonly dateTime?: string;
  readonly description?: string;
  /** `destructive` for a step that ends the flow badly: a cancellation, a failure. */
  readonly tone?: 'default' | 'destructive';
}

/** Read before each step, so the state is said and not only coloured. */
const STATE_TEXT: Record<TimelineState, string> = {
  complete: 'Completed: ',
  current: 'Current: ',
  upcoming: 'Upcoming: ',
};

// Forced colours drop backgrounds and shadows. So each marker has a border,
// a step reached gets a system-colour fill there, and the current step an
// outline (which survives) rather than a ring (a shadow, which does not).
const MARKER: Record<TimelineState, string> = {
  complete: 'border-2 border-primary bg-primary forced-colors:bg-[CanvasText]',
  current:
    'border-2 border-primary bg-primary outline-2 outline-offset-2 outline-primary forced-colors:bg-[CanvasText]',
  upcoming: 'border-2 border-border bg-background',
};

/**
 * The steps of a process in order: an order's status history, a shipment's
 * progress. An ordered list, so assistive technology says how many steps
 * there are and which one it is on; each step's state is spoken ("Current:"),
 * the current one carries `aria-current="step"`, and the marker is decoration.
 *
 * ```html
 * <ask-timeline label="Order status" [items]="steps()" />
 * ```
 */
@Component({
  selector: 'ask-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `
    <ol class="flex flex-col" [attr.aria-label]="label() || null">
      @for (item of items(); track $index; let last = $last) {
        <li
          class="relative flex gap-3 pb-6 last:pb-0"
          [attr.aria-current]="item.state === 'current' ? 'step' : null"
        >
          @if (!last) {
            <span
              data-line
              aria-hidden="true"
              class="absolute top-4 bottom-0 left-[0.4375rem] border-l border-border"
            ></span>
          }
          <span
            data-marker
            aria-hidden="true"
            [class]="markerClasses(item)"
          ></span>
          <div class="flex min-w-0 flex-col gap-0.5">
            <span
              class="text-sm font-medium"
              [class.text-muted-foreground]="item.state === 'upcoming'"
              ><span class="sr-only">{{ stateText[item.state] }}</span
              >{{ item.label }}</span
            >
            @if (item.time) {
              <span class="sr-only">, </span>
              <time
                class="text-xs text-muted-foreground"
                [attr.datetime]="item.dateTime || null"
                >{{ item.time }}</time
              >
            }
            @if (item.description) {
              <span class="text-sm text-muted-foreground"
                ><span class="sr-only">, </span>{{ item.description }}</span
              >
            }
          </div>
        </li>
      }
    </ol>
  `,
})
export class Timeline {
  readonly items = input.required<readonly TimelineItem[]>();

  /** The list's name for assistive technology: "Order status". */
  readonly label = input('');

  /** Merged last onto the host, so a consumer's classes win. */
  readonly class = input('');

  protected readonly stateText = STATE_TEXT;
  protected readonly classes = computed(() => cn('block', this.class()));

  protected markerClasses(item: TimelineItem): string {
    return cn(
      'relative mt-1 size-3.5 shrink-0 rounded-full',
      MARKER[item.state],
      item.tone === 'destructive' &&
        item.state !== 'upcoming' &&
        'border-destructive bg-destructive outline-destructive',
    );
  }
}
