import type { Type } from '@angular/core';
import type { Route, Routes } from '@angular/router';

import { Shell } from './layout/shell';

/**
 * A sign-in page: its own path, on the centred card of `AuthLayout`, without
 * the shell. Each page names its path itself: an empty-path parent for all
 * three would also match `/` (with no child) and hide the dashboard.
 */
function authPage(
  path: string,
  title: string,
  load: () => Promise<Type<unknown>>,
): Route {
  return {
    path,
    loadComponent: () => import('./auth/auth-layout').then((m) => m.AuthLayout),
    children: [{ path: '', title, loadComponent: load }],
  };
}

// The shell is in the initial bundle. Its pages, their HTTP client and the
// mock backend are lazy (pages/pages.routes.ts), and so are the sign-in
// pages and their layout.
export const appRoutes: Routes = [
  authPage('sign-in', 'Sign in', () =>
    import('./auth/sign-in').then((m) => m.SignIn),
  ),
  authPage('sign-up', 'Create an account', () =>
    import('./auth/sign-up').then((m) => m.SignUp),
  ),
  authPage('forgot-password', 'Reset your password', () =>
    import('./auth/forgot-password').then((m) => m.ForgotPassword),
  ),
  {
    path: '',
    component: Shell,
    loadChildren: () =>
      import('./pages/pages.routes').then((m) => m.pageRoutes),
  },
];
