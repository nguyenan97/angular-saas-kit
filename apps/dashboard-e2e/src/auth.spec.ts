import { expect, test } from '@playwright/test';

test.describe('sign-in pages', () => {
  test('sign in from the keyboard alone, and land on the dashboard', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    // Their own layout: no sidebar, and the page title as the h1.
    await expect(page.locator('#app-sidebar')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');

    await page.getByLabel('Email').focus();
    await page.keyboard.type('alex.morgan@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('any password');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Overview',
    );
  });

  test('focus the first field to fix, and say why', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByRole('button', { name: 'Sign in' }).click();

    const email = page.getByLabel('Email');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter your email address.')).toBeVisible();
  });

  test('link to each other, and from the shell', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Create an account',
    );
    await page.getByRole('link', { name: 'Sign in' }).click();
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Reset your password',
    );
  });
});
