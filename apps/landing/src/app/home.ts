import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@angular-saas-kit/ui';

import { Faq } from './sections/faq';
import { Features } from './sections/features';
import { Pricing } from './sections/pricing';
import { SITE_LINKS } from './site-links';

/** The landing page itself: the hero, then the sections the header links to. */
@Component({
  selector: 'ask-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Faq, Features, Pricing],
  host: { class: 'block' },
  template: `
    <section class="mx-auto max-w-6xl px-6 py-24 text-center">
      <p
        class="mx-auto w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        Angular 22 · zoneless · Tailwind v4
      </p>

      <h1
        class="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance"
      >
        A free admin dashboard and landing page for Angular
      </h1>

      <p class="mx-auto mt-5 max-w-xl text-pretty text-muted-foreground">
        Signals-first components on a token-driven design system. No UI library
        to fight, no theme to reverse-engineer &mdash; swap an attribute and the
        whole kit reskins.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          askButton
          size="lg"
          href="https://github.com/nguyenan97/angular-saas-kit"
          >Get started</a
        >
        @if (links.demo) {
          <a askButton variant="outline" size="lg" [href]="links.demo"
            >Live demo</a
          >
        }
        @if (links.docs) {
          <a askButton variant="outline" size="lg" [href]="links.docs">Docs</a>
        }
        <a
          askButton
          variant="outline"
          size="lg"
          href="https://github.com/sponsors/nguyenan97"
          >Sponsor</a
        >
      </div>
    </section>

    <ask-features />
    <ask-pricing />
    <ask-faq />
  `,
})
export class Home {
  protected readonly links = SITE_LINKS;
}
