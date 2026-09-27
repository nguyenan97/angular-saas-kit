import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { MenuItem, MenuPanel, MenuSeparator, MenuTrigger } from './menu';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuTrigger, MenuPanel, MenuItem, MenuSeparator],
  template: `
    <button type="button" id="trigger" [askMenuTrigger]="actions">
      Actions
    </button>
    <ng-template #actions>
      <div askMenu>
        <button type="button" askMenuItem (triggered)="picked.push('edit')">
          Edit
        </button>
        <button type="button" askMenuItem (triggered)="picked.push('copy')">
          Duplicate
        </button>
        <div askMenuSeparator></div>
        <button
          type="button"
          askMenuItem
          [disabled]="true"
          (triggered)="picked.push('archive')"
        >
          Archive
        </button>
      </div>
    </ng-template>
  `,
})
class Host {
  readonly picked: string[] = [];
}

/** The CDK reads `keyCode`, which a synthetic event cannot set by itself. */
function press(target: EventTarget, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const trigger: HTMLButtonElement =
    fixture.nativeElement.querySelector('#trigger');
  const settle = async () => {
    await fixture.whenStable();
    await Promise.resolve();
    await fixture.whenStable();
  };
  return { fixture, trigger, settle };
}

const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
const items = () => [
  ...document.querySelectorAll<HTMLElement>('[role="menuitem"]'),
];
const focusedText = () => document.activeElement?.textContent?.trim();

describe('Menu', () => {
  it('announces the menu it opens', async () => {
    const { trigger } = await render();

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  it('opens a menu of items on click', async () => {
    const { trigger, settle } = await render();

    trigger.click();
    await settle();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(items().map((item) => item.textContent?.trim())).toEqual([
      'Edit',
      'Duplicate',
      'Archive',
    ]);
    expect(document.querySelector('[role="separator"]')).not.toBeNull();
    expect(menu()?.classList).toContain('bg-popover');
  });

  it('runs an item and closes', async () => {
    const { fixture, trigger, settle } = await render();
    trigger.click();
    await settle();

    items()[1]?.click();
    await settle();

    expect(fixture.componentInstance.picked).toEqual(['copy']);
    expect(menu()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a disabled item readable but inert', async () => {
    const { fixture, trigger, settle } = await render();
    trigger.click();
    await settle();
    const archive = items()[2];

    archive?.click();
    await settle();

    expect(archive?.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.componentInstance.picked).toEqual([]);
  });

  it('works from the keyboard: Down opens, arrows move, Escape returns focus', async () => {
    const { trigger, settle } = await render();
    trigger.focus();

    press(trigger, 'ArrowDown', 40);
    await settle();
    expect(menu()).not.toBeNull();
    expect(focusedText()).toBe('Edit');

    press(document.activeElement as HTMLElement, 'ArrowDown', 40);
    await settle();
    expect(focusedText()).toBe('Duplicate');

    press(document.activeElement as HTMLElement, 'Escape', 27);
    await settle();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
