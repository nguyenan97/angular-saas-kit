import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { cn } from '../utils/cn';

/** One choice in an `ask-combobox`. */
export interface ComboboxOption {
  /** What `value` holds when this option is chosen. */
  readonly value: string;
  /** The text shown, matched against what the user types, and put in the box once chosen. */
  readonly label: string;
  /** A second, quieter line: a city, an SKU. */
  readonly description?: string;
}

let nextId = 0;

/** What the CDK's key manager moves between: the filtered options, by index. */
interface ActiveOption {
  readonly option: ComboboxOption;
  setActiveStyles(): void;
  setInactiveStyles(): void;
  getLabel(): string;
}

/**
 * A text box that filters a list of options as the user types: the WAI-ARIA
 * combobox pattern with a listbox popup and list autocomplete.
 *
 * ```html
 * <label askLabel for="customer">Customer</label>
 * <ask-combobox inputId="customer" [options]="customers" [(value)]="customerId" />
 * ```
 *
 * Focus stays in the box; `aria-activedescendant` points at the active
 * option, moved by the CDK's `ActiveDescendantKeyManager`. Down and Up open
 * the list and move through it, Enter chooses, Escape closes and then clears,
 * and Home and End stay with the text. Leaving the box puts the chosen
 * option's label back, so the text never claims a choice that was not made.
 */
@Component({
  selector: 'ask-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    // The box keeps focus and owns the keys. A pointer picks an option
    // through these two listeners: mousedown is cancelled so the box does
    // not blur, and the click chooses the option under the pointer.
    '(mousedown)': 'onPointerDown($event)',
    '(click)': 'onClick($event)',
  },
  template: `
    <input
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      class="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
      [id]="inputId()"
      [value]="text()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [attr.aria-label]="label() || null"
      [attr.aria-describedby]="describedBy() || null"
      [attr.aria-invalid]="invalid() || null"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="expanded() ? listId() : null"
      [attr.aria-activedescendant]="activeId()"
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
      (click)="show()"
      (blur)="onBlur()"
    />
    @if (expanded()) {
      <ul
        role="listbox"
        data-combobox-popup
        class="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        [id]="listId()"
        [attr.aria-label]="label() || null"
        [attr.aria-labelledby]="label() ? null : inputId()"
      >
        @for (option of filtered(); track option.value; let i = $index) {
          <li
            role="option"
            class="flex cursor-pointer flex-col rounded-sm px-2 py-1.5 text-sm select-none hover:bg-accent hover:text-accent-foreground aria-selected:font-medium data-active:bg-accent data-active:text-accent-foreground data-active:outline-2 data-active:-outline-offset-2 data-active:outline-ring"
            [id]="optionId(i)"
            [attr.aria-selected]="option.value === value()"
            [attr.data-active]="i === activeIndex() || null"
            [attr.data-index]="i"
          >
            <span>{{ option.label }}</span>
            @if (option.description) {
              <!-- The comma is read out, so the two lines do not run together. -->
              <span class="text-xs text-muted-foreground"
                ><span class="sr-only">, </span>{{ option.description }}</span
              >
            }
          </li>
        }
      </ul>
    }
    <!-- Always in the page, so a screen reader hears the message change. -->
    <span role="status" class="sr-only">{{
      noMatches() ? emptyText() : ''
    }}</span>
    @if (noMatches()) {
      <p
        aria-hidden="true"
        data-combobox-popup
        class="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md"
      >
        {{ emptyText() }}
      </p>
    }
  `,
})
export class Combobox {
  readonly options = input.required<readonly ComboboxOption[]>();

  /** Two-way: the chosen option's `value`, or null. */
  readonly value = model<string | null>(null);

  /** The text box's id, for a `<label for>` on the page. */
  readonly inputId = input(`ask-combobox-${nextId++}`);

  /** A name for assistive technology when there is no visible label. */
  readonly label = input('');

  readonly placeholder = input('');

  /** Ids of the elements that describe the box: a hint, an error. */
  readonly describedBy = input('');

  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Said when no option matches what was typed. */
  readonly emptyText = input('No matches');

  /** Merged last onto the host, so a consumer's classes win. */
  readonly class = input('');

