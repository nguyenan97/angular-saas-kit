import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Label } from '../input/input';
import { Switch } from './switch';

const meta: Meta = {
  title: 'Components/Switch',
  decorators: [moduleMetadata({ imports: [Switch, Label] })],
};

export default meta;
type Story = StoryObj;

export const Off: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <input askSwitch id="story-digest" type="checkbox" />
        <label askLabel for="story-digest">Weekly digest</label>
      </div>
    `,
  }),
};

export const On: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <input askSwitch id="story-alerts" type="checkbox" checked />
        <label askLabel for="story-alerts">Email alerts</label>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-2">
        <input askSwitch id="story-sso" type="checkbox" checked disabled />
        <label askLabel for="story-sso">Single sign-on</label>
      </div>
    `,
  }),
};
