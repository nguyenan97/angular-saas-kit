import { expect, test } from '@playwright/test';

/**
 * The whole data path in a real browser: the page asks the API, the mock
 * backend answers after its delay, and the figures replace the placeholders.
 */
test.describe('overview', () => {
  test('shows the figures and the latest orders from the API', async ({
    page,
  }) => {
    await page.goto('/');

    const figures = page.getByRole('region', { name: 'Last 30 days' });
    await expect(figures.getByRole('heading', { level: 3 })).toHaveText([
      'Revenue',
      'Orders',
      'Active customers',
      'Refund rate',
    ]);
    // Revenue, in whole dollars, in the first card. The template may wrap it
    // in whitespace, and the chart below has dollar amounts of its own.
    await expect(figures.getByText(/^\s*\$[\d,]+\s*$/).first()).toBeVisible();
    await expect(
      figures.getByRole('figure', { name: 'Revenue per day' }),
    ).toBeVisible();

    const orders = page.getByRole('region', { name: 'Latest orders' });
    await expect(orders.getByRole('row')).toHaveCount(6);
    await expect(
      orders.getByRole('cell', { name: /^ORD-\d+$/ }).first(),
    ).toBeVisible();
    // A class on a cell beats the table's defaults, which is why the money
    // column can line up on the right, header included.
    await expect(orders.getByRole('columnheader', { name: 'Total' })).toHaveCSS(
      'text-align',
      'right',
    );
  });

  test('says the numbers are demo data', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner').getByText('Demo data')).toBeVisible();
  });
});
