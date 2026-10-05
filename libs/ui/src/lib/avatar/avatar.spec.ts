import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Avatar } from './avatar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar],
  template: `
    <ask-avatar id="a" [name]="name()" [src]="src()" />
    <ask-avatar id="b" name="Cher" class="size-12" />
  `,
})
class Host {
  readonly name = signal('Ada Lovelace');
  readonly src = signal('');
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

describe('Avatar', () => {
  it('is an image named by the person, showing their initials', async () => {
    const { fixture, el } = await render();
    expect(el('a').getAttribute('role')).toBe('img');
    expect(el('a').getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(el('a').textContent?.trim()).toBe('AL');
    expect(el('b').textContent?.trim()).toBe('C');

    fixture.componentInstance.name.set('  grace  brewster murray hopper ');
    await fixture.whenStable();
    expect(el('a').textContent?.trim()).toBe('GH');
  });

  it('shows the picture, and falls back to initials when it fails', async () => {
    const { fixture, el } = await render();
    fixture.componentInstance.src.set('/me.png');
    await fixture.whenStable();
    const img = el('a').querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');

    img?.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(el('a').querySelector('img')).toBeNull();
    expect(el('a').textContent?.trim()).toBe('AL');
  });

  it('lets a consumer class win over the size', async () => {
    const { el } = await render();
    expect(el('b').classList).toContain('size-12');
    expect(el('b').classList).not.toContain('size-9');
  });
});
