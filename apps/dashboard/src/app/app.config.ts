import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePageTitle } from './page-title';
import { routerFeatures } from './routing-mode';

// HttpClient is provided with the pages (pages/pages.routes.ts), not here, so
// it stays out of the initial bundle.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, ...routerFeatures),
    providePageTitle(),
  ],
};
