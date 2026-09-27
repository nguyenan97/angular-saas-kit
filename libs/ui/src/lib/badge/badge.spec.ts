import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Badge, type BadgeVariant } from './badge';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  template: `
    <ask-badge id="plain">Draft</ask-badge>
    <ask-badge id="variant" [variant]="variant()">Paid</ask-badge>
    <ask-badge id="override" variant="success" class="bg-primary"
      >Pinned</ask-badge
    >
  `,
})
class Host {
  readonly variant = signal<BadgeVariant>('success');
}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const badge = (id: string): HTMLElement =>
    fixture.nativeElement.querySelector(`#${id}`);
  return { fixture, badge };
}

describe('Badge', () => {
  it('is neutral unless told otherwise', async () => {
    const { badge } = await render();

    expect(badge('plain').classList).toContain('bg-muted');
    expect(badge('plain').classList).toContain('text-muted-foreground');
  });

  it('pairs each status colour with its own foreground', async () => {
    const { fixture, badge } = await render();
    expect(badge('variant').classList).toContain('bg-success');
    expect(badge('variant').classList).toContain('text-success-foreground');

    fixture.componentInstance.variant.set('warning');
    await fixture.whenStable();

    expect(badge('variant').classList).toContain('bg-warning');
    expect(badge('variant').classList).toContain('text-warning-foreground');
    expect(badge('variant').classList).not.toContain('bg-success');
  });

  it('lets a consumer class win over the variant', async () => {
    const { badge } = await render();

    expect(badge('override').classList).toContain('bg-primary');
    expect(badge('override').classList).not.toContain('bg-success');
    // The text is the status; the colour only repeats it.
    expect(badge('override').textContent?.trim()).toBe('Pinned');
  });
});
