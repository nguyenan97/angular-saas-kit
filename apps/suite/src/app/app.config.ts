import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { appRoutes } from './app.routes';
import { providePageTitle } from './page-title';
import { routerFeatures } from './routing-mode';

// HttpClient and the mock backend are provided with the pages
// (app.routes.ts), so they stay out of the initial bundle.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, ...routerFeatures),
    providePageTitle(),
  ],
};
