import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Card } from '@angular-saas-kit/ui';

import { DEMO_DATA } from '../demo-data';
import { PageTitle } from '../page-title';

/**
 * The sign-in pages' layout: a card in the middle of the page, without the
 * dashboard's shell. The route's title is the page's one h1, as the
 * topbar's is in the shell.
 */
@Component({
  selector: 'ask-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, RouterLink, RouterOutlet],
  template: `
    <div
      class="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <!-- A header, so that everything on the page is in a landmark. -->
      <header class="mb-8">
        <a
          routerLink="/"
          class="flex items-center gap-2 rounded-md text-sm font-semibold"
        >
          <span class="size-6 rounded-md bg-primary" aria-hidden="true"></span>
          Angular SaaS Kit
        </a>
      </header>

      <main class="w-full max-w-sm">
        <ask-card class="p-6">
          <h1 class="text-xl font-semibold tracking-tight">{{ title() }}</h1>
          <router-outlet />
        </ask-card>

        @if (demoData) {
          <p class="mt-4 text-center text-xs text-muted-foreground">
            Demo: no account is checked and nothing is sent anywhere. Any email
            and password will do, so please do not type a real password here.
          </p>
        }
      </main>
    </div>
  `,
})
export class AuthLayout {
  protected readonly title = inject(PageTitle).title;
  protected readonly demoData = DEMO_DATA;
}
