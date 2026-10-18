import { type RouterFeatures, withHashLocation } from '@angular/router';

/**
 * GitHub Pages build only - replaces `routing-mode.ts` through `fileReplacements`.
 * Hash-based URLs (`/suite/#/booking/orders`) survive a refresh on a static host.
 */
export const routerFeatures: readonly RouterFeatures[] = [withHashLocation()];
