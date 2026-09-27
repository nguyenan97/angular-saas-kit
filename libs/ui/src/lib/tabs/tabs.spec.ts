import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Tab, Tabs } from './tabs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tabs, Tab],
  template: `
    <ask-tabs label="Order" [(selectedIndex)]="selected">
      <ask-tab label="Summary"><p>Summary panel</p></ask-tab>
      <ask-tab label="Items"><p>Items panel</p></ask-tab>
      <ask-tab label="Refunds" disabled><p>Refunds panel</p></ask-tab>
      <ask-tab label="History"><p>History panel</p></ask-tab>
    </ask-tabs>
  `,
})
class Host {
  readonly selected = signal(0);
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
  const el: HTMLElement = fixture.nativeElement;
  const tabs = () => [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
  const panel = () => el.querySelector<HTMLElement>('[role="tabpanel"]');
  const selected = () =>
    tabs().find((tab) => tab.getAttribute('aria-selected') === 'true');
  const pressOnFocused = async (key: string, keyCode: number) => {
    press(document.activeElement as HTMLElement, key, keyCode);
    await fixture.whenStable();
  };
  return { fixture, el, tabs, panel, selected, pressOnFocused };
}

describe('Tabs', () => {
  it('builds a named tab list, with the first tab open', async () => {
    const { el, tabs, panel, selected } = await render();

    expect(
      el.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
    ).toBe('Order');
    expect(tabs().map((tab) => tab.textContent?.trim())).toEqual([
      'Summary',
      'Items',
      'Refunds',
      'History',
    ]);
    expect(selected()?.textContent?.trim()).toBe('Summary');
    expect(panel()?.textContent?.trim()).toBe('Summary panel');
    expect(panel()?.getAttribute('aria-labelledby')).toBe(selected()?.id);
  });

  it('is one tab stop: only the open tab is in the tab order', async () => {
    const { tabs, panel } = await render();

    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1]);
    // The panel follows the list in the tab order.
    expect(panel()?.tabIndex).toBe(0);
  });

  it('points only the open tab at the panel', async () => {
    const { tabs, panel } = await render();

    expect(tabs()[0]?.getAttribute('aria-controls')).toBe(panel()?.id);
    expect(tabs()[1]?.hasAttribute('aria-controls')).toBe(false);
  });

  it('opens a tab on click, and reports it two-way', async () => {
    const { fixture, tabs, panel, selected } = await render();

    tabs()[1]?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selected()).toBe(1);
    expect(selected()?.textContent?.trim()).toBe('Items');
    expect(panel()?.textContent?.trim()).toBe('Items panel');
  });

  it('moves with the arrow keys, opening the tab that gets focus', async () => {
    const { tabs, selected, pressOnFocused } = await render();
    tabs()[0]?.focus();

    await pressOnFocused('ArrowRight', 39);
    expect(document.activeElement).toBe(tabs()[1]);
    expect(selected()).toBe(tabs()[1]);

    // Refunds is disabled, so the next stop is History.
    await pressOnFocused('ArrowRight', 39);
    expect(selected()).toBe(tabs()[3]);

    // And it wraps, both ways.
    await pressOnFocused('ArrowRight', 39);
    expect(selected()).toBe(tabs()[0]);
    await pressOnFocused('ArrowLeft', 37);
    expect(selected()).toBe(tabs()[3]);
  });

  it('jumps to the first and last tabs with Home and End', async () => {
    const { tabs, selected, pressOnFocused } = await render();
    tabs()[0]?.focus();

    await pressOnFocused('End', 35);
    expect(selected()).toBe(tabs()[3]);
    await pressOnFocused('Home', 36);
    expect(selected()).toBe(tabs()[0]);
  });

  it('leaves a disabled tab closed, and says it is disabled', async () => {
    const { fixture, tabs, selected } = await render();

    tabs()[2]?.click();
    await fixture.whenStable();

    expect(tabs()[2]?.getAttribute('aria-disabled')).toBe('true');
    expect(selected()).toBe(tabs()[0]);
  });

  it('follows a selection made from outside', async () => {
    const { fixture, panel, selected } = await render();

    fixture.componentInstance.selected.set(3);
    await fixture.whenStable();

    expect(selected()?.textContent?.trim()).toBe('History');
    expect(panel()?.textContent?.trim()).toBe('History panel');
  });
});
