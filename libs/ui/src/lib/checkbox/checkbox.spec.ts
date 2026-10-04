import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { Label } from '../input/input';
import { Checkbox } from './checkbox';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Checkbox, Label, ReactiveFormsModule],
  template: `
    <input askCheckbox id="terms" type="checkbox" [formControl]="terms" />
    <label askLabel for="terms">Accept the terms</label>
    <input askCheckbox id="wide" type="checkbox" class="size-6" />
    <input askCheckbox id="off" type="checkbox" disabled />
  `,
})
class Host {
  readonly terms = new FormControl(false);
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el = <T extends HTMLElement>(selector: string): T =>
    fixture.nativeElement.querySelector(selector);
  return { fixture, el };
}

describe('Checkbox', () => {
  it('colours the native box from the primary token', async () => {
    const { el } = await render();

    expect(el('#terms').classList).toContain('accent-primary');
    expect(el('#terms').classList).toContain('size-4');
  });

  it('lets a consumer class win', async () => {
    const { el } = await render();

    expect(el('#wide').classList).toContain('size-6');
    expect(el('#wide').classList).not.toContain('size-4');
  });

  it('stays a native checkbox that its label toggles', async () => {
    const { fixture, el } = await render();

    el<HTMLLabelElement>('label[for="terms"]').click();
    await fixture.whenStable();

    expect(el<HTMLInputElement>('#terms').checked).toBe(true);
    expect(fixture.componentInstance.terms.value).toBe(true);
  });

  it('does not toggle while disabled', async () => {
    const { el } = await render();
    const box = el<HTMLInputElement>('#off');

    box.click();

    expect(box.checked).toBe(false);
  });
});
