import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { ChevronLeft, ChevronRight } from 'lucide';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { cn } from '../utils/cn';

/**
 * Previous and next for a paged list, and where the user is: "Page 2 of 5".
 *
 * At either end the button stays focusable and says it is unavailable
 * (`aria-disabled`), rather than becoming `disabled`: a disabled button
 * cannot hold focus, so a keyboard user who pressed "Next" onto the last
 * page would be dropped at the top of the document.
 *
 * It does not announce the change itself. The page does, in the summary it
 * shows above the list ("Showing 11 to 20 of 46"), in a live region.
 */
@Component({
  selector: 'ask-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  host: { '[class]': 'classes()' },
  template: `
    <nav
      class="flex items-center justify-between gap-4"
      [attr.aria-label]="label()"
    >
      <p class="text-sm text-muted-foreground">
        Page {{ page() }} of {{ pages() }}
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          askButton
          variant="outline"
          size="sm"
          [attr.aria-disabled]="first() || null"
          (click)="go(page() - 1)"
        >
          <ask-icon [icon]="previous" />
          Previous<span class="sr-only"> page</span>
        </button>
        <button
          type="button"
          askButton
          variant="outline"
          size="sm"
          [attr.aria-disabled]="last() || null"
          (click)="go(page() + 1)"
        >
          Next<span class="sr-only"> page</span>
          <ask-icon [icon]="next" />
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  /** Two-way: the current page, counted from 1. */
  readonly page = model(1);

  /** How many items the whole list has. */
  readonly total = input.required<number>();

  readonly pageSize = input(10);

  /** The navigation landmark's name: say what is paged, "Orders pages". */
  readonly label = input('Pages');

  /** Merged last onto the host, so a consumer's classes win. */
  readonly class = input('');

  protected readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly first = computed(() => this.page() <= 1);
  protected readonly last = computed(() => this.page() >= this.pages());

  protected readonly previous = ChevronLeft;
  protected readonly next = ChevronRight;
  protected readonly classes = computed(() => cn('block', this.class()));

  protected go(page: number): void {
    if (page >= 1 && page <= this.pages()) {
      this.page.set(page);
    }
  }
}
