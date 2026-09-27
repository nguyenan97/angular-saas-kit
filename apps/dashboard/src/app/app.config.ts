import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePageTitle } from './page-title';
import { routerFeatures } from './routing-mode';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, ...routerFeatures),
    providePageTitle(),
  ],
};
