import type { HttpInterceptorFn } from '@angular/common/http';
import {
  HttpErrorResponse,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { type Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

import { randomLatency } from './latency';

/**
 * A handler owns one route and returns the body for a matched request, sent
 * with status 200, or a `mockResponse` for any other status.
 */
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

/**
 * An answer with a status other than 200. Return one from a handler through
 * `mockResponse`: a 2xx status reaches the caller as a response, a 4xx or 5xx
 * as an `HttpErrorResponse` whose `error` is the body, as from a real server.
 */
export class MockResponse {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {}
}

/** Answers with `status` and `body`: `mockResponse(201, order)`, `mockResponse(409, { code })`. */
export function mockResponse(status: number, body: unknown): MockResponse {
  if (!Number.isInteger(status) || status < 200 || status > 599) {
    throw new RangeError(`A mock status is 200 to 599, got ${status}`);
  }
  return new MockResponse(status, body);
}

/** "Conflict" for 409, from Angular's own list of status names. */
function statusText(status: number): string {
  const name = HttpStatusCode[status] ?? 'Unknown';
  return name.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');
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
    return failAfterLatency(
      new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        url: req.url,
        error: { message: 'The path is not valid URL encoding.' },
      }),
    );
  }

  if (!match) {
    return next(req);
  }
  const { route, params } = match;

  try {
    const answer = route.handler({
      params,
      query: url.searchParams,
      body: req.body,
    });
    if (!(answer instanceof MockResponse)) {
      return of(new HttpResponse({ status: 200, body: answer })).pipe(
        delay(randomLatency()),
      );
    }
    const { status, body } = answer;
    if (status >= 400) {
      return failAfterLatency(
        new HttpErrorResponse({
          status,
          statusText: statusText(status),
          url: req.url,
          error: body,
        }),
      );
    }
    return of(
      new HttpResponse({ status, statusText: statusText(status), body }),
    ).pipe(delay(randomLatency()));
  } catch (error) {
    return failAfterLatency(error);
  }
};

/**
 * Fails with `error` after the same delay a success gets. `delay` holds back
 * values only, so an error piped through it would arrive at once.
 */
function failAfterLatency(error: unknown): Observable<never> {
  return timer(randomLatency()).pipe(mergeMap(() => throwError(() => error)));
}

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
 * Throws `URIError` when the path matches but a param segment is not valid
 * URL encoding.
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

  // Every static segment is compared before any param is decoded, so a path
  // that does not match is never an error, however its params are encoded.
  const raw: [name: string, value: string][] = [];

  for (let i = 0; i < patternParts.length; i++) {
    // Both are in range - the length check above guarantees it - but
    // noUncheckedIndexedAccess still widens the type, so narrow explicitly.
    const patternPart = patternParts[i] ?? '';
    const pathPart = pathParts[i] ?? '';

    if (patternPart.startsWith(':')) {
      raw.push([patternPart.slice(1), pathPart]);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  const params: Record<string, string> = {};
  for (const [name, value] of raw) {
    params[name] = decodeURIComponent(value);
  }
  return params;
}
