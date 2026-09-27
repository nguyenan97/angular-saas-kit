import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Pagination } from './pagination';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Pagination],
  template: `
    <ask-pagination
      label="Orders pages"
      [total]="total()"
      [pageSize]="10"
      [(page)]="page"
    />
  `,
})
class Host {
  readonly page = signal(1);
  readonly total = signal(46);
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const button = (name: string) =>
    [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(name),
    ) as HTMLButtonElement;
  const click = async (name: string) => {
    button(name).click();
    await fixture.whenStable();
  };
  return { fixture, el, button, click };
}

describe('Pagination', () => {
  it('is a named navigation landmark that says where you are', async () => {
    const { el } = await render();

    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Orders pages',
    );
    expect(el.querySelector('p')?.textContent?.trim()).toBe('Page 1 of 5');
  });

  it('pages forward and back, two-way', async () => {
    const { fixture, el, click } = await render();

    await click('Next');
    await click('Next');
    expect(fixture.componentInstance.page()).toBe(3);

    await click('Previous');
    expect(fixture.componentInstance.page()).toBe(2);
    expect(el.querySelector('p')?.textContent?.trim()).toBe('Page 2 of 5');
  });

  it('keeps the buttons focusable at the ends, and does nothing there', async () => {
    const { fixture, button, click } = await render();

    // Page 1: Previous is unavailable but still a real, focusable button.
    expect(button('Previous').getAttribute('aria-disabled')).toBe('true');
    expect(button('Previous').disabled).toBe(false);
    await click('Previous');
    expect(fixture.componentInstance.page()).toBe(1);

    fixture.componentInstance.page.set(5);
    await fixture.whenStable();
    expect(button('Next').getAttribute('aria-disabled')).toBe('true');
    expect(button('Previous').hasAttribute('aria-disabled')).toBe(false);
    await click('Next');
    expect(fixture.componentInstance.page()).toBe(5);
  });

  it('names its buttons for a screen reader: "Next page"', async () => {
    const { button } = await render();

    expect(button('Next').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Next page',
    );
  });

  it('counts one page for an empty list', async () => {
    const { fixture, el } = await render();

    fixture.componentInstance.total.set(0);
    await fixture.whenStable();

    expect(el.querySelector('p')?.textContent?.trim()).toBe('Page 1 of 1');
  });
});