  protected readonly listId = computed(() => `${this.inputId()}-listbox`);
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);

  /** What the user typed since the last choice; null while it shows the chosen label. */
  private readonly query = signal<string | null>(null);

  private readonly chosen = computed(() =>
    this.options().find((option) => option.value === this.value()),
  );

  protected readonly text = computed(
    () => this.query() ?? this.chosen()?.label ?? '',
  );

  protected readonly filtered = computed(() => {
    const query = this.query()?.trim().toLowerCase() ?? '';
    return query
      ? this.options().filter((option) =>
          option.label.toLowerCase().includes(query),
        )
      : this.options();
  });

  /** Open with options to show: an open list with no matches shows only a message. */
  protected readonly expanded = computed(
    () => this.open() && this.filtered().length > 0,
  );

  protected readonly noMatches = computed(
    () => this.open() && this.filtered().length === 0,
  );

  protected readonly activeId = computed(() =>
    this.expanded() &&
    this.activeIndex() >= 0 &&
    // The options may have changed under an open list.
    this.activeIndex() < this.filtered().length
      ? this.optionId(this.activeIndex())
      : null,
  );

  protected readonly classes = computed(() =>
    cn('relative block', this.class()),
  );

  private readonly items = computed<ActiveOption[]>(() =>
    this.filtered().map((option) => ({
      option,
      setActiveStyles: () => undefined,
      setInactiveStyles: () => undefined,
      getLabel: () => option.label,
    })),
  );

  private readonly keyManager = new ActiveDescendantKeyManager(
    this.items,
    inject(Injector),
  )
    .withVerticalOrientation()
    .withWrap();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    this.keyManager.change
      .pipe(takeUntilDestroyed())
      .subscribe((index) => this.activeIndex.set(index));
  }

  protected optionId(index: number): string {
    return `${this.listId()}-option-${index}`;
  }

  /** Opens the list, with the chosen option active unless `withActive` is false. */
  protected show(withActive = true): void {
    if (this.disabled() || this.open()) return;
    this.open.set(true);
    if (!withActive) {
      this.setActive(-1);
      return;
    }
    const selected = this.filtered().findIndex(
      (option) => option.value === this.value(),
    );
    this.setActive(selected);
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.open.set(true);
    // A new list of matches starts with nothing active, at once: a key
    // pressed straight after typing must not be undone by a later reset.
    this.setActive(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const down = event.key === 'ArrowDown';
        // Alt+Down opens without choosing a place; Alt+Up closes.
        if (event.altKey) {
          if (down) this.show(false);
          else this.close();
          return;
        }
        if (!this.open()) {
          // Opening lands on the chosen option, when there is one.
          this.show();
          if (this.activeIndex() >= 0) return;
        }
        if (this.activeIndex() < 0) {
          if (down) this.keyManager.setFirstItemActive();
          else this.keyManager.setLastItemActive();
          return;
        }
        this.keyManager.onKeydown(event);
        return;
      }
      case 'Enter': {
        const active = this.filtered()[this.activeIndex()];
        if (this.open() && active) {
          event.preventDefault();
          this.choose(active);
        }
        return;
      }
      case 'Escape': {
        if (this.open()) {
          event.preventDefault();
          this.close();
        } else if (this.text()) {
          event.preventDefault();
          this.query.set(null);
          this.value.set(null);
        }
        return;
      }
      case 'Tab':
        this.commit();
        return;
    }
  }

  protected onBlur(): void {
    this.commit();
  }

  /** Leaving the box: an emptied box clears the value; anything else shows the choice again. */
  private commit(): void {
    if (this.query()?.trim() === '') this.value.set(null);
    this.close();
  }

  protected onPointerDown(event: MouseEvent): void {
    const popup = (event.target as Element | null)?.closest(
      '[data-combobox-popup]',
    );
    if (popup) event.preventDefault();
  }

  protected onClick(event: MouseEvent): void {
    const option = this.optionAt(event);
    if (option) this.choose(option);
  }

  /** The option under a pointer event, if any. */
  private optionAt(event: Event): ComboboxOption | undefined {
    const item = (event.target as Element | null)?.closest('[role="option"]');
    return item
      ? this.filtered()[Number(item.getAttribute('data-index'))]
      : undefined;
  }

  protected choose(option: ComboboxOption): void {
    this.value.set(option.value);
    this.close();
  }

  private close(): void {
    this.open.set(false);
    this.query.set(null);
  }

  private setActive(index: number): void {
    if (index >= 0) {
      this.keyManager.setActiveItem(index);
    } else {
      this.keyManager.updateActiveItem(-1);
      this.activeIndex.set(-1);
    }
  }
}
