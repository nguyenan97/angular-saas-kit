import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { Radio } from './radio';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Radio, ReactiveFormsModule],
  template: `
    <fieldset>
      <legend>Plan</legend>
      <input
        askRadio
        id="free"
        type="radio"
        name="plan"
        value="free"
        [formControl]="plan"
      />
      <input
        askRadio
        id="team"
        type="radio"
        name="plan"
        value="team"
        [formControl]="plan"
        class="size-6"
      />
    </fieldset>
  `,
})
class Host {
  readonly plan = new FormControl('free');
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

describe('Radio', () => {
  it('colours the native radio from the primary token', async () => {
    const { el } = await render();

    expect(el('#free').classList).toContain('accent-primary');
  });

  it('lets a consumer class win', async () => {
    const { el } = await render();

    expect(el('#team').classList).toContain('size-6');
    expect(el('#team').classList).not.toContain('size-4');
  });

  it('keeps the native group: one choice, bound to the form', async () => {
    const { fixture, el } = await render();
    expect(el<HTMLInputElement>('#free').checked).toBe(true);

    el<HTMLInputElement>('#team').click();
    await fixture.whenStable();

    expect(el<HTMLInputElement>('#free').checked).toBe(false);
    expect(fixture.componentInstance.plan.value).toBe('team');
  });
});
