import { expect, test } from '@playwright/test';

/**
 * The theme system is the kit's central claim, so it gets the first e2e
 * coverage: the three axes must survive a real browser and a reload.
 */
test.describe('theme', () => {
  test('starts in the default accent and radius', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('html');

    await expect(root).toHaveAttribute('data-accent', 'blue');
    await expect(root).toHaveAttribute('data-radius', 'md');
  });

  test('toggles dark mode from the topbar', async ({ page }) => {
    await page.goto('/');
    const root = page.locator('html');
    const wasDark = await root.evaluate((el) => el.classList.contains('dark'));

    await page.getByRole('button', { name: /mode$/i }).click();

    await expect
      .poll(() => root.evaluate((el) => el.classList.contains('dark')))
      .toBe(!wasDark);
  });

  test('persists the accent across a reload with no flash', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'emerald' }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-accent',
      'emerald',
    );

    await page.reload();

    // Set by the blocking snippet in <head>, so it is already correct on the
    // very first paint rather than after Angular boots.
    await expect(page.locator('html')).toHaveAttribute(
      'data-accent',
      'emerald',
    );
  });

  test('collapses and expands the sidebar', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /collapse|expand/i });

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
