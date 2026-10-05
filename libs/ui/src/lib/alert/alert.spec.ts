import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Alert, type AlertVariant } from './alert';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert],
  template: `
    <ask-alert id="plain">Saved</ask-alert>
    <ask-alert id="v" [variant]="variant()">Failed</ask-alert>
    <ask-alert id="override" class="p-8">Custom</ask-alert>
  `,
})
class Host {
  readonly variant = signal<AlertVariant>('destructive');
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

describe('Alert', () => {
  it('waits for a pause unless the news is bad', async () => {
    const { fixture, el } = await render();
    expect(el('plain').getAttribute('role')).toBe('status');
    expect(el('v').getAttribute('role')).toBe('alert');

    fixture.componentInstance.variant.set('info');
    await fixture.whenStable();
    expect(el('v').getAttribute('role')).toBe('status');

    fixture.componentInstance.variant.set('warning');
    await fixture.whenStable();
    expect(el('v').getAttribute('role')).toBe('alert');
  });

  it('draws the accent from the variant', async () => {
    const { el } = await render();
    expect(el('v').classList).toContain('border-l-destructive');
  });

  it('lets a consumer class win over the defaults', async () => {
    const { el } = await render();
    expect(el('override').classList).toContain('p-8');
    expect(el('override').classList).not.toContain('p-4');
  });
});
