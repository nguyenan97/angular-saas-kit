# booking-contracts

What the Booking context publishes: the API's paths (`BOOKING_API`, `orderUrl`), the request and
response shapes (`OrderDto`, `OrderSummaryDto`, `CreateOrderRequest`, `BookingErrorBody`, …), and
the versioned published events `OrderPlacedV1` and `OrderCancelledV1` with `toPublishedEvent`.

Another bounded context depends on Booking only through this library (ADR 0021). Plain
TypeScript, on `booking-domain` and `shared-kernel`; lint refuses Angular and RxJS imports.

Run `npx nx test booking-contracts` for the unit tests.
