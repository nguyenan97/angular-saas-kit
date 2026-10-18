import { type Page, expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

/**
 * The steps of the Booking feature files. They drive the suite as a person
 * would: by role and visible name, with the keyboard where the page offers it.
 * The data is the mock backend's seed, fresh on every page load.
 */
const { Given, When, Then } = createBdd();

/** Gherkin text, read literally inside a pattern. */
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// -- New order ---------------------------------------------------------------

Given('I am on the New order page', async ({ page }) => {
  await page.goto('/booking/orders/new');
  await expect(
    page.getByRole('heading', { level: 1, name: 'New order' }),
  ).toBeVisible();
  // The reference data has arrived once the slots are there.
  await expect(page.getByRole('radio').first()).toBeAttached();
});

When('I choose the customer {string}', async ({ page }, name: string) => {
  const box = page.getByRole('combobox', { name: 'Customer' });
  const option = page.getByRole('option', {
    name: new RegExp(`^${escape(name)}`),
  });
  // The customers load next to the slots; a person reads the list first.
  await box.fill(name.slice(0, 4));
  await expect(option).toBeVisible();
  await box.press('ArrowDown');
  await expect(box).toHaveAttribute(
    'aria-activedescendant',
    (await option.getAttribute('id')) ?? '',
  );
  await box.press('Enter');
  await expect(box).toHaveValue(name);
});

When(
  'I add {int} of {string}',
  async ({ page }, quantity: number, product: string) => {
    const option = page.locator('#order-product option', { hasText: product });
    await page
      .getByLabel('Product')
      .selectOption((await option.getAttribute('value')) ?? '');
    await page.getByLabel('Quantity', { exact: true }).fill(String(quantity));
    await page.getByRole('button', { name: 'Add line' }).click();
    await expect(
      page.getByRole('cell', { name: product, exact: true }),
    ).toBeVisible();
  },
);

When('I choose the first free delivery slot', async ({ page }) => {
  await page.getByRole('radio', { disabled: false }).first().check();
});

When('I place the order', async ({ page }) => {
  await page.getByRole('button', { name: 'Place order' }).click();
});

Then(
  'I see the order with the status {string}',
  async ({ page }, status: string) => {
    await expect(page).toHaveURL(/\/booking\/orders\/SO-\d{4}$/);
    await expect(
      page.getByRole('heading', { level: 2, name: /^SO-\d{4}$/ }),
    ).toBeVisible();
    // The badge next to the heading: the timeline also names steps to come.
    await expect(page.getByRole('main').locator('ask-badge')).toHaveText(
      status,
    );
  },
);

Then('its total is {string}', async ({ page }, total: string) => {
  await expect(page.getByRole('row', { name: /^Total/ })).toContainText(total);
});

Then('I am told {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible();
});

Then('I am still on the New order page', async ({ page }) => {
  await expect(page).toHaveURL(/\/booking\/orders\/new$/);
});

When('I try to choose a full delivery slot', async ({ page }) => {
  // A person clicks the label; a disabled radio ignores it. `force`, because
  // Playwright would otherwise wait for the radio to become enabled.
  const full = page.getByRole('radio', { name: /\(Full\)/ }).first();
  await page
    .locator(`label[for="${await full.getAttribute('id')}"]`)
    .click({ force: true });
});

Then('the full slot stays unchosen and says it is full', async ({ page }) => {
  const full = page.getByRole('radio', { name: /\(Full\)/ }).first();
  await expect(full).toBeDisabled();
  await expect(full).not.toBeChecked();
});

// -- Order detail ------------------------------------------------------------

/** Opens the first order of a status from the list. */
async function openFirst(page: Page, status: string): Promise<void> {
  await page.goto(`/booking/orders?status=${status}`);
  const link = page
    .getByRole('region', { name: 'Orders' })
    .getByRole('link')
    .first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(
    page.getByRole('heading', { level: 2, name: /^SO-\d{4}$/ }),
  ).toBeVisible();
}

Given('a placed order', async ({ page }) => {
  await openFirst(page, 'placed');
});

Given('a cancelled order', async ({ page }) => {
  await openFirst(page, 'cancelled');
});

When(
  'I cancel it with the reason {string}',
  async ({ page }, reason: string) => {
    await page.getByRole('button', { name: 'Cancel order' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Reason').fill(reason);
    await dialog.getByRole('button', { name: 'Cancel order' }).click();
    await expect(dialog).toBeHidden();
  },
);

Then(
  'its history ends with {string} and the reason {string}',
  async ({ page }, step: string, reason: string) => {
    const last = page
      .getByRole('list', { name: 'Order status' })
      .getByRole('listitem')
      .last();
    await expect(last).toContainText(`Current: ${step}`);
    await expect(last).toContainText(reason);
  },
);

Then('there is no Cancel order button', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(
    0,
  );
});

// -- Orders list -------------------------------------------------------------

Given('I am on the Orders page', async ({ page }) => {
  await page.goto('/booking/orders');
  await expect(
    page.getByRole('region', { name: 'Orders' }).getByRole('link').first(),
  ).toBeVisible();
});

When('I open the {string} tab', async ({ page }, tab: string) => {
  await page.getByRole('tab', { name: tab }).click();
});

Then('every order listed is {string}', async ({ page }, status: string) => {
  const rows = page.getByRole('region', { name: 'Orders' }).locator('tbody tr');
  await expect(rows.first()).toContainText(status);
  for (const row of await rows.all()) await expect(row).toContainText(status);
});

Then('the address says {string}', async ({ page }, part: string) => {
  await expect(page).toHaveURL((url) => url.href.includes(part));
});

When('I search for {string}', async ({ page }, text: string) => {
  await page.getByRole('searchbox', { name: 'Search' }).fill(text);
});

Then('the only order listed is {string}', async ({ page }, id: string) => {
  const rows = page.getByRole('region', { name: 'Orders' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByRole('link')).toHaveText(id);
});
