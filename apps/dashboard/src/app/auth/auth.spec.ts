import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from '../app';
import { appRoutes } from '../app.routes';
import { providePageTitle } from '../page-title';
import { ForgotPassword } from './forgot-password';
import { SignIn } from './sign-in';
import { PASSWORD_MIN_LENGTH, SignUp } from './sign-up';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class Dashboard {}

/** A form component on its own, with a router to go to '/' when it is done. */
async function render<T>(component: new () => T) {
  await TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: Dashboard },
        { path: 'sign-in', component: Dashboard },
      ]),
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
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
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };
  return { fixture, el, field, type, submit, router: TestBed.inject(Router) };
}

describe('the sign-in routes', () => {
  it('show the sign-in pages on a card, without the shell', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(appRoutes),
        providePageTitle(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/sign-in');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('#app-sidebar')).toBeNull();
    // The layout gives the page its one h1, from the route's title.
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Sign in');
    expect(el.querySelector('main form')).not.toBeNull();
  });
});

describe('SignIn', () => {
  it('says what is missing, in words tied to each field, and focuses the first', async () => {
    const { el, field, submit, router } = await render(SignIn);

    await submit();

    expect(field('sign-in-email').getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('#sign-in-email-error')?.textContent?.trim()).toBe(
      'Enter your email address.',
    );
    expect(
      el.querySelector('#sign-in-password-error')?.textContent?.trim(),
    ).toBe('Enter your password.');
    expect(document.activeElement).toBe(field('sign-in-email'));
    expect(router.url).toBe('/');
  });

  it('shows the password on request, and says so with aria-pressed', async () => {
    const { fixture, el, field } = await render(SignIn);
    const toggle = el.querySelector<HTMLButtonElement>('button[aria-pressed]');

    expect(field('sign-in-password').type).toBe('password');
    expect(toggle?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Show password',
    );
    toggle?.click();
    await fixture.whenStable();

    expect(field('sign-in-password').type).toBe('text');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
  });

  it('goes to the dashboard once the form is valid', async () => {
    const { type, submit, router } = await render(SignIn);
    await router.navigateByUrl('/sign-in');
    expect(router.url).toBe('/sign-in');

    await type('sign-in-email', 'alex.morgan@example.com');
    await type('sign-in-password', 'correct horse');
    await submit();

    expect(router.url).toBe('/');
  });
});

describe('SignUp', () => {
  it('says how long a password must be before the user types it', async () => {
    const { el, field } = await render(SignUp);

    const hint = el.querySelector(
      `#${field('sign-up-password').getAttribute('aria-describedby')}`,
    );
    expect(hint?.textContent?.trim()).toBe(
      `At least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  });

  it('refuses a short password, and keeps the hint alongside the error', async () => {
    const { el, field, type, submit } = await render(SignUp);

    await type('sign-up-name', 'Alex');
    await type('sign-up-email', 'alex@example.com');
    await type('sign-up-password', 'short');
    await submit();

    expect(field('sign-up-password').getAttribute('aria-describedby')).toBe(
      'sign-up-password-hint sign-up-password-error',
    );
    expect(
      el.querySelector('#sign-up-password-error')?.textContent?.trim(),
    ).toBe(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
    expect(document.activeElement).toBe(field('sign-up-password'));
  });
});

describe('ForgotPassword', () => {
  it('gives the same answer whether or not the address has an account', async () => {
    const { el, type, submit } = await render(ForgotPassword);

    await type('reset-email', 'someone@example.com');
    await submit();

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'If someone@example.com has an account, a link to reset its password is on its way.',
    );
  });
});
