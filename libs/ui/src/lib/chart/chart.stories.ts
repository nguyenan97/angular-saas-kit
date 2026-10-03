import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Chart, type ChartPoint } from './chart';

/** A fortnight of revenue, fixed so that the story looks the same every time. */
const REVENUE: ChartPoint[] = [
  4120, 3980, 4410, 4630, 4290, 5120, 5480, 5210, 4870, 5340, 5760, 6020, 5890,
  6310,
].map((value, day) => ({ label: `Sep ${day + 14}`, value }));

const CATEGORIES: ChartPoint[] = [
  { label: 'Software', value: 18240 },
  { label: 'Hardware', value: 12410 },
  { label: 'Services', value: 9620 },
  { label: 'Training', value: 4180 },
];

const dollars = (value: number) => `$${value.toLocaleString('en-US')}`;

const meta: Meta = {
  title: 'Components/Chart',
  decorators: [moduleMetadata({ imports: [Chart] })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/** The data is also a table, one button away, for whoever cannot read the drawing. */
export const Line: Story = {
  render: () => ({
    props: { data: REVENUE, format: dollars },
    template: `
      <ask-chart
        type="line"
        label="Revenue, last 14 days"
        valueLabel="Revenue"
        [data]="data"
        [format]="format"
      />
    `,
  }),
};

export const Bar: Story = {
  render: () => ({
    props: { data: CATEGORIES, format: dollars },
    template: `
      <ask-chart
        type="bar"
        label="Revenue by category"
        categoryLabel="Category"
        valueLabel="Revenue"
        [data]="data"
        [format]="format"
        [color]="2"
      />
    `,
  }),
};
