# booking-data-access

How the Booking context talks to its API, in Angular.

- `OrdersRepository`: the Booking API over `HttpClient`, one method per path in
  `booking-contracts`. Provide it in the same injector as `provideHttpClient(...)` (the suite does,
  on its pages route): provided in root it would take the root `HttpClient`, without the route's
  interceptors and so without the mock backend.
- `OrdersStore`: the order a page works on and the commands on it (`load`, `placeNew`, `confirm`,
  `cancel`) as signals: `order()`, `loading()`, `saving()`, `failure()`. Provide it with the page.
  Commands never throw; a failure is a `BookingFailure`, a business refusal with its domain code
  (a 4xx with a code) or a network failure (no answer, a 5xx).
- `@angular-saas-kit/booking-data-access/mock`: `createBookingDataset(now)` and
  `bookingMockRoutes(data, { now, publish })`, the Booking API answered from memory by
  `booking-domain`, for a mock backend to register with `mock-api`. A separate entry point, so only
  a file the production build replaces imports it.

Run `npx nx test booking-data-access` for the unit tests.
