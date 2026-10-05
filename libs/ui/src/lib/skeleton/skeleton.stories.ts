import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Skeleton } from './skeleton';

const meta: Meta = {
  title: 'Components/Skeleton',
  decorators: [moduleMetadata({ imports: [Skeleton] })],
};

export default meta;
type Story = StoryObj;

export const Row: Story = {
  render: () => ({
    template: `
      <div class="flex items-center gap-3" aria-busy="true">
        <ask-skeleton class="size-10 rounded-full" />
        <div class="flex flex-col gap-2">
          <ask-skeleton class="h-4 w-40" />
          <ask-skeleton class="h-3 w-24" />
        </div>
      </div>
    `,
  }),
};
