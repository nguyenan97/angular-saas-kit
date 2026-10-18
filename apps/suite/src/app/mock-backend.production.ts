import type { HttpInterceptorFn } from '@angular/common/http';

/**
 * Production: no mock backend. `/api` requests go to the network, to the
 * backend the app is deployed with. Replaces `mock-backend.ts` through
 * `fileReplacements` in project.json, so the mock and its data are not in
 * the bundle at all.
 */
export const backendInterceptors: readonly HttpInterceptorFn[] = [];
