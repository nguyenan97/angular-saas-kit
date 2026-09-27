import { type Page, expect, test } from '@playwright/test';

/** Whether focus is on the sidebar or something inside it. */
function focusIsInSidebar(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document
        .getElementById('app-sidebar')
        ?.contains(document.activeElement) ?? false,
  );
}

test.describe('shell on a desktop', () => {
  test('collapses the rail to its token width, and the content follows', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /collapse|expand/i });
    const left = (selector: string) =>
      page.locator(selector).evaluate((el) => el.getBoundingClientRect().left);

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await left('#main-content')).toBe(256);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // --sidebar-width-collapsed is 3.5rem. The offset uses the same token,
    // so the content starts exactly where the rail ends.
    await expect
      .poll(() =>
        page
          .locator('#app-sidebar')
          .evaluate((el) => el.getBoundingClientRect().width),
      )
      .toBe(56);
    await expect.poll(() => left('#main-content')).toBe(56);
  });

  test('shows the skip link on focus and skips to the content', async ({
    page,
  }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});

// The drawer is where jsdom stops being useful: it lays nothing out and
// implements no Tab order, so the focus trap is proved here.
test.describe('shell on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('gives the content the full width', async ({ page }) => {
    await page.goto('/');

    const box = await page.locator('#main-content').boundingBox();
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(375);
  });

  test('opens a drawer that holds focus until Escape', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu' });
    const drawer = page.locator('#app-sidebar');
    await expect(drawer).toBeHidden();

    await menu.click();
    await expect(drawer).toBeVisible();
    await expect.poll(() => focusIsInSidebar(page)).toBe(true);

    // More presses than the drawer has stops: focus wraps instead of leaving.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await focusIsInSidebar(page)).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await focusIsInSidebar(page)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('closes when the backdrop is tapped', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const drawer = page.locator('#app-sidebar');
    await expect(drawer).toBeVisible();

    // To the right of the 16rem drawer, on the backdrop.
    await page.mouse.click(340, 400);
    await expect(drawer).toBeHidden();
  });
});
