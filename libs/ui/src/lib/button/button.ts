import { Directive, computed, input } from '@angular/core';

import { cn } from '../utils/cn';

export type ButtonVariant =
  'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_ask-icon]:size-4';

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4',
  lg: 'h-10 px-6',
  icon: 'size-9',
};

// After the size, so the link variant can drop the height and padding.
const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline:
    'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
};

/**
 * Styles a native `<button>` or `<a>`.
 *
 * A directive, not a component, so the element stays the real one: a button
 * keeps its keyboard behaviour, its `type` and `disabled`, and a link keeps
 * its `href`. Nothing here re-implements them.
 */
@Directive({
  selector: 'button[askButton], a[askButton]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');

  /** Consumer classes are merged last, so they win over the defaults. */
  readonly class = input('');

  protected readonly classes = computed(() =>
    cn(BASE, SIZES[this.size()], VARIANTS[this.variant()], this.class()),
  );
}
