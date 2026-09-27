import { type Page, expect, test } from '@playwright/test';

/** Whether focus is inside the open dialog. */
function focusInDialog(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document
        .querySelector('[role="dialog"], [role="alertdialog"]')
        ?.contains(document.activeElement) ?? false,
  );
}

// What jsdom cannot prove: the CDK menu's keys, the dialog's focus trap, and
// focus coming back to the row after the dialog closes.
test.describe('orders', () => {
  test('pages, and goes back to page 1 for a search', async ({ page }) => {
    await page.goto('/orders');
    // The summary is the page's first status region, read out on each change.
    const summary = page.getByRole('status').first();

    await expect(summary).toHaveText(/Showing 1 to 10 of \d+ orders/);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(summary).toHaveText(/Showing 11 to 20 of \d+ orders/);

    await page.getByLabel('Search').fill('ORD-1001');
    await expect(summary).toHaveText(/Showing 1 to 1 of 1 orders/);
    await expect(
      page.getByRole('cell', { name: 'ORD-1001', exact: true }),
    ).toBeVisible();
  });

  test('opens a row menu from the keyboard, and refunds after a confirmation', async ({
    page,
  }) => {
    await page.goto('/orders');
    const paidRow = page
      .getByRole('row')
      .filter({ has: page.getByText('Paid', { exact: true }) })
      .first();
    const actions = paidRow.getByRole('button', {
      name: /^Actions for ORD-\d+$/,
    });
    const id = ((await actions.getAttribute('aria-label')) ?? '').replace(
      'Actions for ',
      '',
    );

    await actions.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: 'View details' }),
    ).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Refund' })).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('alertdialog', { name: `Refund ${id}?` });
    await expect(dialog).toBeVisible();
    // The safe choice has the focus, and Tab cannot leave the dialog.
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInDialog(page)).toBe(true);
    }

    await dialog.getByRole('button', { name: /^Refund \$/ }).click();
    await expect(page.getByText(`${id} was refunded.`)).toBeVisible();
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: id })
        .getByText('Refunded', { exact: true }),
    ).toBeVisible();
    // Focus is back on the button the menu was opened from.
    await expect(
      page.getByRole('button', { name: `Actions for ${id}` }),
    ).toBeFocused();
  });

  test('closes the details on Escape and gives focus back to the row', async ({
    page,
  }) => {
    await page.goto('/orders');
    const actions = page
      .getByRole('button', { name: /^Actions for ORD-\d+$/ })
      .first();
    const id = ((await actions.getAttribute('aria-label')) ?? '').replace(
      'Actions for ',
      '',
    );

    await actions.click();
    await page.getByRole('menuitem', { name: 'View details' }).click();
    const dialog = page.getByRole('dialog', { name: id });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('table')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(actions).toBeFocused();
  });
});
