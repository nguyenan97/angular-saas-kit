import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Label } from '../input/input';
import { Checkbox } from './checkbox';

const meta: Meta = {
  title: 'Components/Checkbox',
  decorators: [moduleMetadata({ imports: [Checkbox, Label] })],
};

export default meta;
type Story = StoryObj;

export const WithALabel: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <input askCheckbox id="story-terms" type="checkbox" />
        <label askLabel for="story-terms">Accept the terms</label>
      </div>
    `,
  }),
};

/** A group of checkboxes is a `fieldset` with a `legend`, so the question is read with each one. */
export const Group: Story = {
  render: () => ({
    template: `
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-2 text-sm font-medium text-foreground">Notify me about</legend>
        <div class="flex items-center gap-2">
          <input askCheckbox id="story-orders" type="checkbox" checked />
          <label askLabel for="story-orders">New orders</label>
        </div>
        <div class="flex items-center gap-2">
          <input askCheckbox id="story-reviews" type="checkbox" />
          <label askLabel for="story-reviews">Reviews</label>
        </div>
      </fieldset>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <input askCheckbox id="story-locked" type="checkbox" checked disabled />
        <label askLabel for="story-locked">Managed by your admin</label>
      </div>
    `,
  }),
};
