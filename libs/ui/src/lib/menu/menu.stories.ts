import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { Ellipsis } from 'lucide';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { MenuItem, MenuPanel, MenuSeparator, MenuTrigger } from './menu';

const meta: Meta = {
  title: 'Components/Menu',
  decorators: [
    moduleMetadata({
      imports: [Button, Icon, MenuItem, MenuPanel, MenuSeparator, MenuTrigger],
    }),
  ],
};

export default meta;
type Story = StoryObj;

/**
 * Enter, Space or the down arrow opens it, the arrow keys move through the
 * items, Escape closes it, and focus goes back to the button.
 */
export const RowActions: Story = {
  render: () => ({
    props: { ellipsis: Ellipsis, last: '' },
    template: `
      <button
        type="button"
        askButton
        variant="ghost"
        size="icon"
        aria-label="Order actions"
        [askMenuTrigger]="actions"
      >
        <ask-icon [icon]="ellipsis" />
      </button>

      <ng-template #actions>
        <div askMenu>
          <button type="button" askMenuItem (triggered)="last = 'View details'">View details</button>
          <button type="button" askMenuItem (triggered)="last = 'Duplicate'">Duplicate</button>
          <div askMenuSeparator></div>
          <button type="button" askMenuItem disabled>Refund</button>
        </div>
      </ng-template>

      <p class="mt-3 text-sm text-muted-foreground" role="status">{{ last }}</p>
    `,
  }),
};
