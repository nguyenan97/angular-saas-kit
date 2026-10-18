import { resolve } from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4300';

const CI = !!process.env['CI'];

// Plain values rather than @nx/devkit or @nx/playwright/preset: importing
// either loads Nx's native module, which throws inside Playwright's config
// loader on Node 22 (see apps/dashboard-e2e/playwright.config.mts).
const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const output = (name: string): string =>
  resolve(workspaceRoot, 'dist', '.playwright', 'apps', 'suite-e2e', name);

/**
 * The suite's browser tests, Chromium only (CI runs every project here).
 *
 * - `bdd`: the user flows of the spec as Gherkin (`features/*.feature`), run
 *   by playwright-bdd with the steps in `steps/`. The scenario is written
 *   before the page; its name is the test's name.
 * - `accessibility`: axe on every suite page, light and dark (`src/`).
 *
 * playwright-bdd turns the feature files into test files under dist, so
 * nothing generated sits in the source tree.
 */
export default defineConfig({
  outputDir: output('test-output'),
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: [
    ...(CI ? [['list'] as const] : []),
    [
      'html',
      {
        outputFolder: output('playwright-report'),
        open: CI ? 'never' : 'on-failure',
      },
    ],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npx nx run suite:serve',
    url: baseURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'bdd',
      testDir: defineBddConfig({
        features: 'features/*.feature',
        steps: 'steps/*.ts',
        outputDir: output('features-gen'),
      }),
    },
    {
      name: 'accessibility',
      testDir: './src',
    },
  ],
});
