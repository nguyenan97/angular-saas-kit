import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Settings } from './settings';

describe('Settings', () => {
  it('offers the three theme axes under an Appearance heading', async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    // The topbar holds the page's h1, so the page starts at h2.
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Appearance');
    expect(
      [...el.querySelectorAll('legend')].map((legend) =>
        legend.textContent?.trim(),
      ),
    ).toEqual(['Mode', 'Accent', 'Radius']);
  });
});
