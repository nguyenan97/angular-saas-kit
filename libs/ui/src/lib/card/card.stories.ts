import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Button } from '../button/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta = {
  title: 'Components/Card',
  decorators: [
    moduleMetadata({
      imports: [
        Button,
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

/** The parts are directives on elements you choose, so the heading level stays yours. */
export const WithEveryPart: Story = {
  render: () => ({
    template: `
      <ask-card class="w-80">
        <div askCardHeader>
          <h2 askCardTitle>Revenue</h2>
          <p askCardDescription>The last thirty days.</p>
        </div>
        <div askCardContent>
          <p class="text-3xl font-semibold tracking-tight">$48,210</p>
        </div>
        <div askCardFooter>
          <button type="button" askButton variant="outline" size="sm">See the report</button>
        </div>
      </ask-card>
    `,
  }),
};

/** A consumer's classes are merged last, so they win over the defaults. */
export const WithOverrides: Story = {
  render: () => ({
    template: `
      <ask-card class="w-80 gap-2 p-6 shadow-none">
        <h2 class="font-semibold">Plain card</h2>
        <p class="text-sm text-muted-foreground">Padding on the card itself, and no shadow.</p>
      </ask-card>
    `,
  }),
};
