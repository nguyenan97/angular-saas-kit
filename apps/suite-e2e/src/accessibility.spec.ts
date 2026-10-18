import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Every suite page, light and dark, against WCAG 2.2 A and AA as axe-core
 * reads it in a real browser. A critical or serious violation fails
 * (CONSTRAINTS.md), as for the dashboard.
 */
const PAGES = [
  '/',
  '/booking/orders',
  '/booking/orders/new',
  '/booking/orders/SO-0001',
];

for (const mode of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        localStorage.setItem('ask.theme.v1', value);
      }, JSON.stringify({ mode }));
    });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).not.toBeEmpty();
        // Wait for the mock API, so the check sees the data.
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        await expect(
          page.getByRole('main').locator('h2').first(),
        ).toBeVisible();

        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const blocking = violations
          .filter((v) => v.impact === 'critical' || v.impact === 'serious')
          .map((v) => ({
            rule: v.id,
            impact: v.impact,
            help: v.help,
            targets: v.nodes.map((node) => node.target.join(' ')),
          }));

        expect(blocking).toEqual([]);
      });
    }
  });
}
