import type { HttpInterceptorFn } from '@angular/common/http';
import {
  mockApiInterceptor,
  registerMockRoutes,
} from '@angular-saas-kit/mock-api';

import { mockRoutes } from './mock/routes';
import { createDataset } from './mock/seed';

/**
 * Where `/api` is answered in this build: from memory, by the mock backend.
 *
 * Used by development and by the demo on GitHub Pages, which is a static site
 * with no backend. The production build replaces this file with
 * `mock-backend.production.ts` (see `fileReplacements` in project.json), so
 * neither the mock nor its data ships there.
 */
const today = new Date();
registerMockRoutes(...mockRoutes(createDataset(today), today));

export const backendInterceptors: readonly HttpInterceptorFn[] = [
  mockApiInterceptor,
];
