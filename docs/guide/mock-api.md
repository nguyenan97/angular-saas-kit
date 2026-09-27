# Mock API

`libs/mock-api` is an in-memory HTTP backend for development: an Angular HTTP interceptor
that answers requests from route handlers you register, after a realistic delay.

> [!NOTE]
> **The dashboard runs on it** in development and in the demo on GitHub Pages; its production
> build leaves it out. [In the dashboard](#in-the-dashboard) shows how it is wired, and the
> sections before it are the general recipe. The reasoning is in
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

`query` holds the whole query string whether the caller wrote it into the URL
(`/api/orders?page=2`) or passed it as `HttpClient` `params` (`{ params: { page: 2 } }`). To
answer with an error status, throw an `HttpErrorResponse` from the handler.

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
production configuration swaps for an empty one. The dashboard does exactly that.

## In the dashboard

| File                                                                                    | What it does                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`mock/seed.ts`](../../apps/dashboard/src/app/mock/seed.ts)                             | The demo shop: customers, products and 90 days of orders, from a fixed seed and relative to today, on `example.com` addresses.                                                                                                                                                            |
| [`mock/routes.ts`](../../apps/dashboard/src/app/mock/routes.ts)                         | The API: `GET /api/stats`, `GET /api/orders` (and `/:id`), `PATCH /api/orders/:id` (a refund), `GET /api/customers`, `GET /api/products`, and `GET`/`PUT /api/profile` and `/api/notifications` for the Settings page. A `PUT` that fails validation answers 400 with the field at fault. |
| [`mock-backend.ts`](../../apps/dashboard/src/app/mock-backend.ts)                       | Registers those routes and exports the interceptor list.                                                                                                                                                                                                                                  |
| [`mock-backend.production.ts`](../../apps/dashboard/src/app/mock-backend.production.ts) | An empty interceptor list, swapped in by the `production` configuration: no mock, no data.                                                                                                                                                                                                |
| [`pages/pages.routes.ts`](../../apps/dashboard/src/app/pages/pages.routes.ts)           | `provideHttpClient(withInterceptors(backendInterceptors))`, on the lazy page routes, so none of it is in the initial bundle.                                                                                                                                                              |
| [`demo-data.ts`](../../apps/dashboard/src/app/demo-data.ts)                             | `DEMO_DATA`, which puts the "Demo data" label in the topbar; `false` in production.                                                                                                                                                                                                       |

The lists take `q` (search), `sort` and `dir`, and `page` and `pageSize` (at most 50); orders
also take `status`. A write changes the data for the rest of the session, as a real backend's
would, and a reload starts over.

Which build has it:

| Build                                 | Mock API | Why                                                  |
| ------------------------------------- | -------- | ---------------------------------------------------- |
| `npm start` (development)             | Yes      | Nothing else answers `/api`.                         |
| `npx nx build dashboard -c pages`     | Yes      | The demo is a static site with no backend.           |
| `npx nx build dashboard` (production) | No       | `/api` goes to the backend the app is deployed with. |

To point the dashboard at a real backend, keep the data shapes in
[`data/models.ts`](../../apps/dashboard/src/app/data/models.ts), serve them under `/api`, and
build for production.
