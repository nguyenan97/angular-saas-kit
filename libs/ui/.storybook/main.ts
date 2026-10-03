import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/lib/**/*.stories.ts'],
  // Runs axe on every story, in the Accessibility panel.
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/angular', options: {} },
};

export default config;
