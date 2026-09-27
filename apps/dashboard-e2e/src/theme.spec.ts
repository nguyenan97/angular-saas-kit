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

  // The switcher is made of native radio inputs, so the browser supplies the
  // keyboard behaviour of a radio group. jsdom implements none of it, so it is
  // proved here, in a real browser.
  test('moves between accents with the arrow keys', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('radio', { name: 'blue', exact: true }).focus();
    await page.keyboard.press('ArrowRight');

    const violet = page.getByRole('radio', { name: 'violet', exact: true });
    await expect(violet).toBeChecked();
    await expect(violet).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
  });

  test('has one tab stop for each group', async ({ page }) => {
    await page.goto('/');

    // From the checked mode, Tab leaves the group for the checked accent, and
    // then the checked radius, instead of walking every option in between.
    await page.getByRole('radio', { name: 'system', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('radio', { name: 'blue', exact: true }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('radio', { name: 'md', exact: true }),
    ).toBeFocused();
  });

  test('shows a focus ring on the option that has keyboard focus', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('radio', { name: 'system', exact: true }).focus();
    await page.keyboard.press('Tab');

    // The radio itself is transparent, so the ring is drawn on its label.
    const ring = page.locator('label:has(input:focus-visible)');
    await expect(ring).toHaveCount(1);
    await expect(ring).toHaveCSS('outline-style', 'solid');
    await expect(ring).toHaveCSS('outline-width', '2px');
  });
});
