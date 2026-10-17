# Shared glossary

The words every bounded context uses, defined once in the shared kernel (`libs/shared/kernel`). A
context's own words are in its glossary, such as [Booking's](../booking/GLOSSARY.md).

**Money**
An amount in a currency, held in whole minor units: dong for VND, which has none smaller, and
cents for USD. Two amounts in different currencies cannot be added or compared.
_Avoid_: price (a price is one use of money), float amounts.

**Currency**
`VND` or `USD`.

**Quantity**
A count of something: a whole number greater than zero.

**Result**
The outcome of an operation that can be refused: either **ok** with a value, or **err** with the
reason. A refusal is a normal answer, not an exception.
_Avoid_: throwing for a business rule.

**Domain event**
A fact that something happened in a context, named in the past tense (`OrderPlaced`), with the
time it happened and what other contexts need to know.

**Event bus**
What delivers domain events to whoever subscribed. The demo's runs in memory; a real system would
use a message broker.
