import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  input,
} from '@angular/core';

import { cn } from '../utils/cn';

/**
 * A raised surface that groups related content.
 *
 * The parts are directives on elements you choose, so the heading level and
 * the landmarks stay yours: `<h2 askCardTitle>` on one page, `<h3>` on the
 * next.
 */
@Component({
  selector: 'ask-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: '<ng-content />',
})
export class Card {
  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(
      'flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-xs',
      this.class(),
    ),
  );
}

@Directive({
  selector: '[askCardHeader]',
  host: { '[class]': 'classes()' },
})
export class CardHeader {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('flex flex-col gap-1.5 p-5', this.class()),
  );
}

@Directive({
  selector: '[askCardTitle]',
  host: { '[class]': 'classes()' },
})
export class CardTitle {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('text-sm leading-none font-semibold', this.class()),
  );
}

@Directive({
  selector: '[askCardDescription]',
  host: { '[class]': 'classes()' },
})
export class CardDescription {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('text-sm text-muted-foreground', this.class()),
  );
}

@Directive({
  selector: '[askCardContent]',
  host: { '[class]': 'classes()' },
})
export class CardContent {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('p-5 pt-0 first:pt-5', this.class()),
  );
}

@Directive({
  selector: '[askCardFooter]',
  host: { '[class]': 'classes()' },
})
export class CardFooter {
  readonly class = input('');
  protected readonly classes = computed(() =>
    cn('flex items-center gap-2 p-5 pt-0 first:pt-5', this.class()),
  );
}
