import type { RouterFeatures } from '@angular/router';

/**
 * Extra router features for this build.
 *
 * Empty by default, which gives ordinary path-based URLs. The GitHub Pages
 * build swaps this file for `routing-mode.pages.ts` (see the `pages`
 * configuration in project.json): Pages cannot rewrite an unknown path back to
 * index.html, so a refresh on a deep link would 404 without hash-based URLs.
 */
export const routerFeatures: readonly RouterFeatures[] = [];
