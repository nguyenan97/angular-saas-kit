import type { Routes } from '@angular/router';

// The shell is in the initial bundle; everything under it is lazy
// (pages/pages.routes.ts), including the HTTP client and the mock backend.
export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/pages.routes').then((m) => m.pageRoutes),
  },
];
