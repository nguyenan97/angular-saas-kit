import { describe, expect, it } from 'vitest';

import { SITE_LINKS as standalone } from './site-links';
import { SITE_LINKS as pages } from './site-links.pages';

describe('site links', () => {
  it('has no links when the landing runs on its own', () => {
    // `nx serve landing` has no demo or docs next to it, so a link would be dead.
    expect(standalone.demo).toBeNull();
    expect(standalone.docs).toBeNull();
    expect(standalone.storybook).toBeNull();
  });

  it('links to the demo, the docs and Storybook relatively in the Pages build', () => {
    // Relative, so they resolve against <base href> and keep working on a
    // custom domain; an absolute /angular-saas-kit/demo/ would not.
    expect(pages.demo).toBe('demo/');
    expect(pages.docs).toBe('docs/');
    expect(pages.storybook).toBe('storybook/');
  });
});
