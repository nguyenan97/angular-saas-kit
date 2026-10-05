import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `<ask-skeleton id="s" class="h-4 w-32 rounded-full" />`,
})
class Host {}

describe('Skeleton', () => {
  it('is hidden from assistive technology and sized by the consumer', async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const s: HTMLElement = fixture.nativeElement.querySelector('#s');

    expect(s.getAttribute('aria-hidden')).toBe('true');
    expect(s.classList).toContain('h-4');
    expect(s.classList).toContain('rounded-full');
    expect(s.classList).not.toContain('rounded-md');
    expect(s.classList).toContain('motion-reduce:animate-none');
  });
});
