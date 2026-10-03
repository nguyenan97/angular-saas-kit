import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { Bell, CircleCheck, Settings } from 'lucide';

import { Icon } from './icon';

const meta: Meta = {
  title: 'Components/Icon',
  decorators: [moduleMetadata({ imports: [Icon] })],
};

export default meta;
type Story = StoryObj;

/** Beside text that says the same, an icon is decorative and hidden from assistive technology. */
export const Decorative: Story = {
  render: () => ({
    props: { check: CircleCheck },
    template: `
      <p class="flex items-center gap-2 text-sm">
        <ask-icon [icon]="check" class="text-success" />
        Payment received
      </p>
    `,
  }),
};

/** Standing alone, it needs a label, and is announced as an image with that name. */
export const Labelled: Story = {
  render: () => ({
    props: { bell: Bell },
    template: `<ask-icon [icon]="bell" label="Notifications" class="size-6" />`,
  }),
};

/** It draws in currentColor, and a consumer's size class wins. */
export const SizesAndColours: Story = {
  render: () => ({
    props: { settings: Settings },
    template: `
      <div class="flex items-center gap-4">
        <ask-icon [icon]="settings" class="size-4" />
        <ask-icon [icon]="settings" class="size-6 text-primary" />
        <ask-icon [icon]="settings" class="size-8 text-muted-foreground" [strokeWidth]="1.5" />
      </div>
    `,
  }),
};
