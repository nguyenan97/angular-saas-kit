import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { Download, Plus } from 'lucide';

import { Icon } from '../icon/icon';
import { Button, type ButtonSize, type ButtonVariant } from './button';

const VARIANTS: ButtonVariant[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const meta: Meta = {
  title: 'Components/Button',
  decorators: [moduleMetadata({ imports: [Button, Icon] })],
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: [...SIZES, 'icon'] },
    disabled: { control: 'boolean' },
    text: { control: 'text' },
  },
  args: {
    variant: 'default',
    size: 'md',
    disabled: false,
    text: 'Save changes',
  },
  render: (args) => ({
    props: args,
    template: `
      <button type="button" askButton [variant]="variant" [size]="size" [disabled]="disabled">
        {{ text }}
      </button>
    `,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => ({
    props: { variants: VARIANTS },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        @for (variant of variants; track variant) {
          <button type="button" askButton [variant]="variant">{{ variant }}</button>
        }
      </div>
    `,
  }),
};

/** An icon-only button needs a name: the icon is decorative, so aria-label gives it one. */
export const Sizes: Story = {
  render: () => ({
    props: { sizes: SIZES, plus: Plus },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        @for (size of sizes; track size) {
          <button type="button" askButton [size]="size">Size {{ size }}</button>
        }
        <button type="button" askButton size="icon" variant="outline" aria-label="Add a product">
          <ask-icon [icon]="plus" />
        </button>
      </div>
    `,
  }),
};

/** The directive styles a real link too: it keeps its href and its keyboard behaviour. */
export const AsALink: Story = {
  render: () => ({
    props: { download: Download },
    template: `
      <a askButton variant="outline" href="https://github.com/nguyenan97/angular-saas-kit">
        <ask-icon [icon]="download" />
        Get the code
      </a>
    `,
  }),
};

export const Disabled: Story = { args: { disabled: true } };
