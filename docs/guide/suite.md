# The suite

The kit's second demo: a multi-domain business application, built the DDD way. The scenario is
**order-to-cash** at a distributor, and each step is a bounded context:

```text
Booking (sales order, delivery slot) → SCM (reserve stock, reorder)
  → Logistics (pick, ship, track) → ERP (invoice, receivables)
```

**Booking is built**, end to end. SCM, Logistics and ERP are listed in the suite's navigation as
"Soon": each gets a spec of its own and will plug in through Booking's published events. The suite
runs on the in-memory mock API; there is no real backend and no real authentication.

```bash
npx nx serve suite        # http://localhost:4300
```

The live demo is at [/suite/](https://nguyenan97.github.io/angular-saas-kit/suite/) on the Pages
site, next to the dashboard demo.

## What is in it

- **Overview**: orders today, orders awaiting confirmation, revenue this week and the cancellation
  rate over 30 days; orders per day for 14 days; the activity feed of the latest domain events.
- **Orders**: a tab per status, a search by order id or customer, pages of ten. The query lives in
  the URL, so a filtered list can be shared and reloaded.
- **New order**: a customer combobox, editable lines with totals worked out by the domain as you
  type, and the delivery slot as days and windows (a full or started slot is disabled and says why).
- **Order detail**: lines, totals, the status history as a timeline, Confirm, and Cancel with a
  reason asked in a dialog.

## How a context is built

Each bounded context is a set of Nx libraries under `libs/<context>/`, one per layer, and lint
enforces which may import which ([ADR 0021](../adr/0021-bounded-contexts-as-nx-libraries.md)):

| Library                       | Layer         | Holds                                                                      |
| ----------------------------- | ------------- | -------------------------------------------------------------------------- |
| `libs/booking/domain`         | `domain`      | `SalesOrder`, lines, delivery slots, totals, events. Plain TypeScript      |
| `libs/booking/contracts`      | `contracts`   | API paths, DTOs, the published events `OrderPlacedV1`, `OrderCancelledV1`  |
| `libs/booking/data-access`    | `data-access` | `OrdersRepository`, `OrdersStore` on signals, and the mock routes and seed |
| `libs/booking/feature-orders` | `feature`     | The order pages, as `ORDERS_ROUTES`                                        |

The shared kernel (`libs/shared/kernel`) holds what every context uses: `Money`, `Quantity`,
`Result`, `DomainEvent` and the in-memory event bus. The words of the context are in
[its glossary](../../libs/booking/GLOSSARY.md).

### One set of rules

The New order page checks each line and works out the totals with `booking-domain`; the mock
backend places, confirms and cancels with the same functions. So a business rule lives in one
place, and the UI and the server cannot disagree about it. A refusal comes back as a 409 with the
domain's code (`slot-full`, `empty-order`, …), and each page says it in words.

### The event bus

The suite's mock backend owns one `InMemoryEventBus`. Placing or cancelling an order publishes
`OrderPlaced` or `OrderCancelled`; in this slice the one subscriber is the activity log the
Overview reads at `/api/suite/activity`. SCM will subscribe to `OrderPlaced` in its own spec, and
another context depends on Booking only through `booking-contracts`.

## Adding a context

1. Write its spec (`write-spec`), with the events it reacts to and the ones it publishes.
2. Model it (`domain-modeling`): `libs/<context>/domain` and a `GLOSSARY.md`.
3. Add `contracts`, `data-access` and a `feature-*` library, each tagged `type:lib`,
   `scope:<context>` and its `layer:`. Add the `scope:` rule in `eslint.config.mjs`, and add the
   scope to the `scope:suite` rule.
4. Register its mock routes in `apps/suite/src/app/mock-backend.ts`, subscribe to the events it
   needs on the suite's bus, and mount its routes in `apps/suite/src/app/pages/pages.routes.ts`.
   Give its module pages in the shell's `MODULES`.
5. Update the C4 map and the workspace table (`update-architecture`); `npm run check:architecture`
   holds them to the code.
6. Write its user flows as Gherkin in `apps/suite-e2e/features/`, before the pages.

## Tests

| Layer               | Tool                                  | Where                                      |
| ------------------- | ------------------------------------- | ------------------------------------------ |
| Domain and kernel   | Vitest, no TestBed                    | next to the code; coverage thresholds      |
| Data access         | Vitest, `HttpTestingController`       | `libs/booking/data-access`                 |
| Pages and the shell | Vitest, TestBed                       | next to each component                     |
| User flows (BDD)    | Playwright with `playwright-bdd`      | `apps/suite-e2e/features/*.feature`        |
| Accessibility       | axe, every suite page, light and dark | `apps/suite-e2e/src/accessibility.spec.ts` |

```bash
npx nx e2e suite-e2e      # starts the suite's dev server itself
```
