import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Badge, type BadgeVariant } from './badge';

const VARIANTS: BadgeVariant[] = [
  'neutral',
  'primary',
  'success',
  'warning',
  'destructive',
  'info',
];

const meta: Meta = {
  title: 'Components/Badge',
  decorators: [moduleMetadata({ imports: [Badge] })],
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    text: { control: 'text' },
  },
  args: { variant: 'success', text: 'Paid' },
  render: (args) => ({
    props: args,
    template: `<ask-badge [variant]="variant">{{ text }}</ask-badge>`,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** The words carry the meaning; the colour repeats it for those who can see it. */
export const Variants: Story = {
  render: () => ({
    props: { variants: VARIANTS },
    template: `
      <div class="flex flex-wrap gap-2">
        @for (variant of variants; track variant) {
          <ask-badge [variant]="variant">{{ variant }}</ask-badge>
        }
      </div>
    `,
  }),
};
