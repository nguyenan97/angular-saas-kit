import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { Input, Label } from './input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Input, Label, ReactiveFormsModule],
  template: `
    <label askLabel for="email">Email</label>
    <input askInput id="email" type="email" [formControl]="email" />

    <label askLabel for="notes">Notes</label>
    <textarea askInput id="notes"></textarea>

    <label askLabel for="status">Status</label>
    <select askInput id="status" class="w-48">
      <option>Paid</option>
    </select>
  `,
})
class Host {
  readonly email = new FormControl('ada@example.com');
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

describe('Input', () => {
  it('outlines the field with the input token', async () => {
    const { el } = await render();

    expect(el('#email').classList).toContain('border-input');
    expect(el('#email').classList).toContain('h-9');
    // Errors are shown from aria-invalid, which the consumer sets.
    expect(el('#email').classList).toContain('aria-invalid:border-destructive');
  });

  it('sizes a textarea by its content, not to one line', async () => {
    const { el } = await render();

    expect(el('#notes').classList).toContain('min-h-20');
    expect(el('#notes').classList).not.toContain('h-9');
  });

  it('lets a consumer class win', async () => {
    const { el } = await render();

    expect(el('#status').classList).toContain('w-48');
    expect(el('#status').classList).not.toContain('w-full');
  });

  it('leaves the native field working with forms', async () => {
    const { fixture, el } = await render();
    const email = el<HTMLInputElement>('#email');
    expect(email.value).toBe('ada@example.com');

    email.value = 'grace@example.com';
    email.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.email.value).toBe('grace@example.com');
  });
});

describe('Label', () => {
  it('styles a native label that stays associated with its field', async () => {
    const { el } = await render();
    const label = el<HTMLLabelElement>('label[for="email"]');

    expect(label.classList).toContain('font-medium');
    expect(label.control).toBe(el('#email'));
  });
});
