# Booking glossary

The words of the Booking context: taking a customer's order and booking its delivery. Shared value
types (Money, Quantity, Result, domain event) are in the [shared glossary](../shared/GLOSSARY.md).
The format and the rules are in the `domain-modeling` skill.

**Sales order**
A customer's request for products, the aggregate root of this context. It is a **draft**, then
**placed**, then **confirmed**, or **cancelled** from any of those.
_Avoid_: purchase order (that is the buyer's document), cart.

**Draft**
An order still being put together: lines can be added, changed and removed. It has no delivery
slot.

**Placed**
An order the customer has committed to, with at least one line and a booked delivery slot.
Placing it raises **OrderPlaced**.

**Confirmed**
A placed order the distributor has accepted. Its lines and slot no longer change.

**Cancelled**
An order that will not be delivered, with a **cancel reason**. A cancelled order that had a slot
keeps it on record, for history, but no longer occupies it. Cancelling raises **OrderCancelled**.
_Avoid_: deleted, voided.

**Order line**
One product on an order: its quantity (at most 100,000), unit price, discount and VAT rate. One
line per product.
_Avoid_: item, row.

**Line net**
A line's quantity times its unit price, less its discount.

**VAT rate**
The value-added tax on a line: 0, 8 or 10 percent. VAT is rounded per line, then summed, so the
lines of an invoice add up to its total.

**Totals**
An order's **subtotal** (the sum of line nets), **VAT** and **total** (subtotal plus VAT), in the
order's currency.

**Delivery slot**
A date and a **delivery window** with a fixed **capacity**: how many orders can be delivered in
it. A slot is **bookable** while it has not started and is not full.
_Avoid_: time slot, appointment.

**Delivery window**
The part of the day a slot covers: `08-12` or `13-17`, local time.

**Book, release**
Booking a slot takes one place in it, when an order is placed. Releasing gives the place back,
when a placed or confirmed order is cancelled. The caller saves the slot with the order.

**OrderPlaced**
The event raised when an order is placed: the order, the customer, the slot, the total, and each
product's quantity. Other contexts (stock, logistics) will react to it.

**OrderCancelled**
The event raised when an order is cancelled: the order, the reason, and the slot to release if it
had one.

**Published event**
The versioned, flat form of a domain event that other contexts may depend on: `OrderPlacedV1`,
`OrderCancelledV1`, in `booking-contracts`. A breaking change is a new version, published next to
the old one.
_Avoid_: integration event, message (in this context's code and docs).

**Domain error**
Why an operation was refused, as a code (`slot-full`, `empty-order`, `invalid-transition`, …).
The interface maps each code to its own message.
