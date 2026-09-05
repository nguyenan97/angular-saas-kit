import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly trend: 'up' | 'down';
}

/**
 * Placeholder overview page.
 *
 * Its job right now is to prove the semantic tokens hold up on a real
 * surface - card, border, muted text, status colours - across both modes and
 * all four accents. The charts and live data land in week 5.
 */
@Component({
  selector: 'ask-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (stat of stats; track stat.label) {
        <article class="rounded-lg border border-border bg-card p-5">
          <p class="text-xs font-medium text-muted-foreground">
            {{ stat.label }}
          </p>
          <p class="mt-2 text-2xl font-semibold tracking-tight">
            {{ stat.value }}
          </p>
          <p
            class="mt-1 text-xs font-medium"
            [class.text-success]="stat.trend === 'up'"
            [class.text-destructive]="stat.trend === 'down'"
          >
            {{ stat.delta }}
          </p>
        </article>
      }
    </div>
  `,
})
export class Overview {
  protected readonly stats: readonly Stat[] = [
    { label: 'Revenue', value: '$48,120', delta: '+12.4%', trend: 'up' },
    { label: 'Orders', value: '1,284', delta: '+3.1%', trend: 'up' },
    { label: 'Customers', value: '892', delta: '-1.8%', trend: 'down' },
    { label: 'Refund rate', value: '2.4%', delta: '-0.6%', trend: 'up' },
  ];
}
