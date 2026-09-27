import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Renderer2,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide';

import { Icon } from '../icon/icon';
import { cn } from '../utils/cn';

// The rows and cells are styled from the table, so the markup stays plain
// HTML: `thead`, `th scope="col"`, `tbody`, `td`. Screen readers get a real
// table, with its headers and its row and column counts.
//
// Each rule is wrapped in `:where()`, which counts for nothing in
// specificity, so a class on a cell wins: `<th class="text-right">`. Written
// as `[&_th]` instead, the table's `th { text-align: left }` would outrank it.
const TABLE = [
  'w-full caption-bottom border-collapse text-sm',
  '[:where(&)_caption]:mt-3 [:where(&)_caption]:text-left [:where(&)_caption]:text-muted-foreground',
  '[:where(&)_thead_tr]:border-b [:where(&)_thead_tr]:border-border',
  '[:where(&)_th]:h-10 [:where(&)_th]:px-3 [:where(&)_th]:text-left [:where(&)_th]:align-middle [:where(&)_th]:font-medium [:where(&)_th]:whitespace-nowrap [:where(&)_th]:text-muted-foreground',
  '[:where(&)_td]:px-3 [:where(&)_td]:py-2.5 [:where(&)_td]:align-middle',
  '[:where(&)_tbody_tr]:border-b [:where(&)_tbody_tr]:border-border [:where(&)_tbody_tr]:transition-colors [:where(&)_tbody_tr:hover]:bg-muted/50 [:where(&)_tbody_tr:last-child]:border-0',
  '[:where(&)_tfoot]:border-t [:where(&)_tfoot]:border-border [:where(&)_tfoot]:bg-muted/50 [:where(&)_tfoot]:font-medium',
].join(' ');

/**
 * Styles a native `<table>` and everything in it.
 *
 * Wide tables belong in a container that scrolls, not the page: wrap one in
 * `<div class="overflow-x-auto" tabindex="0" role="region" aria-label="...">`
 * so the scrolling part can be reached and named by keyboard and screen
 * reader users.
 */
@Directive({
  selector: 'table[askTable]',
  host: { '[class]': 'classes()' },
})
export class Table {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() => cn(TABLE, this.class()));
}

export type SortDirection = 'asc' | 'desc';

/** Which column a table is sorted by, and which way. */
export interface Sort {
  readonly column: string;
  readonly direction: SortDirection;
}

/**
 * Makes a column header sortable. Put it inside the `th`:
 *
 * ```html
 * <th scope="col"><ask-sort-header column="total" [(sort)]="sort">Total</ask-sort-header></th>
 * ```
 *
 * It renders a button, which a keyboard reaches and Enter or Space activates,
 * and sets `aria-sort` on the header cell of the sorted column only, as the
 * WAI-ARIA sortable-table pattern asks. Sorting the rows is the page's job:
 * read the `sort` model.
 */
@Component({
  selector: 'ask-sort-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button type="button" [class]="buttonClasses()" (click)="toggle()">
      <ng-content />
      <ask-icon [icon]="icon()" class="size-3.5" />
    </button>
  `,
})
export class SortHeader {
  /** The key this header sorts by. */
  readonly column = input.required<string>();

  /** Shared by every header of the table; only one column is sorted at a time. */
  readonly sort = model<Sort | null>(null);

  /** Merged last onto the button, so a consumer's classes win. */
  readonly class = input('');

  /** This column's direction, or null when another column (or none) is sorted. */
  readonly direction = computed<SortDirection | null>(() => {
    const sort = this.sort();
    return sort?.column === this.column() ? sort.direction : null;
  });

  protected readonly icon = computed(() => {
    const direction = this.direction();
    if (direction === 'asc') {
      return ArrowUp;
    }
    return direction === 'desc' ? ArrowDown : ChevronsUpDown;
  });

  protected readonly buttonClasses = computed(() =>
    cn(
      '-mx-2 inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
      this.direction() ? 'text-foreground' : 'text-muted-foreground',
      this.class(),
    ),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);

    afterRenderEffect(() => {
      const cell = host.closest('th');
      if (!cell) {
        return;
      }
      const direction = this.direction();
      if (direction) {
        renderer.setAttribute(
          cell,
          'aria-sort',
          direction === 'asc' ? 'ascending' : 'descending',
        );
      } else {
        renderer.removeAttribute(cell, 'aria-sort');
      }
    });
  }

  protected toggle(): void {
    this.sort.set({
      column: this.column(),
      direction: this.direction() === 'asc' ? 'desc' : 'asc',
    });
  }
}
