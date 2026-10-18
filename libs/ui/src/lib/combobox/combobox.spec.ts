import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Combobox, type ComboboxOption } from './combobox';

const CUSTOMERS: ComboboxOption[] = [
  { value: 'C-01', label: 'Minh Chau Mart', description: 'Ha Noi' },
  { value: 'C-02', label: 'Hoa Binh Grocery' },
  { value: 'C-03', label: 'Sen Vang Store' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Combobox],
  template: `
    <label for="customer">Customer</label>
    <ask-combobox
      inputId="customer"
      class="w-80"
      [options]="options"
      [(value)]="value"
      [invalid]="invalid()"
    />
    <button type="button">Next</button>
  `,
})
class Host {
  readonly options = CUSTOMERS;
  readonly value = signal<string | null>(null);
  readonly invalid = signal(false);
}

/** The CDK reads `keyCode`, which a synthetic event cannot set by itself. */
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Tab: 9,
};

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const input = el.querySelector('input') as HTMLInputElement;
  const listbox = () => el.querySelector<HTMLElement>('[role="listbox"]');
  const options = () => [
    ...el.querySelectorAll<HTMLElement>('[role="option"]'),
  ];
  const press = async (key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });
    input.dispatchEvent(event);
    await fixture.whenStable();
    return event;
  };
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  };
  const active = () =>
    el.querySelector(`#${input.getAttribute('aria-activedescendant')}`);
  return { fixture, el, input, listbox, options, press, type, active };
}

describe('Combobox', () => {
  it('is a text box with the combobox role, labelled by the page, collapsed at first', async () => {
    const { el, input, listbox } = await render();

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.id).toBe('customer');
    expect(el.querySelector('label')?.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(listbox()).toBeNull();
  });

  it('opens the listbox with Down and moves the active option without moving focus', async () => {
    const { input, listbox, options, press, active } = await render();
    input.focus();

    await press('ArrowDown');

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(listbox()?.id);
    expect(options().map((o) => o.textContent?.trim())).toEqual([
      'Minh Chau Mart, Ha Noi',
      'Hoa Binh Grocery',
      'Sen Vang Store',
    ]);
    expect(active()).toBe(options()[0]);

    await press('ArrowDown');
    expect(active()).toBe(options()[1]);
    await press('ArrowUp');
    await press('ArrowUp');
    expect(active()).toBe(options()[2]);
    expect(document.activeElement).toBe(input);
  });

  it('chooses the active option with Enter, fills the box and closes', async () => {
    const { fixture, input, listbox, press } = await render();
    input.focus();

    await press('ArrowDown');
    await press('ArrowDown');
    const enter = await press('Enter');

    expect(fixture.componentInstance.value()).toBe('C-02');
    expect(input.value).toBe('Hoa Binh Grocery');
    expect(listbox()).toBeNull();
    expect(enter.defaultPrevented).toBe(true);
  });

  it('marks the chosen option as selected when the list opens again', async () => {
    const { fixture, input, options, press, active } = await render();
    fixture.componentInstance.value.set('C-03');
    await fixture.whenStable();
    input.focus();

    expect(input.value).toBe('Sen Vang Store');
    await press('ArrowDown');

    expect(options()[2]?.getAttribute('aria-selected')).toBe('true');
    expect(options()[0]?.getAttribute('aria-selected')).toBe('false');
    expect(active()).toBe(options()[2]);
  });

  it('filters the options as the user types, ignoring case, and says when nothing matches', async () => {
    const { el, options, type } = await render();

    await type('mart');
    expect(options().map((o) => o.textContent?.trim())).toEqual([
      'Minh Chau Mart, Ha Noi',
    ]);

    await type('zzz');
    expect(options()).toEqual([]);
    expect(el.querySelector('[role="status"]')?.textContent).toContain(
      'No matches',
    );
  });

  it('chooses an option with a click, keeping focus in the box', async () => {
    const { fixture, input, options, press } = await render();
    input.focus();
    await press('ArrowDown');
    const target = options()[2]?.querySelector('span') as HTMLElement;

    const down = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(down);
    target.click();
    await fixture.whenStable();

    expect(down.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.value()).toBe('C-03');
    expect(input.value).toBe('Sen Vang Store');
  });

  it('closes with Escape, and clears the box with a second Escape', async () => {
    const { fixture, input, listbox, press } = await render();
    fixture.componentInstance.value.set('C-01');
    await fixture.whenStable();
    input.focus();
    await press('ArrowDown');

    await press('Escape');
    expect(listbox()).toBeNull();
    expect(fixture.componentInstance.value()).toBe('C-01');

    await press('Escape');
    expect(input.value).toBe('');
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('puts the chosen label back when the user leaves after typing, and clears the value when the box was emptied', async () => {
    const { fixture, input, type } = await render();
    fixture.componentInstance.value.set('C-01');
    await fixture.whenStable();

    await type('Hoa');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(input.value).toBe('Minh Chau Mart');
    expect(fixture.componentInstance.value()).toBe('C-01');

    await type('');
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('reports an invalid value, and lets a consumer class win', async () => {
    const { fixture, el, input } = await render();
    fixture.componentInstance.invalid.set(true);
    await fixture.whenStable();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('ask-combobox')?.className).toContain('w-80');
  });
});
