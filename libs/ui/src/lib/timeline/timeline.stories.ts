import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Timeline, type TimelineItem } from './timeline';

const meta: Meta = {
  title: 'Components/Timeline',
  decorators: [moduleMetadata({ imports: [Timeline] })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

const PLACED: TimelineItem[] = [
  { label: 'Created', state: 'complete', time: '18 Oct, 09:00' },
  {
    label: 'Placed',
    state: 'current',
    time: '18 Oct, 09:30',
    description: 'Delivery 20 Oct, 08:00 to 12:00',
  },
  { label: 'Confirmed', state: 'upcoming' },
];

/** Each step's state is read out ("Current: Placed"); the marker only repeats it. */
export const InProgress: Story = {
  render: () => ({
    props: { items: PLACED },
    template: `<ask-timeline label="Order status" class="w-80" [items]="items" />`,
  }),
};

/** A step that ends the flow badly takes the destructive tone. */
export const Cancelled: Story = {
  render: () => ({
    props: {
      items: [
        { label: 'Created', state: 'complete', time: '18 Oct, 09:00' },
        { label: 'Placed', state: 'complete', time: '18 Oct, 09:30' },
        {
          label: 'Cancelled',
          state: 'current',
          tone: 'destructive',
          time: '18 Oct, 11:00',
          description: 'Wrong address',
        },
      ] satisfies TimelineItem[],
    },
    template: `<ask-timeline label="Order status" class="w-80" [items]="items" />`,
  }),
};
