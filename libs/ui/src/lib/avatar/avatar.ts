import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

import { cn } from '../utils/cn';

/**
 * A person or account: their picture, or their initials when there is none
 * or it fails to load.
 *
 * The host is an image named by `name`, so the picture itself is
 * decorative. Put the name in text beside it where it is not obvious.
 */
@Component({
  selector: 'ask-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    role: 'img',
    '[attr.aria-label]': 'name()',
  },
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()"
        alt=""
        class="size-full object-cover"
        (error)="failed.set(true)"
      />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly src = input('');

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly failed = signal(false);

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });

  protected readonly classes = computed(() =>
    cn(
      'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground',
      this.class(),
    ),
  );
}
