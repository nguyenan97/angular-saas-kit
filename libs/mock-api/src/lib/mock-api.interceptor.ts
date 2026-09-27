import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { randomLatency } from './latency';

/** A handler owns one route and returns the body for a matched request. */
export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Matched against the request path, e.g. /api/orders or /api/orders/:id */
  path: string;
  handler: (context: MockContext) => unknown;
}

export interface MockContext {
  /** Path params pulled from a `:name` segment in the route path. */
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}

/** Registry the apps push their route tables into. */
export const MOCK_ROUTES: MockRoute[] = [];

export function registerMockRoutes(...routes: MockRoute[]): void {
  MOCK_ROUTES.push(...routes);
}

/**
 * Serves the registered routes from memory with a realistic delay.
 *
 * Anything that does not match a route falls through to the real backend, so
 * dropping this interceptor into an app that already talks to an API is safe.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // `urlWithParams`, not `url`: HttpClient keeps `params` out of `url`, and a
  // handler must see the whole query however the caller passed it.
  const url = new URL(req.urlWithParams, 'http://localhost');
  const route = MOCK_ROUTES.find(
    (candidate) =>
      candidate.method === req.method &&
      matchPath(candidate.path, url.pathname) !== null,
  );

  if (!route) {
    return next(req);
  }

  const params = matchPath(route.path, url.pathname) ?? {};

  try {
    const body = route.handler({
      params,
      query: url.searchParams,
      body: req.body,
    });
    return of(new HttpResponse({ status: 200, body })).pipe(
      delay(randomLatency()),
    );
  } catch (error) {
    return throwError(() => error).pipe(delay(randomLatency()));
  }
};

/**
 * Returns the extracted params when `pattern` matches `pathname`, or null.
 * An empty object is a valid match, which is why the miss case is null and
 * not a falsy object.
 */
function matchPath(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    // Both are in range - the length check above guarantees it - but
    // noUncheckedIndexedAccess still widens the type, so narrow explicitly.
    const patternPart = patternParts[i] ?? '';
    const pathPart = pathParts[i] ?? '';

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}
