import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Tab, Tabs } from './tabs';

const meta: Meta = {
  title: 'Components/Tabs',
  decorators: [moduleMetadata({ imports: [Tab, Tabs] })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/**
 * The tab list is one Tab stop; the arrow keys, Home and End move between
 * tabs, and a disabled tab is skipped.
 */
export const Settings: Story = {
  render: () => ({
    props: { selected: 0 },
    template: `
      <ask-tabs label="Settings" [(selectedIndex)]="selected" class="w-96">
        <ask-tab label="Profile">
          <p class="text-sm text-muted-foreground">Your name, email and avatar.</p>
        </ask-tab>
        <ask-tab label="Notifications">
          <p class="text-sm text-muted-foreground">What we email you about.</p>
        </ask-tab>
        <ask-tab label="Billing" disabled>
          <p class="text-sm text-muted-foreground">Invoices and payment methods.</p>
        </ask-tab>
      </ask-tabs>
    `,
  }),
};
