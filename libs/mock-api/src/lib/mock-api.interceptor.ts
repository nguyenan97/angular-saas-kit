import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
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

  let match: { route: MockRoute; params: Record<string, string> } | null;
  try {
    match = findRoute(req.method, url.pathname);
  } catch (error) {
    // A `%` sequence that is not valid UTF-8 cannot become a param. A real
    // backend answers that with 400, so the mock does too, rather than throw
    // out of the interceptor.
    if (!(error instanceof URIError)) {
      throw error;
    }
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          url: req.url,
          error: { message: 'The path is not valid URL encoding.' },
        }),
    ).pipe(delay(randomLatency()));
  }

  if (!match) {
    return next(req);
  }
  const { route, params } = match;

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

/** The first route for the method whose pattern matches, with its params. */
function findRoute(
  method: string,
  pathname: string,
): { route: MockRoute; params: Record<string, string> } | null {
  for (const route of MOCK_ROUTES) {
    if (route.method !== method) {
      continue;
    }
    const params = matchPath(route.path, pathname);
    if (params) {
      return { route, params };
    }
  }
  return null;
}

/**
 * Returns the extracted params when `pattern` matches `pathname`, or null.
 * Throws `URIError` when a param segment is not valid URL encoding.
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
