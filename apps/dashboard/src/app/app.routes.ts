import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/overview').then((m) => m.Overview),
  },
  { path: '**', redirectTo: '' },
];
