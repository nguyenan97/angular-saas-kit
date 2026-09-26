import type { SiteLinks } from './site-links.types';

/**
 * GitHub Pages build only - replaces `site-links.ts` through `fileReplacements`.
 * Relative on purpose: it resolves against the `<base href>` the build sets, so
 * the same link works under `/angular-saas-kit/` and on a custom domain.
 */
export const SITE_LINKS: SiteLinks = { demo: 'demo/' };
