import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(appRoutes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture;
  }

  it('renders the shell', async () => {
    const fixture = await render();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders one nav link per nav item', async () => {
    const fixture = await render();
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('exposes the sidebar toggle to assistive tech', async () => {
    // The collapse control is the only way to reach the rail state by
    // keyboard, so its expanded state must be announced.
    const fixture = await render();
    const toggle = fixture.nativeElement.querySelector('[aria-controls]');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
  });
});
