import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <button id="default" type="button" askButton (click)="clicks = clicks + 1">
      Save
    </button>
    <button id="outline" type="button" askButton variant="outline" size="sm">
      Cancel
    </button>
    <button id="override" type="button" askButton class="bg-secondary w-full">
      Wide
    </button>
    <button
      id="disabled"
      type="button"
      askButton
      disabled
      (click)="clicks = clicks + 1"
    >
      Off
    </button>
    <a id="link" href="/orders" askButton variant="link">All orders</a>
  `,
})
class Host {
  clicks = 0;
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = (id: string): HTMLElement =>
    fixture.nativeElement.querySelector(`#${id}`);
  return { fixture, el };
}

describe('Button', () => {
  it('styles the native element with the primary colour by default', async () => {
    const { el } = await render();

    expect(el('default').tagName).toBe('BUTTON');
    expect(el('default').classList).toContain('bg-primary');
    expect(el('default').classList).toContain('text-primary-foreground');
    expect(el('default').classList).toContain('h-9');
  });

  it('applies the variant and the size', async () => {
    const { el } = await render();

    expect(el('outline').classList).toContain('border-border');
    expect(el('outline').classList).toContain('h-8');
    expect(el('outline').classList).not.toContain('bg-primary');
  });

  it('lets a consumer class win over the defaults', async () => {
    const { el } = await render();

    expect(el('override').classList).toContain('bg-secondary');
    expect(el('override').classList).toContain('w-full');
    expect(el('override').classList).not.toContain('bg-primary');
  });

  it('keeps what the native element does', async () => {
    const { fixture, el } = await render();

    el('default').click();
    (el('disabled') as HTMLButtonElement).click();

    // A disabled button still refuses clicks: nothing here overrides it.
    expect(fixture.componentInstance.clicks).toBe(1);
    expect((el('disabled') as HTMLButtonElement).disabled).toBe(true);
    expect(el('link').getAttribute('href')).toBe('/orders');
  });

  it('drops the height and padding for a link', async () => {
    const { el } = await render();

    expect(el('link').classList).toContain('h-auto');
    expect(el('link').classList).toContain('px-0');
    expect(el('link').classList).not.toContain('h-9');
  });
});
