import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Directive, computed, input } from '@angular/core';

import { cn } from '../utils/cn';

/**
 * Opens a menu from a button:
 *
 * ```html
 * <button askButton [askMenuTrigger]="actions">Actions</button>
 * <ng-template #actions>
 *   <div askMenu>
 *     <button askMenuItem (triggered)="edit()">Edit</button>
 *   </div>
 * </ng-template>
 * ```
 *
 * The behaviour is the CDK's menu, which implements the WAI-ARIA menu button
 * pattern: `aria-haspopup` and `aria-expanded` on the trigger; Enter, Space
 * or Down to open; arrow keys, Home, End and typeahead to move; Escape to
 * close and return focus to the trigger.
 */
@Directive({
  selector: '[askMenuTrigger]',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: [
        'cdkMenuTriggerFor: askMenuTrigger',
        'cdkMenuPosition: menuPosition',
        'cdkMenuTriggerData: menuData',
      ],
      outputs: ['cdkMenuOpened: menuOpened', 'cdkMenuClosed: menuClosed'],
    },
  ],
})
export class MenuTrigger {}

/**
 * The menu itself (`role="menu"`), on the element inside the trigger's
 * template. Named `MenuPanel` so it does not clash with Lucide's `Menu` icon.
 */
@Directive({
  selector: '[askMenu]',
  hostDirectives: [CdkMenu],
  host: { '[class]': 'classes()' },
})
export class MenuPanel {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn(
      'flex min-w-40 flex-col rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none',
      this.class(),
    ),
  );
}

/**
 * An item (`role="menuitem"`). Put it on a `<button>`. Listen to
 * `(triggered)`, which fires for a click, Enter and Space alike and closes
 * the menu. A disabled item stays focusable, as the pattern asks, so it can
 * still be found and read.
 */
@Directive({
  selector: '[askMenuItem]',
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: { '[class]': 'classes()' },
})
export class MenuItem {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn(
      // The focus ring is drawn inside the item so the menu's edge cannot clip it.
      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:-outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_ask-icon]:size-4',
      this.class(),
    ),
  );
}

/** A line between groups of items. */
@Directive({
  selector: '[askMenuSeparator]',
  host: { role: 'separator', '[class]': 'classes()' },
})
export class MenuSeparator {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('-mx-1 my-1 h-px bg-border', this.class()),
  );
}
