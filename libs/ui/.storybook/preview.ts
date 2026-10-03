import type { Decorator, Preview } from '@storybook/angular';
import { ACCENTS, RADII } from '@angular-saas-kit/tokens';

/**
 * Applies the toolbar's theme the way ThemeService does: a class and two data
 * attributes on the html element. Every component follows, because none of
 * them names a colour.
 */
const withTheme: Decorator = (story, context) => {
  const root = document.documentElement;
  root.classList.toggle('dark', context.globals['mode'] === 'dark');
  root.dataset['accent'] = String(context.globals['accent']);
  root.dataset['radius'] = String(context.globals['radius']);
  return story();
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    mode: {
      description: 'Colour mode',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    accent: {
      description: 'Accent colour',
      toolbar: {
        title: 'Accent',
        icon: 'paintbrush',
        items: [...ACCENTS],
        dynamicTitle: true,
      },
    },
    radius: {
      description: 'Corner radius',
      toolbar: {
        title: 'Radius',
        icon: 'component',
        items: [...RADII],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { mode: 'light', accent: 'blue', radius: 'md' },
  parameters: {
    // The page behind a story is the app's background, in both modes.
    backgrounds: { disable: true },
    layout: 'centered',
  },
};

export default preview;
