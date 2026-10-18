import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { Routes } from '@angular/router';

import { backendInterceptors } from '../mock-backend';

/**
 * The pages, loaded after the shell. `HttpClient` and the mock backend, where
 * the build has one, ship in this lazy chunk rather than in the initial
 * bundle. Each business context mounts its own routes under its path.
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
        path: 'booking/orders',
        loadChildren: () =>
          import('@angular-saas-kit/booking-feature-orders').then(
            (m) => m.ORDERS_ROUTES,
          ),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
