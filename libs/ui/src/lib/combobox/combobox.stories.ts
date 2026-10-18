import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Label } from '../input/input';
import { Combobox, type ComboboxOption } from './combobox';

const CUSTOMERS: ComboboxOption[] = [
  { value: 'C-01', label: 'Minh Chau Mart', description: 'Ha Noi' },
  { value: 'C-02', label: 'Hoa Binh Grocery', description: 'Ho Chi Minh City' },
  { value: 'C-03', label: 'Sen Vang Store', description: 'Da Nang' },
  { value: 'C-04', label: 'An Phu Foods', description: 'Hai Phong' },
  { value: 'C-05', label: 'Thanh Dat Retail', description: 'Can Tho' },
];

const meta: Meta = {
  title: 'Components/Combobox',
  decorators: [moduleMetadata({ imports: [Combobox, Label] })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

/**
 * Type to filter; Down and Up move through the matches, Enter chooses,
 * Escape closes and then clears. Focus stays in the box.
 */
export const Customer: Story = {
  render: () => ({
    props: { options: CUSTOMERS, value: null },
    template: `
      <div class="flex w-80 flex-col gap-2">
        <label askLabel for="story-customer">Customer</label>
        <ask-combobox
          inputId="story-customer"
          placeholder="Search customers"
          [options]="options"
          [(value)]="value"
        />
        <p class="text-sm text-muted-foreground">Chosen: {{ value ?? 'none' }}</p>
      </div>
    `,
  }),
};

/** `invalid` sets `aria-invalid`; point `describedBy` at the message. */
export const Invalid: Story = {
  render: () => ({
    props: { options: CUSTOMERS },
    template: `
      <div class="flex w-80 flex-col gap-2">
        <label askLabel for="story-customer-invalid">Customer</label>
        <ask-combobox
          inputId="story-customer-invalid"
          describedBy="story-customer-error"
          invalid
          [options]="options"
        />
        <p id="story-customer-error" class="text-sm text-destructive">Choose a customer.</p>
      </div>
    `,
  }),
};
