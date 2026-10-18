import type { Routes } from '@angular/router';

import { Shell } from './layout/shell';

// The shell is in the initial bundle; the pages, their HTTP client and the
// mock backend are lazy (pages/pages.routes.ts).
export const appRoutes: Routes = [
  {
    path: '',
    component: Shell,
    loadChildren: () =>
      import('./pages/pages.routes').then((m) => m.pageRoutes),
  },
];
