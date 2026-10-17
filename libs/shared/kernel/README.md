# shared-kernel

Value types and plumbing every bounded context shares: `Money`, `Quantity`, `Result`,
`DomainEvent` and an in-memory event bus. Plain TypeScript; lint refuses Angular and RxJS imports.

The kernel returns bare string codes (for example `'invalid-quantity'`) because it cannot know a
context's error type; contexts wrap them in their own `DomainError`.

Run `npx nx test shared-kernel` for the unit tests.
