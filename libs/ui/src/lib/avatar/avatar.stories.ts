import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Avatar } from './avatar';

const meta: Meta = {
  title: 'Components/Avatar',
  decorators: [moduleMetadata({ imports: [Avatar] })],
};

export default meta;
type Story = StoryObj;

export const Initials: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-3">
        <ask-avatar name="Ada Lovelace" />
        <ask-avatar name="Grace Hopper" class="size-12 text-sm" />
        <ask-avatar name="Cher" />
      </div>
    `,
  }),
};

/** A picture that fails to load falls back to the initials. */
export const BrokenPicture: Story = {
  render: () => ({
    template: `<ask-avatar name="Alan Turing" src="/missing.png" />`,
  }),
};
