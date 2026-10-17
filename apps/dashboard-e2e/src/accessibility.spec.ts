import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Every page, in light and in dark, against WCAG 2.2 A and AA as axe-core
 * reads it in a real browser: contrast, names, roles, landmarks. Lint checks
 * the templates; this checks what they render, with the tokens applied.
 * A critical or serious violation fails (CONSTRAINTS.md).
 */
const PAGES = [
  '/',
  '/analytics',
  '/orders',
  '/customers',
  '/products',
  '/settings',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
];

for (const mode of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      // The stored theme the head snippet reads before the first paint.
      await page.addInitScript((value) => {
        localStorage.setItem('ask.theme.v1', value);
      }, JSON.stringify({ mode }));
    });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
        // Wait for the mock API to answer, so the check sees the data.
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

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
