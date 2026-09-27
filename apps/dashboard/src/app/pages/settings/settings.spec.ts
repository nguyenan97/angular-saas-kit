import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Settings } from './settings';

describe('Settings', () => {
  it('splits settings into three tabs, Profile open first', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(Settings);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/profile').flush({
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      company: '',
      timeZone: 'UTC',
    });
    http
      .expectOne('/api/notifications')
      .flush({ orders: true, weeklySummary: false, productNews: false });
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const tabs = [...el.querySelectorAll<HTMLElement>('[role="tab"]')];

    expect(
      el.querySelector('[role="tablist"]')?.getAttribute('aria-label'),
    ).toBe('Settings');
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'Profile',
      'Notifications',
      'Appearance',
    ]);
    // The topbar holds the page's h1, so the panel starts at h2.
    expect(el.querySelector('[role="tabpanel"] h2')?.textContent?.trim()).toBe(
      'Profile',
    );

    tabs[2]?.click();
    await fixture.whenStable();

    expect(
      [...el.querySelectorAll('[role="tabpanel"] legend')].map((legend) =>
        legend.textContent?.trim(),
      ),
    ).toEqual(['Mode', 'Accent', 'Radius']);
    http.verify();
  });
});
