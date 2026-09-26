import { describe, expect, it } from 'vitest';

import { SITE_LINKS as standalone } from './site-links';
import { SITE_LINKS as pages } from './site-links.pages';

describe('site links', () => {
  it('has no demo link when the landing runs on its own', () => {
    // `nx serve landing` has no demo next to it, so a link would be dead.
    expect(standalone.demo).toBeNull();
  });

  it('links to the demo relatively in the Pages build', () => {
    // Relative, so it resolves against <base href> and keeps working on a
    // custom domain; an absolute /angular-saas-kit/demo/ would not.
    expect(pages.demo).toBe('demo/');
  });
});
