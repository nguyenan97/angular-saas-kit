import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Alert, type AlertVariant } from './alert';

const VARIANTS: AlertVariant[] = [
  'neutral',
  'success',
  'warning',
  'destructive',
  'info',
];

const meta: Meta = {
  title: 'Components/Alert',
  decorators: [moduleMetadata({ imports: [Alert] })],
};

export default meta;
type Story = StoryObj;

/** The accent repeats what the words already say. */
export const Variants: Story = {
  render: () => ({
    props: { variants: VARIANTS },
    template: `
      <div class="flex flex-col gap-3">
        @for (variant of variants; track variant) {
          <ask-alert [variant]="variant">
            <strong>{{ variant }}.</strong> Your changes were handled.
          </ask-alert>
        }
      </div>
    `,
  }),
};
