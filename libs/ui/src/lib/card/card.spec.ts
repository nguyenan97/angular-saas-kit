import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
  ],
  template: `
    <ask-card class="p-2">
      <header askCardHeader>
        <h3 askCardTitle class="text-base">Revenue</h3>
        <p askCardDescription>Last 30 days</p>
      </header>
      <div askCardContent>$48,120</div>
      <footer askCardFooter>Updated now</footer>
    </ask-card>
  `,
})
class Host {}

async function render() {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Card', () => {
  it('is a surface on the card tokens', async () => {
    const el = await render();
    const card = el.querySelector('ask-card');

    expect(card?.classList).toContain('bg-card');
    expect(card?.classList).toContain('text-card-foreground');
    expect(card?.classList).toContain('border-border');
  });

  it('keeps the elements the consumer chose, heading level included', async () => {
    const el = await render();

    // The page decides the outline; the card only styles it.
    expect(el.querySelector('h3')?.classList).toContain('font-semibold');
    expect(el.querySelector('header')?.classList).toContain('flex-col');
    expect(el.querySelector('p')?.classList).toContain('text-muted-foreground');
    expect(el.querySelector('footer')?.classList).toContain('items-center');
  });

  it('lets consumer classes win, on the card and on its parts', async () => {
    const el = await render();

    expect(el.querySelector('ask-card')?.classList).toContain('p-2');
    const title = el.querySelector('h3');
    expect(title?.classList).toContain('text-base');
    expect(title?.classList).not.toContain('text-sm');
  });
});
