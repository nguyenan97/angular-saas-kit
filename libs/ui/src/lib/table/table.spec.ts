import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { type Sort, SortHeader, Table } from './table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Table, SortHeader],
  template: `
    <table askTable class="text-xs">
      <caption>
        Orders
      </caption>
      <thead>
        <tr>
          <th scope="col" id="customer">
            <ask-sort-header column="customer" [(sort)]="sort"
              >Customer</ask-sort-header
            >
          </th>
          <th scope="col" id="total">
            <ask-sort-header column="total" [(sort)]="sort"
              >Total</ask-sort-header
            >
          </th>
          <th scope="col" id="status">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ada</td>
          <td>$120</td>
          <td>Paid</td>
        </tr>
      </tbody>
    </table>
  `,
})
class Host {
  readonly sort = signal<Sort | null>(null);
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (selector: string): HTMLElement =>
    fixture.nativeElement.querySelector(selector);
  const click = async (selector: string) => {
    el(selector).click();
    await fixture.whenStable();
  };
  return { fixture, el, click };
}

describe('Table', () => {
  it('styles a native table and lets a consumer class win', async () => {
    const { el } = await render();
    const table = el('table');

    expect(table.classList).toContain('w-full');
    expect(table.classList).toContain('text-xs');
    expect(table.classList).not.toContain('text-sm');
  });
});

describe('SortHeader', () => {
  it('puts a real button in the header cell', async () => {
    const { el } = await render();
    const button = el('#customer button') as HTMLButtonElement;

    expect(button.type).toBe('button');
    expect(button.textContent?.trim()).toBe('Customer');
    // Nothing is sorted yet, so no header claims to be.
    expect(el('#customer').hasAttribute('aria-sort')).toBe(false);
  });

  it('sorts ascending first, then flips', async () => {
    const { fixture, el, click } = await render();

    await click('#total button');
    expect(fixture.componentInstance.sort()).toEqual({
      column: 'total',
      direction: 'asc',
    });
    expect(el('#total').getAttribute('aria-sort')).toBe('ascending');

    await click('#total button');
    expect(fixture.componentInstance.sort()).toEqual({
      column: 'total',
      direction: 'desc',
    });
    expect(el('#total').getAttribute('aria-sort')).toBe('descending');
  });

  it('keeps aria-sort on the sorted column only', async () => {
    const { el, click } = await render();

    await click('#total button');
    await click('#customer button');

    expect(el('#customer').getAttribute('aria-sort')).toBe('ascending');
    expect(el('#total').hasAttribute('aria-sort')).toBe(false);
    expect(el('#status').hasAttribute('aria-sort')).toBe(false);
  });

  it('follows a sort set from outside', async () => {
    const { fixture, el } = await render();

    fixture.componentInstance.sort.set({
      column: 'customer',
      direction: 'desc',
    });
    await fixture.whenStable();

    expect(el('#customer').getAttribute('aria-sort')).toBe('descending');
  });
});
