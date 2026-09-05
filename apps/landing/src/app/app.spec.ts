import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';

describe('Landing', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(appRoutes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture;
  }

  it('renders exactly one h1', async () => {
    // More than one h1 is the most common landing-page a11y regression.
    const fixture = await render();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
  });

  it('renders a primary call to action', async () => {
    const fixture = await render();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Get started');
  });
});
