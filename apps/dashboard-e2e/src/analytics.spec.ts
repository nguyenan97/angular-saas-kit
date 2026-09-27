import { expect, test } from '@playwright/test';

// Charts in a real browser: they measure their width, they draw, and their
// numbers are one keyboard press away.
test.describe('analytics', () => {
  test('draws the charts to the width they are given', async ({ page }) => {
    await page.goto('/analytics');

    const revenue = page.getByRole('figure', { name: 'Revenue per day' });
    await expect(revenue).toBeVisible();
    await expect(revenue.locator('circle')).toHaveCount(30);

    // The drawing fills its card instead of a fixed guess.
    const svgWidth = await revenue
      .locator('svg')
      .evaluate((svg) => svg.getBoundingClientRect().width);
    const cardWidth = await revenue.evaluate(
      (figure) => figure.getBoundingClientRect().width,
    );
    expect(Math.abs(svgWidth - cardWidth)).toBeLessThan(2);
  });

  test('opens a chart’s numbers as a table from the keyboard', async ({
    page,
  }) => {
    await page.goto('/analytics');
    const orders = page.getByRole('figure', { name: 'Orders per day' });
    const toggle = orders.getByText('Show the data');

    await toggle.focus();
    await page.keyboard.press('Enter');

    const table = orders.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(31);
  });

  test('changes the period with the arrow keys, one tab stop for the group', async ({
    page,
  }) => {
    await page.goto('/analytics');
    const thirty = page.getByRole('radio', { name: 'Last 30 days' });
    await expect(thirty).toBeChecked();

    await thirty.focus();
    await page.keyboard.press('ArrowRight');

    await expect(
      page.getByRole('radio', { name: 'Last 90 days' }),
    ).toBeChecked();
    await expect(
      page.getByRole('figure', { name: 'Revenue per day' }).locator('circle'),
    ).toHaveCount(90);
  });
});
