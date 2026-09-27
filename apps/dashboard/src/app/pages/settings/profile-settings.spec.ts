import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { Profile } from '../../data/models';
import { ProfileSettings } from './profile-settings';

const PROFILE: Profile = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  company: 'Northwind Studio',
  timeZone: 'UTC',
};

async function render() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  const fixture = TestBed.createComponent(ProfileSettings);
  const http = TestBed.inject(HttpTestingController);
  TestBed.tick();
  http.expectOne('/api/profile').flush(PROFILE);
  await fixture.whenStable();
  // jsdom only moves focus to elements in the document.
  document.body.append(fixture.nativeElement);

  const el: HTMLElement = fixture.nativeElement;
  const field = (id: string) =>
    el.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
  const type = async (id: string, value: string) => {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const submit = async () => {
    el.querySelector('form')?.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await fixture.whenStable();
  };
  return { fixture, http, el, field, type, submit };
}

afterEach(() => TestBed.inject(HttpTestingController).verify());

describe('ProfileSettings', () => {
  it('fills the form from the API', async () => {
    const { field } = await render();

    expect(field('profile-name').value).toBe('Alex Morgan');
    expect(field('profile-email').value).toBe('alex.morgan@example.com');
    expect(field('profile-company').value).toBe('Northwind Studio');
  });

  it('shows what to fix in words, tied to the field, and focuses it', async () => {
    const { el, field, type, submit } = await render();

    await type('profile-name', '');
    await type('profile-email', 'alex@');
    await submit();

    const name = field('profile-name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(
      el
        .querySelector(`#${name.getAttribute('aria-describedby')}`)
        ?.textContent?.trim(),
    ).toBe('Enter your name.');
    expect(el.querySelector('#profile-email-error')?.textContent?.trim()).toBe(
      'Enter an email address like name@example.com.',
    );
    // The first field to fix has the focus; afterEach proves nothing was sent.
    expect(document.activeElement).toBe(name);
  });

  it('keeps errors out of the way until a field has been left', async () => {
    const { el, type } = await render();

    await type('profile-name', '');

    expect(el.querySelector('#profile-name-error')).toBeNull();
  });

  it('saves a valid profile and says so', async () => {
    const { fixture, http, el, type, submit } = await render();

    await type('profile-company', 'Tailwind Traders');
    await submit();
    const put = http.expectOne('/api/profile');

    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      ...PROFILE,
      company: 'Tailwind Traders',
    });
    put.flush({ ...PROFILE, company: 'Tailwind Traders' });
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Profile saved.',
    );
  });
});
