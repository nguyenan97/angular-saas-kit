import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';

import { FormFieldFrame } from './form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormFieldFrame],
  template: `
    <ask-form-field label="Name">
      <input id="name" [formField]="form.name" />
    </ask-form-field>
    <ask-form-field label="Password" hint="At least 8 characters.">
      <input id="password" [formField]="form.password" />
      <a askFieldEnd href="/forgot">Forgot?</a>
    </ask-form-field>
    <ask-form-field label="Company" optional>
      <input [formField]="form.company" />
    </ask-form-field>
  `,
})
class Host {
  protected readonly model = signal({ name: '', password: '', company: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.name, { message: 'Enter your name.' });
    minLength(path.password, 8, { message: 'Use at least 8 characters.' });
  });
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();

  const el: HTMLElement = fixture.nativeElement;
  const control = (id: string) =>
    el.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
  const leave = async (id: string, value?: string) => {
    if (value !== undefined) {
      control(id).value = value;
      control(id).dispatchEvent(new Event('input'));
    }
    control(id).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };
  return { el, control, leave };
}

describe('FormFieldFrame', () => {
  it('labels its control', async () => {
    const { el } = await render();

    const [name, password, company] = [...el.querySelectorAll('label')];
    expect([name, password, company].map((label) => label?.htmlFor)).toEqual([
      'name',
      'password',
      expect.stringMatching(/^ask-field-\d+$/),
    ]);
    // A control without an id gets the one its label points at.
    expect(el.querySelector(`#${company?.htmlFor}`)?.tagName).toBe('INPUT');
    expect(company?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Company (optional)',
    );
  });

  it('keeps an invalid field quiet until it has been left', async () => {
    const { el, control } = await render();

    expect(control('name').hasAttribute('aria-invalid')).toBe(false);
    expect(control('name').hasAttribute('aria-describedby')).toBe(false);
    expect(el.querySelector('#name-error')).toBeNull();
  });

  it('once left, marks the field invalid and describes it by its error', async () => {
    const { el, control, leave } = await render();

    await leave('name');

    expect(control('name').getAttribute('aria-invalid')).toBe('true');
    expect(control('name').getAttribute('aria-describedby')).toBe('name-error');
    expect(el.querySelector('#name-error')?.textContent?.trim()).toBe(
      'Enter your name.',
    );
  });

  it('describes a field by its hint, and by its error after the hint', async () => {
    const { el, control, leave } = await render();

    expect(control('password').getAttribute('aria-describedby')).toBe(
      'password-hint',
    );
    expect(el.querySelector('#password-hint')?.textContent?.trim()).toBe(
      'At least 8 characters.',
    );

    await leave('password', 'short');

    expect(control('password').getAttribute('aria-describedby')).toBe(
      'password-hint password-error',
    );
    // Content marked askFieldEnd comes after the error.
    expect(
      el.querySelector('#password-error')?.nextElementSibling?.textContent,
    ).toBe('Forgot?');
  });

  it('takes the error back when the field is fixed', async () => {
    const { el, control, leave } = await render();

    await leave('name');
    await leave('name', 'Ada');

    expect(control('name').hasAttribute('aria-invalid')).toBe(false);
    expect(control('name').hasAttribute('aria-describedby')).toBe(false);
    expect(el.querySelector('#name-error')).toBeNull();
  });
});
