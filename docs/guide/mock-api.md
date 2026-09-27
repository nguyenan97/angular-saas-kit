# Mock API

`libs/mock-api` is an in-memory HTTP backend for development: an Angular HTTP interceptor
that answers requests from route handlers you register, after a realistic delay.

> [!NOTE]
> **Built and tested, not used yet.** No app registers routes or installs the interceptor
> today: the dashboard's overview page shows static numbers. This page is how to wire it
> when a page starts fetching. The reasoning is in
> [ADR 0006](../adr/0006-in-memory-mock-api-instead-of-a-backend.md).

## Register routes

A route is a method, a path pattern and a handler that returns the response body.

```ts
import { registerMockRoutes } from '@angular-saas-kit/mock-api';

interface Order {
  id: string;
  total: number;
}

const ORDERS: Order[] = [
  { id: '1', total: 10 },
  { id: '2', total: 25 },
];

registerMockRoutes(
  { method: 'GET', path: '/api/orders', handler: () => ORDERS },
  {
    method: 'GET',
    path: '/api/orders/:id',
    handler: ({ params }) => ORDERS.find((o) => o.id === params['id']),
  },
  {
    method: 'POST',
    path: '/api/orders',
    handler: ({ body }) => ({ ...(body as object), id: crypto.randomUUID() }),
  },
);
```

A handler receives a context with three fields:

| Field    | Type                     | What it holds                                            |
| -------- | ------------------------ | -------------------------------------------------------- |
| `params` | `Record<string, string>` | The values of the `:name` segments in the path, decoded. |
| `query`  | `URLSearchParams`        | The query string, for example `query.get('page')`.       |
| `body`   | `unknown`                | The request body.                                        |

## Install the interceptor

Add it to the app's providers, next to `provideHttpClient`:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { mockApiInterceptor } from '@angular-saas-kit/mock-api';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
};
```

Then call `HttpClient` as you would against a real API. Nothing in the component knows the
backend is fake.

## What it does

- **Matches** on the method and the whole path. `/api/orders/:id` does not match
  `/api/orders/42/items`: the segment counts must agree.
- **Delays** every answer by a random 200 to 600 ms (`MOCK_LATENCY_MIN_MS` and
  `MOCK_LATENCY_MAX_MS`), so skeletons and spinners get rendered instead of flashing past. An
  instant fake backend makes a demo lie about how the UI will feel.
- **Passes through** any request no route matches, so the interceptor is safe to add to an app
  that already talks to a real API.
- **Fails** a request when its handler throws. The thrown error is emitted as the request's
  error, after the same delay.

These behaviours are pinned by `mock-api.interceptor.spec.ts` and
`mock-api.http-client.spec.ts` in the library.

## Keep it out of production

The mock API is for local development and must never ship to a production build
([security policy](https://github.com/nguyenan97/angular-saas-kit/blob/main/SECURITY.md)).
The kit's way of making something build-specific is a file replacement, the same mechanism the
demo site uses to switch on hash routing: provide the interceptor from a small file that the
production configuration swaps for an empty one.
