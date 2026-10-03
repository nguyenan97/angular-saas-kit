import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';

import { Input, Label } from './input';

const meta: Meta = {
  title: 'Components/Input',
  decorators: [moduleMetadata({ imports: [Input, Label] })],
};

export default meta;
type Story = StoryObj;

export const WithALabel: Story = {
  render: () => ({
    template: `
      <div class="flex w-72 flex-col gap-1.5">
        <label askLabel for="story-email">Email</label>
        <input askInput id="story-email" type="email" autocomplete="email" placeholder="name@example.com" />
      </div>
    `,
  }),
};

/** A hint and an error are text tied to the field, so a screen reader reads them with it. */
export const WithAHintAndAnError: Story = {
  render: () => ({
    template: `
      <div class="flex w-72 flex-col gap-1.5">
        <label askLabel for="story-password">Password</label>
        <input
          askInput
          id="story-password"
          type="password"
          autocomplete="new-password"
          value="short"
          aria-invalid="true"
          aria-describedby="story-password-hint story-password-error"
        />
        <p id="story-password-hint" class="text-sm text-muted-foreground">At least 8 characters.</p>
        <p id="story-password-error" class="text-sm text-destructive">Use at least 8 characters.</p>
      </div>
    `,
  }),
};

/** The same directive styles a textarea and a native select. */
export const TextareaAndSelect: Story = {
  render: () => ({
    template: `
      <div class="flex w-72 flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label askLabel for="story-bio">Bio</label>
          <textarea askInput id="story-bio" rows="3">Builds dashboards.</textarea>
        </div>
        <div class="flex flex-col gap-1.5">
          <label askLabel for="story-role">Role</label>
          <select askInput id="story-role">
            <option>Admin</option>
            <option>Editor</option>
            <option>Viewer</option>
          </select>
        </div>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div class="flex w-72 flex-col gap-1.5">
        <label askLabel for="story-plan">Plan</label>
        <input askInput id="story-plan" value="Open source" disabled />
      </div>
    `,
  }),
};
