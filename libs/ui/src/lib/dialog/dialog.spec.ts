import {
  ChangeDetectionStrategy,
  Component,
  inject,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  DIALOG_DATA,
  DialogClose,
  DialogDescription,
  DialogFooter,
  type DialogOptions,
  DialogService,
  DialogTitle,
} from './dialog';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTitle, DialogDescription, DialogFooter, DialogClose],
  template: `
    <h2 askDialogTitle>Delete {{ data.name }}?</h2>
    <p askDialogDescription>This cannot be undone.</p>
    <div askDialogFooter>
      <button type="button" askDialogClose>Cancel</button>
      <button type="button" [askDialogClose]="true">Delete</button>
    </div>
  `,
})
class ConfirmDelete {
  protected readonly data = inject<{ name: string }>(DIALOG_DATA);
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTitle],
  template: `<h2 askDialogTitle>Saved</h2>`,
})
class TitleOnly {}

/** The CDK reads `keyCode`, which a synthetic event cannot set by itself. */
function press(target: EventTarget, key: string, keyCode: number): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
}

async function open<C>(component: new () => C, options: DialogOptions = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const ref = TestBed.inject(DialogService).open<boolean>(component, {
    data: { name: 'order #1042' },
    ...options,
  });
  let result: boolean | undefined | 'still open' = 'still open';
  ref.closed.subscribe((value) => (result = value));
  await settle();

  return { ref, result: () => result };
}

/** Change detection, then the after-render hooks that follow it. */
async function settle(): Promise<void> {
  TestBed.tick();
  await Promise.resolve();
  TestBed.tick();
}

const dialog = () =>
  document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');

const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  );

describe('DialogService', () => {
  it('opens a modal dialog named by its title', async () => {
    await open(ConfirmDelete);
    const element = dialog();
    const title = document.querySelector('h2');

    expect(element?.getAttribute('aria-modal')).toBe('true');
    expect(title?.textContent?.trim()).toBe('Delete order #1042?');
    expect(element?.getAttribute('aria-labelledby')).toBe(title?.id);
  });

  it('is described by its description, and only when it has one', async () => {
    await open(ConfirmDelete);

    expect(dialog()?.getAttribute('aria-describedby')).toBe(
      document.querySelector('p')?.id,
    );
  });

  it('points at no description when there is none', async () => {
    await open(TitleOnly);

    expect(dialog()?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('closes with the result of the button that closed it', async () => {
    const { result } = await open(ConfirmDelete);

    button('Delete')?.click();

    expect(result()).toBe(true);
  });

  it('closes with no result from a bare askDialogClose', async () => {
    const { result } = await open(ConfirmDelete);

    button('Cancel')?.click();

    expect(result()).toBeUndefined();
  });

  it('closes on Escape', async () => {
    const { result } = await open(ConfirmDelete);

    press(document.body, 'Escape', 27);
    await settle();

    expect(result()).toBeUndefined();
    expect(dialog()).toBeNull();
  });

  it('stays open on Escape and outside clicks when it is not dismissible', async () => {
    const { result } = await open(ConfirmDelete, { dismissible: false });

    press(document.body, 'Escape', 27);
    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
    await settle();

    expect(result()).toBe('still open');
    expect(dialog()).not.toBeNull();
  });

  it('dims the page with the tokens, and closes when the dimmed page is clicked', async () => {
    const { result } = await open(ConfirmDelete);
    const backdrop = document.querySelector<HTMLElement>(
      '.cdk-overlay-backdrop',
    );

    expect(backdrop?.classList).toContain('bg-background/80');
    backdrop?.click();

    expect(result()).toBeUndefined();
  });

  it('opens as an alert dialog for a confirmation', async () => {
    await open(ConfirmDelete, { role: 'alertdialog' });

    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
  });
});
