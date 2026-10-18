import type { RouterFeatures } from '@angular/router';

/**
 * Extra router features for this build.
 *
 * Empty, which gives ordinary path-based URLs. Kept in its own file so that a
 * build for a static host can swap it through `fileReplacements`, as the
 * dashboard's Pages build does.
 */
export const routerFeatures: readonly RouterFeatures[] = [];
