import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { ThemeSwitcher } from './theme-switcher';

const meta: Meta = {
  title: 'Components/Theme switcher',
  decorators: [moduleMetadata({ imports: [ThemeSwitcher] })],
};

export default meta;
type Story = StoryObj;

/**
 * Native radio inputs in three fieldsets: each group is one Tab stop, and the
 * arrow keys move the selection. It changes the whole page, Storybook's
 * toolbar included, through ThemeService.
 */
export const Default: Story = {
  render: () => ({ template: `<ask-theme-switcher />` }),
};
