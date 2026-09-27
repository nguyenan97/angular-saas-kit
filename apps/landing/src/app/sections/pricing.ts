import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Icon,
} from '@angular-saas-kit/ui';
import { Check } from 'lucide';

/** A plan on the pricing section. */
export interface Plan {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  /** Beside the price, in smaller type: the period, or what the price rests on. */
  readonly priceNote: string;
  readonly features: readonly string[];
  readonly action: { readonly label: string; readonly href: string };
}

const REPOSITORY = 'https://github.com/nguyenan97/angular-saas-kit';

/**
 * The kit has one plan, and it is free. An app built on the kit lists its own
 * plans here; the section lays out one or several.
 */
export const PLANS: readonly Plan[] = [
  {
    name: 'Open source',
    description: 'The whole kit, for any project, commercial ones included.',
    price: '$0',
    priceNote: 'MIT license',
    features: [
      'The dashboard, its pages and the mock API',
      'This landing page, prerendered',
      'The components and the design tokens',
      'Light and dark, four accents, four radii',
      'Unit and browser tests, and the CI that runs them',
    ],
    action: { label: 'Get the code', href: REPOSITORY },
  },
];

/** What the kit costs, on a card for each plan. */
@Component({
  selector: 'ask-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Icon,
  ],
  host: { class: 'block' },
  template: `
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      class="scroll-mt-topbar border-t border-border"
    >
      <div class="mx-auto max-w-6xl px-6 py-20">
        <div class="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            class="text-3xl font-semibold tracking-tight text-balance"
          >
            Pricing
          </h2>
          <p class="mt-3 text-pretty text-muted-foreground">
            Free, all of it. There is no paid tier, and nothing is held back.
          </p>
        </div>

        <ul role="list" class="mt-10 flex flex-wrap justify-center gap-6">
          @for (plan of plans; track plan.name) {
            <li class="flex w-full max-w-sm">
              <ask-card class="w-full">
                <div askCardHeader>
                  <h3 askCardTitle class="text-base">{{ plan.name }}</h3>
                  <p askCardDescription>{{ plan.description }}</p>
                </div>
                <div askCardContent class="flex flex-col gap-6">
                  <p class="flex items-baseline gap-2">
                    <span class="text-4xl font-semibold tracking-tight">{{
                      plan.price
                    }}</span>
                    <span class="text-sm text-muted-foreground">{{
                      plan.priceNote
                    }}</span>
                  </p>
                  <ul role="list" class="flex flex-col gap-2 text-sm">
                    @for (feature of plan.features; track feature) {
                      <li class="flex gap-2">
                        <ask-icon [icon]="check" class="mt-0.5 text-primary" />
                        {{ feature }}
                      </li>
                    }
                  </ul>
                </div>
                <div askCardFooter class="mt-auto">
                  <a
                    askButton
                    size="lg"
                    class="w-full"
                    [href]="plan.action.href"
                    >{{ plan.action.label }}</a
                  >
                </div>
              </ask-card>
            </li>
          }
        </ul>

        <p class="mt-8 text-center text-sm text-muted-foreground">
          Missing something?
          <a
            [href]="repository + '/issues'"
            class="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
            >Open an issue</a
          >
          and say what you need.
        </p>
      </div>
    </section>
  `,
})
export class Pricing {
  protected readonly plans = PLANS;
  protected readonly repository = REPOSITORY;
  protected readonly check = Check;
}
