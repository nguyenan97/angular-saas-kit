# Suite app: walking skeleton and the Booking context

Date: 2026-10-17. Status: draft, awaiting review.

## Goal

Show how the kit carries a multi-domain business application, built the DDD way, as a second
demo next to the SaaS dashboard. The scenario is **order-to-cash** at a distributor:

```text
Booking (sales order, delivery slot) → SCM (reserve stock, reorder)
  → Logistics (pick, ship, track) → ERP (invoice, receivables)
```

Each step is a bounded context. This spec covers only the first slice: the `suite` app shell,
the shared kernel, the event bus and the **Booking** context end to end, tested with TDD (domain)
and BDD (user flows). SCM, Logistics and ERP get a spec each, later, and plug in through domain
events.

It is a showcase: it runs on the in-memory mock API, has no real backend and no real auth.

## Projects

| Project                       | Tags                                             | Contents                                                                                  |
| ----------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `apps/suite`                  | `type:app`, `scope:suite`                        | Shell, module switcher, Overview page, mock backend wiring                                |
| `apps/suite-e2e`              | same tags as `dashboard-e2e`                     | Playwright with `playwright-bdd`; `.feature` files                                        |
| `libs/shared/kernel`          | `type:lib`, `layer:domain`, `scope:shared`       | `Money`, `Quantity`, `EntityId`, `Result`, `DomainEvent`, `InMemoryEventBus`              |
| `libs/booking/domain`         | `type:lib`, `layer:domain`, `scope:booking`      | `SalesOrder` aggregate, `OrderLine`, `DeliverySlot`, `OrderStatus`, events, `DomainError` |
| `libs/booking/contracts`      | `type:lib`, `layer:contracts`, `scope:booking`   | `OrderPlacedV1`, `OrderCancelledV1`, order DTOs, API paths                                |
| `libs/booking/data-access`    | `type:lib`, `layer:data-access`, `scope:booking` | `OrdersRepository` (HttpClient), `OrdersStore` (signals), Booking mock routes and seed    |
| `libs/booking/feature-orders` | `type:lib`, `layer:feature`, `scope:booking`     | Orders list, New order, Order detail pages and their routes                               |

`libs/shared/kernel` and `libs/booking/domain` import nothing from Angular or RxJS.

### Boundary rules

Every new library keeps `type:lib` and gets a third tag, `layer:`, constrained in `@nx/enforce-module-boundaries`; the existing `type:` and `scope:` rules stay as they are.

- `layer:domain` may depend on `layer:domain` only.
- `layer:contracts` may depend on `layer:domain` only (kernel value types).
- `layer:data-access` may depend on `layer:domain`, `layer:contracts`, and `mock-api` (a shared library without a layer).
- `layer:feature` may depend on `layer:data-access`, `layer:domain`, `layer:contracts`, and shared libraries without a layer (`ui`, `tokens`).
- `scope:booking` may depend on `scope:booking` and `scope:shared`. Another business scope
  (`scope:scm`, `scope:logistics`, `scope:erp`, when they exist) may depend on `scope:booking` only
  through `layer:contracts`.
- `scope:suite` may depend on every business scope.

`docs/architecture/c4-containers.md` gains the new projects and edges, so
`npm run check:architecture` passes. ADR 0021 records "bounded contexts as Nx libraries, four
layers each".

## Booking domain

### Model

- **`SalesOrder`** (aggregate root): `id` (`SO-0001` style), `customerId`, `lines`, `slot`,
  `status`, `cancelReason?`, `placedAt?`.
- **`OrderLine`**: `productId`, `name`, `quantity: Quantity`, `unitPrice: Money`,
  `discount: Money` (per line, not above the line total), `vatRate: 0 | 8 | 10`.
- **`DeliverySlot`**: `id`, `date`, `window` (`08-12`, `13-17`), `capacity`, `booked`.
- **`OrderStatus`**: `draft → placed → confirmed`, and `cancelled` from any of those three.
- **`Money`**: integer minor units plus currency (`VND`, `USD`); arithmetic refuses mixed
  currencies. No floating point anywhere in totals.

### Rules

Every rule below has at least one unit test, written before the code.

1. Lines can be added, changed or removed only while `draft`.
2. A line's quantity is a positive integer; every line's currency matches the order's.
3. `place(slot, now)`: needs at least one line (`empty-order`), a slot later than `now`
   (`slot-in-past`) with `booked < capacity` (`slot-full`). On success: `placed`, `placedAt = now`,
   emits `OrderPlaced`.
4. `confirm()`: only from `placed` (`invalid-transition`).
5. `cancel(reason)`: from `draft`, `placed` or `confirmed`; a non-empty reason (`reason-required`);
   emits `OrderCancelled`. Cancelling a placed or confirmed order frees its slot.
6. Totals: `subtotal = Σ quantity × unitPrice − discount`; `vat = Σ round(lineNet × rate / 100)`
   per line, rounded half up in minor units; `total = subtotal + vat`.

Domain operations return `Result<SalesOrder, DomainError>`; they do not throw. `DomainError`
carries a `code` from the list above and the UI maps each code to a message.

## Data flow

