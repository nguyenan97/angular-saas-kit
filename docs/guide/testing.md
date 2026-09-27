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
is not committed and nothing uploads it; read the report locally when you need it.

### Testing a component

The apps are zoneless, so a component test provides zoneless change detection and awaits
stability instead of calling `detectChanges()`:

```ts
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { App } from './app';
import { appRoutes } from './app.routes';

describe('App shell', () => {
  it('points the menu button at the sidebar', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(appRoutes),
        // jsdom has no matchMedia: say which layout the test is about.
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: true, breakpoints: {} }) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('[aria-controls]');
    const sidebar = fixture.nativeElement.querySelector('#app-sidebar');
    expect(toggle?.getAttribute('aria-controls')).toBe(sidebar?.id);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
  });
});
```

That is a shortened test from `apps/dashboard/src/app/app.spec.ts`. Note what it asserts: an
accessibility contract, not that the component rendered. Test what a user or a consumer relies
on: keyboard operation, announced state, and the behaviour of inputs. A test that only proves
the component exists proves nothing.

## Browser tests

`apps/dashboard-e2e` uses [Playwright](https://playwright.dev) against the running dashboard.
The theme system is the kit's central claim, so it got the first coverage (`theme.spec.ts`): the
default accent and radius, the dark-mode toggle, an accent that survives a reload with no flash,
and the keyboard behaviour of the theme switcher: the arrow keys move the selection, each group
is a single tab stop, and the option that has focus shows a ring. The shell has its own file
(`shell.spec.ts`): the rail collapses to its token width, the skip link moves focus to the
content, and at phone width the content gets the whole screen while the drawer holds focus until
Escape and closes from its backdrop. These are here because jsdom lays nothing out and implements
no Tab order or radio-group keys, so a unit test cannot prove them.

```bash
npx playwright install      # once, to download the browsers
npx nx e2e dashboard-e2e    # Chromium, Firefox and WebKit

# or, from apps/dashboard-e2e, the one engine CI uses
npx playwright test --project=chromium
```

Playwright starts `nx run dashboard:serve` on port 4200 and reuses a server that is already
running. Set `BASE_URL` to test a deployed build instead.

> [!NOTE]
> The `e2e` job in CI runs them on Chromium for every pull request and push, in about a
> minute, and keeps the report and traces when one fails. It is **not a required check yet**:
> it is new, and a flaky required check blocks every merge, so it earns that after a run of
> clean results. Firefox and WebKit are configured for a local run, and CI does not run them.
> Run the browser tests yourself before changing anything the theme or the dashboard shell
> depends on.
