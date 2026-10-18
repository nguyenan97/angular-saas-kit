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

describe('NotificationSettingsForm before the choices arrive', () => {
  function setup() {
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
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, http, el };
  }

  it('has nothing to save while the choices load', () => {
    const { http, el } = setup();
    // Not whenStable: the request is still open, so the app is never stable.

    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();
    http
      .expectOne('/api/notifications')
      .flush({ orders: false, weeklySummary: false, productNews: false });
  });

  it('says when the choices could not be loaded, offers to try again, and saves nothing', async () => {
    const { fixture, http, el } = setup();
    http
      .expectOne('/api/notifications')
      .flush('down', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Your notification choices could not be loaded.',
    );
    // No form whose unticked boxes could be saved over the real choices.
    expect(el.querySelector('form')).toBeNull();

    el.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    TestBed.tick();
    http
      .expectOne('/api/notifications')
      .flush({ orders: true, weeklySummary: false, productNews: false });
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelector<HTMLInputElement>('#notify-orders')?.checked).toBe(
      true,
    );
  });
  it('shows it is loading again on Try again, keeps the focus, and says a second failure again', async () => {
    const { fixture, http, el } = setup();
    // jsdom only moves focus to elements in the document.
    document.body.append(el);
    const fail = () =>
      http
        .expectOne('/api/notifications')
        .flush('down', { status: 500, statusText: 'Server Error' });
    fail();
    await fixture.whenStable();
    const first = el.querySelector('[role="alert"]');
    const retry = el.querySelector<HTMLButtonElement>('[role="alert"] button');
    retry?.focus();
    retry?.click();
    TestBed.tick();

    // The old alert gives way to the loading state, and focus stays in the choices.
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(el.contains(document.activeElement)).toBe(true);

    fail();
    await fixture.whenStable();
    const second = el.querySelector('[role="alert"]');

    // A new alert, so a screen reader announces the second failure too.
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    el.remove();
  });
});