```text
feature-orders form ──preview──▶ booking/domain (totals, local validation)
      │ submit
      ▼
OrdersStore.place() ─▶ OrdersRepository  POST /api/booking/orders/:id/place
      ▼
suite mock backend ─▶ booking/domain place() ─▶ save, publish OrderPlaced on the event bus
      ▼
200 order DTO  │  409 { code }  ─▶ store updates its signals; the page shows the result
```

The mock backend calls the same `booking/domain` the UI uses, so business rules live in one
place. It is wired like the dashboard's: `mock-backend.ts` in development and the Pages build,
replaced by `mock-backend.production.ts` in production through `fileReplacements`.

### Event bus

`InMemoryEventBus` in the kernel: `publish(event)`, `subscribe(type, handler)`, synchronous,
in-memory. The mock backend owns one instance. In this slice it has one subscriber: an activity
log the Overview page reads through `GET /api/suite/activity`. SCM will subscribe to
`OrderPlaced` in its own spec.

### API (mock)

| Method | Path                                  | Result                                   |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/api/booking/orders`                 | Paged list; `status`, `q`, `page` params |
| GET    | `/api/booking/orders/:id`             | Order with totals                        |
| POST   | `/api/booking/orders`                 | Creates a draft from lines and customer  |
| POST   | `/api/booking/orders/:id/place`       | `{ slotId }` → placed, or 409            |
| POST   | `/api/booking/orders/:id/confirm`     | confirmed, or 409                        |
| POST   | `/api/booking/orders/:id/cancel`      | `{ reason }` → cancelled, or 409         |
| GET    | `/api/booking/customers`, `/products` | Reference data                           |
| GET    | `/api/booking/slots`                  | Slots for the next 14 days               |
| GET    | `/api/suite/activity`                 | Latest 20 domain events, newest first    |

The mock-api interceptor answers 200 today; it gains a way for a handler to return another status
with a body (409 here). That is a small, tested change to `libs/mock-api`.

### Seed

Deterministic from today's date, like the dashboard's `createDataset(today)`: 20 customers,
30 products (Booking holds the catalogue until SCM owns it), slots for 14 days with some full,
about 60 orders across every status.

### Errors

- Business errors (409 with `code`): an `ask-alert` above the form or action, with the mapped
  message.
- Network and 5xx errors: one banner with a Retry button.
- Field validation: inline, as the dashboard's auth forms do (`field-errors.ts`).

## UI

All pages are standalone, `OnPush`, signal-based and on semantic tokens.

- **Shell**: sidebar grouped by module; Booking is active, SCM, Logistics and ERP are listed,
  disabled, with a "Soon" badge. Header with the theme switcher. It follows the dashboard shell's
  pattern; shared pieces move to `libs/ui` only if both apps need them unchanged.
- **Overview**: four KPIs (orders today, awaiting confirmation, revenue this week, cancellation
  rate), orders per day (`ask-chart`), the activity feed.
- **Orders**: `ask-table` with status tabs, search by order id or customer, pagination; the query
  lives in the URL.
- **New order**: customer combobox, editable lines, slot picker (days × windows as native radio
  inputs; full or past slots disabled), live totals from the domain.
- **Order detail**: lines, totals, a status timeline, Confirm and Cancel; Cancel opens
  `ask-dialog` asking for the reason.

New `libs/ui` components the pages need: **Combobox** (on the CDK, with listbox semantics) and
**Timeline**. Each comes with a README, a spec and a story, and is added to
`docs/guide/components.md`.

## Testing

| Layer                             | Tool                                 | Approach                                     |
| --------------------------------- | ------------------------------------ | -------------------------------------------- |
| `shared/kernel`, `booking/domain` | Vitest, no TestBed                   | TDD: a failing test per rule first           |
| `booking/data-access`             | Vitest, `HttpTestingController`      | Store and repository, including 409 and 5xx  |
| `booking/feature-orders`          | Vitest, TestBed                      | Rendering, validation, store calls, a11y     |
| User flows                        | `playwright-bdd` in `apps/suite-e2e` | BDD: the scenario is written before the page |

Feature files for this slice:

- `place-order.feature`: place a valid order; refuse an empty order; refuse a full slot.
- `cancel-order.feature`: cancel with a reason; no Cancel button on a cancelled order.
- `orders-list.feature`: filter by status; find an order by its id.

`playwright-bdd` is a dev dependency (not a UI library). CI's `e2e` job runs `suite-e2e` next to
`dashboard-e2e`; `e2e` is a required check, so the workflow change lands in the same PR.

## Delivery

- A `pages` build configuration with base `/angular-saas-kit/suite/` and hash routing, added to
  `scripts/assemble-pages.mjs` and the preview script. The landing page links to it.
- Docs: a guide page `docs/guide/suite.md` (what the suite is, the contexts, how to add one), the
  C4 update, ADR 0021, README roadmap entry.
- Expected to land as several PRs: kernel and Booking domain; data-access and mock API status
  support; suite shell and pages with the new components; e2e, Pages and docs.

## Out of scope

Real auth (a fixed demo user), i18n (English, like the rest of the kit), the SCM, Logistics and
ERP contexts, persistence across reloads, and a real backend.
