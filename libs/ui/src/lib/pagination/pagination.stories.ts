import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Pagination } from './pagination';

const meta: Meta = {
  title: 'Components/Pagination',
  decorators: [moduleMetadata({ imports: [Pagination] })],
  argTypes: {
    total: { control: { type: 'number', min: 0 } },
    pageSize: { control: { type: 'number', min: 1 } },
  },
  args: { page: 1, total: 95, pageSize: 10 },
  render: (args) => ({
    props: args,
    template: `
      <ask-pagination label="Orders pages" [(page)]="page" [total]="total" [pageSize]="pageSize" />
      <p class="mt-3 text-sm text-muted-foreground">Page {{ page }}</p>
    `,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const OnTheLastPage: Story = { args: { page: 10 } };

export const OnePageOnly: Story = { args: { total: 7 } };
