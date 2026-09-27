import type { SiteLinks } from './site-links.types';

/**
 * Every entry is `null` because `nx serve landing` runs on its own, so a link
 * to the demo would be dead. The GitHub Pages build swaps this file for
 * `site-links.pages.ts` (see the `pages` configuration in project.json), where
 * the demo is served from a sibling path.
 */
export const SITE_LINKS: SiteLinks = { demo: null, docs: null };
