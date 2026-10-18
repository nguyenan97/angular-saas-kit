# mock-api

An `HttpInterceptor` that answers registered routes from memory, with a realistic delay
(`randomLatency`, 200 to 600 ms), so the apps run with no backend ([ADR 0006](../../docs/adr/0006-in-memory-mock-api-instead-of-a-backend.md)).
A request no route matches goes on to the network.

```ts
registerMockRoutes(
  {
    method: 'GET',
    path: '/api/orders/:id',
    handler: ({ params }) => find(params['id']),
  },
  {
    method: 'POST',
    path: '/api/orders',
    handler: ({ body }) => mockResponse(201, create(body)),
  },
);
```

A handler gets the path params, the query and the body, and returns the response body, sent with
status 200. To answer with another status, it returns `mockResponse(status, body)`: a 2xx reaches the
caller as a response, a 4xx or 5xx as an `HttpErrorResponse` whose `error` is the body, as a real
server's would. A handler may also throw an `HttpErrorResponse`.

Run `npx nx test mock-api` for the unit tests.
