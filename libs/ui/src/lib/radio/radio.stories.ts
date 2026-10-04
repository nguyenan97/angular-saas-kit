import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Label } from '../input/input';
import { Radio } from './radio';

const meta: Meta = {
  title: 'Components/Radio',
  decorators: [moduleMetadata({ imports: [Radio, Label] })],
};

export default meta;
type Story = StoryObj;

/** One `name`, one `fieldset`, one `legend`: arrow keys move the choice, Tab leaves the group. */
export const Group: Story = {
  render: () => ({
    template: `
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-2 text-sm font-medium text-foreground">Billing</legend>
        <div class="flex items-center gap-2">
          <input askRadio id="story-monthly" type="radio" name="story-billing" value="monthly" checked />
          <label askLabel for="story-monthly">Monthly</label>
        </div>
        <div class="flex items-center gap-2">
          <input askRadio id="story-yearly" type="radio" name="story-billing" value="yearly" />
          <label askLabel for="story-yearly">Yearly</label>
        </div>
      </fieldset>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <fieldset class="flex flex-col gap-2" disabled>
        <legend class="mb-2 text-sm font-medium text-foreground">Region</legend>
        <div class="flex items-center gap-2">
          <input askRadio id="story-eu" type="radio" name="story-region" value="eu" checked />
          <label askLabel for="story-eu">Europe</label>
        </div>
        <div class="flex items-center gap-2">
          <input askRadio id="story-us" type="radio" name="story-region" value="us" />
          <label askLabel for="story-us">United States</label>
        </div>
      </fieldset>
    `,
  }),
};
