# Testing

Two layers: unit tests next to the code, and browser tests for the flows that only a real
browser can prove.

## Unit tests

```bash
npm test                    # every project, with coverage
npx nx test dashboard       # one project
npx nx test ui --watch      # keep one running while you work
```

Tests are [Vitest](https://vitest.dev) running through the Angular build, so components
compile the way they do in the app. Test files sit next to the code they cover, as
`*.spec.ts`. Projects run once by default (`watch: false`). The reasoning, and the one project
that still uses an older executor, are in
[ADR 0008](../adr/0008-vitest-through-the-angular-test-builder.md).

### Coverage

Every project's `test` target collects coverage with the V8 provider and writes `lcov` and a
text summary, to `coverage/<project>` (`coverage/libs/mock-api` for the mock API). `coverage/`
is not committed. CI hands the reports to Codecov, which is not active yet: the upload is
rejected until a `CODECOV_TOKEN` secret exists (see
[Continuous integration](ci.md#codecov)).

### Testing a component

The apps are zoneless, so a component test provides zoneless change detection and awaits
stability instead of calling `detectChanges()`:

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  it('exposes the sidebar toggle to assistive tech', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(appRoutes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('[aria-controls]');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
  });
});
```

That test is `apps/dashboard/src/app/app.spec.ts`. Note what it asserts: an accessibility
contract, not that the component rendered. Test what a user or a consumer relies on:
keyboard operation, announced state, and the behaviour of inputs. A test that only proves the
component exists proves nothing.

## Browser tests

`apps/dashboard-e2e` uses [Playwright](https://playwright.dev) against the running dashboard.
The theme system is the kit's central claim, so it got the first coverage: the default accent
and radius, the dark-mode toggle, an accent that survives a reload with no flash, and the
sidebar collapse.

```bash
npx playwright install      # once, to download the browsers
npx nx e2e dashboard-e2e
```

Playwright starts `nx run dashboard:serve` on port 4200 and reuses a server that is already
running. Set `BASE_URL` to test a deployed build instead. The tests run on Chromium, Firefox
and WebKit.

> [!NOTE]
> Browser tests are not part of CI yet. Run them locally before changing anything the theme
> or the dashboard shell depends on.
