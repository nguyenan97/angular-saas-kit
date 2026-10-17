# booking-domain

The Booking bounded context's model: the `SalesOrder` aggregate, its lines, delivery slots, totals
and the `OrderPlaced` and `OrderCancelled` events. Plain TypeScript on `shared-kernel`; every rule
has a unit test.

Run `npx nx test booking-domain` for the unit tests.
