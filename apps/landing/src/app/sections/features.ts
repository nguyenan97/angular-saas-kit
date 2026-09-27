import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card, Icon, type IconNode } from '@angular-saas-kit/ui';
import {
  Accessibility,
  Blocks,
  Layers,
  LayoutDashboard,
  Palette,
  Zap,
} from 'lucide';

/** One reason to choose the kit. */
export interface Feature {
  readonly icon: IconNode;
  readonly title: string;
  readonly description: string;
}

/** Each of these is true of the code today. Keep it that way when you edit them. */
export const FEATURES: readonly Feature[] = [
  {
    icon: Blocks,
    title: 'No UI library to fight',
    description:
      'Behaviour and accessibility come from the Angular CDK, the styles from Tailwind v4. The markup is in your repository, so you change it like the rest of your code.',
  },
  {
    icon: Zap,
    title: 'Zoneless, on signals',
    description:
      'No zone.js. State is signals, every component is OnPush, and the dashboard loads its data with httpResource.',
  },
  {
    icon: Palette,
    title: 'A theme in three attributes',
    description:
      "Light, dark or the system's choice, four accents and four corner radii. Change a class and two data attributes on the html element and every component follows, with no rebuild.",
  },
  {
    icon: Layers,
    title: 'One design system, two apps',
    description:
      'This page and the dashboard read the same semantic tokens and use the same components, so a new brand is made in one place.',
  },
  {
    icon: Accessibility,
    title: 'Accessible by default',
    description:
      'Template accessibility rules fail the lint, focus is visible by default, and a test holds the colour tokens to WCAG contrast in both modes and all four accents.',
  },
  {
    icon: LayoutDashboard,
    title: 'A dashboard to start from',
    description:
      'Overview, analytics, orders, customers, products, settings and sign-in pages, on an in-memory API that you swap for your own.',
  },
];

/** What the kit gives you, as a grid of cards. */
@Component({
  selector: 'ask-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Icon],
  host: { class: 'block' },
  template: `
    <section
      id="features"
      aria-labelledby="features-heading"
      class="scroll-mt-topbar border-t border-border"
    >
      <div class="mx-auto max-w-6xl px-6 py-20">
        <h2
          id="features-heading"
          class="text-3xl font-semibold tracking-tight text-balance"
        >
          Why this kit
        </h2>
        <p class="mt-3 max-w-2xl text-pretty text-muted-foreground">
          What you get, and what you do not have to work around.
        </p>

        <ul role="list" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (feature of features; track feature.title) {
            <li class="flex">
              <ask-card class="w-full gap-3 p-6">
                <span
                  class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"
                >
                  <ask-icon [icon]="feature.icon" class="size-5" />
                </span>
                <h3 class="font-semibold">{{ feature.title }}</h3>
                <p class="text-sm text-pretty text-muted-foreground">
                  {{ feature.description }}
                </p>
              </ask-card>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class Features {
  protected readonly features = FEATURES;
}
