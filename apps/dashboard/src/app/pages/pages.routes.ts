import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { Routes } from '@angular/router';

import { backendInterceptors } from '../mock-backend';

/**
 * The pages, loaded after the shell. They are the only part of the app that
 * talks to the API, so `HttpClient`, and the mock backend where the build has
 * one, are provided here and ship in this lazy chunk rather than in the
 * initial bundle.
 *
 * Every route has a `title`: `PageTitle` shows it in the topbar heading and
 * in the document title.
 */
export const pageRoutes: Routes = [
  {
    path: '',
    providers: [provideHttpClient(withInterceptors([...backendInterceptors]))],
    children: [
      {
        path: '',
        title: 'Overview',
        loadComponent: () => import('./overview').then((m) => m.Overview),
      },
      {
        path: 'settings',
        title: 'Settings',
        loadComponent: () => import('./settings').then((m) => m.Settings),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
