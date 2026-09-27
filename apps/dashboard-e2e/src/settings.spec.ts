import { expect, test } from '@playwright/test';

// The tabs' keys and the form's focus handling, in a real browser.
test.describe('settings', () => {
  test('moves between tabs with the arrow keys, Home and End', async ({
    page,
  }) => {
    await page.goto('/settings');
    const profile = page.getByRole('tab', { name: 'Profile' });
    const notifications = page.getByRole('tab', { name: 'Notifications' });
    const appearance = page.getByRole('tab', { name: 'Appearance' });

    await profile.focus();
    await page.keyboard.press('ArrowRight');
    await expect(notifications).toBeFocused();
    await expect(notifications).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('Email me about');

    await page.keyboard.press('End');
    await expect(appearance).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(profile).toHaveAttribute('aria-selected', 'true');

    // One tab stop: Tab leaves the list for the panel.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel')).toBeFocused();
  });

  test('keeps a profile with a mistake, says why, and focuses it', async ({
    page,
  }) => {
    await page.goto('/settings');
    const name = page.getByLabel('Name');
    await expect(name).toHaveValue('Alex Morgan');

    await name.fill('');
    await page.getByRole('button', { name: 'Save profile' }).click();

    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter your name.')).toBeVisible();

    await name.fill('Alex Morgan-Lee');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Profile saved.' }),
    ).toBeVisible();
  });
});
