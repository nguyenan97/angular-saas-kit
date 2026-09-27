import type { Routes } from '@angular/router';

// Every route has a `title`: `PageTitle` shows it in the topbar heading and in
// the document title.
export const appRoutes: Routes = [
  {
    path: '',
    title: 'Overview',
    loadComponent: () => import('./pages/overview').then((m) => m.Overview),
  },
  { path: '**', redirectTo: '' },
];
