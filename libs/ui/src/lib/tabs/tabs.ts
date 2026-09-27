import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  Injector,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { cn } from '../utils/cn';

let nextId = 0;

/** One tab of an `ask-tabs`: its label, and the content of its panel. */
@Component({
  selector: 'ask-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-template><ng-content /></ng-template>',
})
export class Tab {
  readonly label = input.required<string>();

  /** Skipped by the arrow keys and ignored when clicked. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** @internal The panel's content, rendered by the parent `Tabs`. */
  readonly content = viewChild.required(TemplateRef);
}

const TAB =
  'inline-flex h-7 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors hover:text-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-xs';

/**
 * Tabs, as the WAI-ARIA tabs pattern with automatic activation describes
 * them: one tab stop for the whole list, Left and Right (mirrored in a
 * right-to-left page) to move between tabs, Home and End for the first and
 * last, and the panel after the list in the tab order.
 *
 * ```html
 * <ask-tabs label="Order" [(selectedIndex)]="tab">
 *   <ask-tab label="Summary">...</ask-tab>
 *   <ask-tab label="Items">...</ask-tab>
 * </ask-tabs>
 * ```
 *
 * The roving focus is the CDK's `FocusKeyManager`, not hand-rolled.
 */
@Component({
  selector: 'ask-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { '[class]': 'classes()' },
  template: `
    <div
      role="tablist"
      aria-orientation="horizontal"
      [attr.aria-label]="label() || null"
      [attr.aria-labelledby]="labelledBy() || null"
      class="inline-flex h-9 w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground"
    >
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          #tabButton
          type="button"
          role="tab"
          [id]="tabId(i)"
          [class]="tabClasses"
          [attr.aria-selected]="i === selectedIndex()"
          [attr.aria-controls]="i === selectedIndex() ? panelId : null"
          [attr.aria-disabled]="tab.disabled() || null"
          [tabIndex]="i === selectedIndex() ? 0 : -1"
          (click)="select(i)"
          (keydown)="onKeydown($event)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>

    @if (selectedTab(); as tab) {
      <div
        role="tabpanel"
        tabindex="0"
        class="mt-4 rounded-md"
        [id]="panelId"
        [attr.aria-labelledby]="tabId(selectedIndex())"
      >
        <ng-container [ngTemplateOutlet]="tab.content()" />
      </div>
    }
  `,
})
export class Tabs {
  /** The list's name for assistive technology, unless `labelledBy` names it. */
  readonly label = input('');

  /** The id of a visible heading that names the list. */
  readonly labelledBy = input('');

  /** Two-way: which tab is open. */
  readonly selectedIndex = model(0);

  /** Merged last onto the host, so a consumer's classes win. */
  readonly class = input('');

  protected readonly tabs = contentChildren(Tab);
  private readonly buttons =
    viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  private readonly baseId = `ask-tabs-${nextId++}`;
  protected readonly panelId = `${this.baseId}-panel`;
  protected readonly tabClasses = TAB;

  protected readonly selectedTab = computed(
    () => this.tabs()[this.selectedIndex()],
  );

  protected readonly classes = computed(() => cn('block', this.class()));

  /** What the key manager moves between: each tab button, and whether it is disabled. */
  private readonly options = computed(() =>
    this.buttons().map((button, index) => ({
      focus: () => button.nativeElement.focus(),
      disabled: this.tabs()[index]?.disabled() ?? false,
    })),
  );

  private readonly keyManager = new FocusKeyManager(
    this.options,
    inject(Injector),
  )
    .withHorizontalOrientation(inject(Directionality).value)
    .withVerticalOrientation(false)
    .withHomeAndEnd()
    .withWrap()
    .skipPredicate((option) => option.disabled);

  constructor() {
    // Automatic activation: the tab that receives focus opens.
    this.keyManager.change
      .pipe(takeUntilDestroyed())
      .subscribe((index) => this.selectedIndex.set(index));

    // A click, or a change from outside, moves the key manager along with it.
    effect(() => {
      this.options();
      this.keyManager.updateActiveItem(this.selectedIndex());
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);
  }

  protected select(index: number): void {
    if (!this.tabs()[index]?.disabled()) {
      this.selectedIndex.set(index);
    }
  }

  protected tabId(index: number): string {
    return `${this.baseId}-tab-${index}`;
  }
}
