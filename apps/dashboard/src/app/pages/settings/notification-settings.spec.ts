import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { NotificationSettingsForm } from './notification-settings';

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('NotificationSettingsForm', () => {
  it('shows the saved choices as native checkboxes, and saves a change', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(NotificationSettingsForm);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    http
      .expectOne('/api/notifications')
      .flush({ orders: true, weeklySummary: true, productNews: false });
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const box = (key: string) =>
      el.querySelector<HTMLInputElement>(`#notify-${key}`) as HTMLInputElement;

    expect([
      box('orders').checked,
      box('weeklySummary').checked,
      box('productNews').checked,
    ]).toEqual([true, true, false]);
    // Each checkbox is labelled and described.
    expect(
      el.querySelector('label[for="notify-orders"]')?.textContent?.trim(),
    ).toBe('Orders');
    expect(box('orders').getAttribute('aria-describedby')).toBe(
      'notify-orders-hint',
    );

    box('productNews').click();
    await fixture.whenStable();
    el.querySelector('form')?.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    const put = http.expectOne('/api/notifications');

    expect(put.request.body).toEqual({
      orders: true,
      weeklySummary: true,
      productNews: true,
    });
    put.flush(put.request.body);
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Notifications saved.',
    );
  });
});
