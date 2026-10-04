import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { Label } from '../input/input';
import { Switch } from './switch';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Switch, Label, ReactiveFormsModule],
  template: `
    <input askSwitch id="digest" type="checkbox" [formControl]="digest" />
    <label askLabel for="digest">Weekly digest</label>
    <input askSwitch id="wide" type="checkbox" class="w-12" />
  `,
})
class Host {
  readonly digest = new FormControl(false);
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

describe('Switch', () => {
  it('is announced as a switch, not a checkbox', async () => {
    const { el } = await render();

    expect(el('#digest').getAttribute('role')).toBe('switch');
  });

  it('draws the track and the thumb from tokens', async () => {
    const { el } = await render();
    const classes = el('#digest').classList;

    expect(classes).toContain('bg-input');
    expect(classes).toContain('checked:bg-primary');
    expect(classes).toContain('before:bg-background');
  });

  it('lets a consumer class win', async () => {
    const { el } = await render();

    expect(el('#wide').classList).toContain('w-12');
    expect(el('#wide').classList).not.toContain('w-9');
  });

  it('stays a native checkbox that its label toggles', async () => {
    const { fixture, el } = await render();

    el<HTMLLabelElement>('label[for="digest"]').click();
    await fixture.whenStable();

    expect(el<HTMLInputElement>('#digest').checked).toBe(true);
    expect(fixture.componentInstance.digest.value).toBe(true);
  });
});
