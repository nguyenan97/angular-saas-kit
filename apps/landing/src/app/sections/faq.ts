import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '@angular-saas-kit/ui';
import { ChevronDown } from 'lucide';

/** A question on the FAQ, and its answer. */
export interface Question {
  readonly question: string;
  readonly answer: string;
}

/** Each answer is true of the code today. Keep it that way when you edit them. */
export const QUESTIONS: readonly Question[] = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. The kit is MIT licensed: use it in commercial and client work, change it and ship it. There is no paid tier and no locked component.',
  },
  {
    question: 'Which Angular version does it need?',
    answer:
      'Angular 22, with Node 22 or later and npm 11 or later. It runs without zone.js, keeps its state in signals and uses OnPush change detection everywhere.',
  },
  {
    question: 'Does it use Angular Material or PrimeNG?',
    answer:
      "No. Behaviour and accessibility come from the Angular CDK, and the styles are Tailwind v4 classes on the kit's semantic tokens. Nothing sits between you and the markup.",
  },
  {
    question: 'Is there a backend?',
    answer:
      "No. In development and in the demo, an in-memory mock API answers the dashboard's requests. The production build leaves the mock out, so the same requests go to your own API.",
  },
  {
    question: 'Is sign-in included?',
    answer:
      'The sign-in, sign-up and password reset pages are, as forms. Checking a password is not: each form has one method where you call your own authentication.',
  },
  {
    question: 'Can I install the components from npm?',
    answer:
      'Not yet. The components and the design tokens build as npm packages, but they are not published. For now, clone the repository and keep what you need.',
  },
  {
    question: 'How do I change the look?',
    answer:
      'Set the dark class, data-accent and data-radius on the html element. ThemeService sets them from signals and remembers the choice. A new accent is a block of CSS and one entry in ACCENTS.',
  },
];

/**
 * Questions and answers, each in a native `details` element: the browser
 * gives it the keyboard behaviour and announces it open or closed, and it
 * works before the page hydrates.
 */
@Component({
  selector: 'ask-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <section
      id="faq"
      aria-labelledby="faq-heading"
      class="scroll-mt-topbar border-t border-border"
    >
      <div class="mx-auto max-w-3xl px-6 py-20">
        <h2
          id="faq-heading"
          class="text-center text-3xl font-semibold tracking-tight text-balance"
        >
          Frequently asked questions
        </h2>

        <div class="mt-10 divide-y divide-border border-y border-border">
          @for (item of questions; track item.question) {
            <details class="group">
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 font-medium [&::-webkit-details-marker]:hidden"
              >
                {{ item.question }}
                <ask-icon
                  [icon]="chevron"
                  class="text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p class="pb-4 text-pretty text-muted-foreground">
                {{ item.answer }}
              </p>
            </details>
          }
        </div>
      </div>
    </section>
  `,
})
export class Faq {
  protected readonly questions = QUESTIONS;
  protected readonly chevron = ChevronDown;
}
