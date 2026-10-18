# booking-feature-orders

The Booking context's order pages, as routes an app mounts: `ORDERS_ROUTES`.

- **Orders** (`''`): a tab per status, a search by order id or customer, pages of ten; the query
  lives in the URL.
- **New order** (`new`): a customer `ask-combobox`, editable lines, the delivery slot as native
  radios (full or started slots disabled and saying why), and live totals from `booking-domain`.
- **Order detail** (`:id`): lines, totals, an `ask-timeline` of the status history, Confirm, and
  Cancel with the reason asked in an `ask-dialog`.

Each page provides its own `OrdersStore`. A business refusal is shown in words (`ERROR_MESSAGE`,
one sentence per code); a network failure gets a banner with Retry. The app provides `HttpClient`.

Run `npx nx test booking-feature-orders` for the tests.
