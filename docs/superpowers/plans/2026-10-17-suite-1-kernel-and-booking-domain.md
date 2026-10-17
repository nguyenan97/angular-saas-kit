# Suite, plan 1: shared kernel and Booking domain

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two framework-free TypeScript libraries, `shared-kernel` and `booking-domain`, holding the
value types, event bus and `SalesOrder` rules from the spec, each rule driven by a failing test first.

**Architecture:** Plain TypeScript, no Angular or RxJS imports (lint enforces it). Functions are pure
and immutable: an operation takes an order and returns a `Result` with the new order and any domain
events. Business failures are `Result` errors with a code; programming errors (mixed currencies in
arithmetic) throw. A new `layer:` tag and a `scope:booking` rule join the module-boundary constraints.

**Tech Stack:** TypeScript 5 (strict), Vitest through `@nx/vitest:test`, Nx 23 project tags, ESLint
flat config.

**Spec:** [`docs/superpowers/specs/2026-10-17-suite-booking-design.md`](../specs/2026-10-17-suite-booking-design.md)

**The suite is four plans.** This is plan 1. Plan 2: `booking-contracts`, `booking-data-access`,
non-200 statuses in `mock-api`. Plan 3: `apps/suite`, `booking-feature-orders`, Combobox and
Timeline in `libs/ui`. Plan 4: `suite-e2e` with `playwright-bdd`, the Pages build, docs. Each is
written when the one before has merged.

---

## File map

```text
libs/shared/kernel/
  project.json  tsconfig.json  tsconfig.lib.json  tsconfig.spec.json
  vite.config.mts  eslint.config.mjs  README.md
  src/index.ts
  src/lib/result.ts             Result<T, E>, ok(), err()
  src/lib/money.ts              Money, Currency, money(), add(), subtract(), multiply(), percentOf(), compare(), sum()
  src/lib/quantity.ts           Quantity (positive integer), quantity()
  src/lib/domain-event.ts       DomainEvent<TType, TPayload>, domainEvent()
  src/lib/event-bus.ts          InMemoryEventBus
  src/lib/*.spec.ts             one spec per file above
libs/booking/domain/
  (same config files)
  src/index.ts
  src/lib/errors.ts             DomainErrorCode, DomainError, domainError()
  src/lib/delivery-slot.ts      DeliverySlot, slotStart(), bookSlot(), releaseSlot()
  src/lib/order-line.ts         OrderLine, orderLine(), lineNet(), lineVat()
  src/lib/events.ts             OrderPlaced, OrderCancelled, BookingEvent
  src/lib/sales-order.ts        SalesOrder, createDraft(), addLine(), changeQuantity(), removeLine(), place(), confirm(), cancel()
  src/lib/totals.ts             orderTotals()
  src/lib/*.spec.ts
Modified:
  tsconfig.base.json            two path aliases
  eslint.config.mjs             layer:domain and scope:booking constraints
  docs/architecture/c4-containers.md   two containers, one edge, two table rows
  docs/adr/0021-bounded-contexts-as-nx-libraries.md (new) and docs/adr/README.md
```

Commands used throughout (from the repo root):

```bash
npx nx test shared-kernel
npx nx test booking-domain
npx nx lint shared-kernel
npx nx lint booking-domain
```

---

### Task 1: Scaffold `shared-kernel`

**Files:**

- Create: `libs/shared/kernel/project.json`, `tsconfig.json`, `tsconfig.lib.json`,
  `tsconfig.spec.json`, `vite.config.mts`, `eslint.config.mjs`, `README.md`, `src/index.ts`,
  `src/lib/smoke.spec.ts` (deleted in Task 2)
- Modify: `tsconfig.base.json` (paths), `docs/architecture/c4-containers.md`

- [ ] **Step 1: Create `libs/shared/kernel/project.json`**

```json
{
  "name": "shared-kernel",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/kernel/src",
  "projectType": "library",
  "tags": ["type:lib", "scope:shared", "layer:domain"],
  "targets": {
    "test": {
      "executor": "@nx/vitest:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "reportsDirectory": "coverage/libs/shared/kernel"
      }
    }
  }
}
```

- [ ] **Step 2: Create the TypeScript configs**

`libs/shared/kernel/tsconfig.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "isolatedModules": true,
    "target": "es2022",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "module": "preserve"
  },
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.spec.json" }
  ]
}
```

`libs/shared/kernel/tsconfig.lib.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "types": []
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "vite.config.mts"]
}
```

`libs/shared/kernel/tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../dist/out-tsc",
    "types": ["vitest/globals", "vitest/importMeta", "node", "vitest"]
  },
  "include": ["vite.config.mts", "src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

- [ ] **Step 3: Create `libs/shared/kernel/vite.config.mts`**

No Angular plugin and a Node environment: nothing here touches the DOM or Angular.

```ts
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/kernel',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'shared-kernel',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: '../../../coverage/libs/shared/kernel',
      provider: 'v8' as const,
      reporter: ['lcov', 'text-summary'],
    },
  },
}));
```

- [ ] **Step 4: Create `libs/shared/kernel/eslint.config.mjs`**

The domain layer stays framework-free; this rule is what makes that true rather than a convention.

```js
import baseConfig from '../../../eslint.config.mjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, {
  files: ['**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@angular/*', 'rxjs', 'rxjs/*'],
            message:
              'The domain layer is plain TypeScript: no Angular, no RxJS.',
          },
        ],
      },
    ],
  },
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- [ ] **Step 5: Create `README.md`, `src/index.ts` and a smoke test**

`libs/shared/kernel/README.md`:

```markdown
# shared-kernel

Value types and plumbing every bounded context shares: `Money`, `Quantity`, `Result`,
`DomainEvent` and an in-memory event bus. Plain TypeScript; lint refuses Angular and RxJS imports.

Run `npx nx test shared-kernel` for the unit tests.
```

`libs/shared/kernel/src/index.ts`:

```ts
export {};
```

`libs/shared/kernel/src/lib/smoke.spec.ts`:

```ts
describe('shared-kernel', () => {
  it('runs its tests', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 6: Add the path alias to `tsconfig.base.json`**

In `compilerOptions.paths`, after the `mock-api` line:

```json
      "@angular-saas-kit/mock-api": ["./libs/mock-api/src/index.ts"],
      "@angular-saas-kit/shared-kernel": ["./libs/shared/kernel/src/index.ts"]
```

- [ ] **Step 7: Add the container to the C4 map**

In `docs/architecture/c4-containers.md`, inside the `C4Container` block after the `mockapi` line:

```text
    Container(kernel, "shared-kernel", "TypeScript library", "Money, Quantity, Result, DomainEvent and an in-memory event bus shared by the bounded contexts. No Angular")
```

and in the containers table, after the `mock-api` row:

```markdown
| `shared-kernel` | library | `type:lib`, `scope:shared`, `layer:domain` | Not published. Plain TypeScript; lint refuses Angular and RxJS imports ([ADR 0021](../adr/0021-bounded-contexts-as-nx-libraries.md)). |
```

(Prettier realigns the table when the file is committed.)

- [ ] **Step 8: Run the test, lint and the architecture check**

```bash
npx nx test shared-kernel
npx nx lint shared-kernel
npm run check:architecture
```

Expected: 1 test passes; lint reports no errors; the check prints `The map matches the code`.
The ADR link is dead until Task 13; that is fine on a branch.

- [ ] **Step 9: Commit**

```bash
git add libs/shared/kernel tsconfig.base.json docs/architecture/c4-containers.md
git commit -m "feat(repo): scaffold the shared-kernel library"
```

---

### Task 2: `Result`

**Files:**

- Create: `libs/shared/kernel/src/lib/result.ts`, `libs/shared/kernel/src/lib/result.spec.ts`
- Modify: `libs/shared/kernel/src/index.ts`
- Delete: `libs/shared/kernel/src/lib/smoke.spec.ts`

- [ ] **Step 1: Write the failing test** `result.spec.ts`

```ts
import { err, ok, type Result } from './result';

describe('Result', () => {
  it('wraps a value', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('wraps an error', () => {
    const result = err('nope');
    expect(result).toEqual({ ok: false, error: 'nope' });
  });

  it('narrows on ok', () => {
    const result: Result<string, number> = ok('a');
    if (result.ok) {
      expect(result.value.toUpperCase()).toBe('A');
    } else {
      throw new Error('expected ok');
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test shared-kernel`
Expected: FAIL, `Failed to resolve import "./result"`.

- [ ] **Step 3: Implement `result.ts`**

```ts
/** The outcome of an operation that can fail for a business reason. */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): { readonly ok: true; readonly value: T } {
  return { ok: true, value };
}

export function err<E>(error: E): { readonly ok: false; readonly error: E } {
  return { ok: false, error };
}
```

- [ ] **Step 4: Export it and drop the smoke test**

`libs/shared/kernel/src/index.ts`:

```ts
export * from './lib/result';
```

```bash
git rm libs/shared/kernel/src/lib/smoke.spec.ts
```

- [ ] **Step 5: Run the tests**

Run: `npx nx test shared-kernel`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add libs/shared/kernel
git commit -m "feat(repo): add Result to the shared kernel"
```

---

### Task 3: `Money`

Integer minor units only. `VND` has no minor unit, so 1 VND is `amount: 1`; `USD` is in cents.

**Files:**

- Create: `libs/shared/kernel/src/lib/money.ts`, `libs/shared/kernel/src/lib/money.spec.ts`
- Modify: `libs/shared/kernel/src/index.ts`

- [ ] **Step 1: Write the failing test** `money.spec.ts`

```ts
import {
  add,
  compare,
  money,
  multiply,
  percentOf,
  subtract,
  sum,
} from './money';

describe('Money', () => {
  it('holds integer minor units and a currency', () => {
    expect(money(1500, 'USD')).toEqual({ amount: 1500, currency: 'USD' });
  });

  it('refuses a fractional or unsafe amount', () => {
    expect(() => money(1.5, 'USD')).toThrow(RangeError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'VND')).toThrow(RangeError);
  });

  it('adds and subtracts in the same currency', () => {
    expect(add(money(100, 'VND'), money(250, 'VND'))).toEqual(
      money(350, 'VND'),
    );
    expect(subtract(money(100, 'VND'), money(250, 'VND'))).toEqual(
      money(-150, 'VND'),
    );
  });

  it('refuses to mix currencies', () => {
    expect(() => add(money(1, 'VND'), money(1, 'USD'))).toThrow(
      'Cannot combine VND and USD',
    );
  });

  it('multiplies by an integer factor', () => {
    expect(multiply(money(1999, 'USD'), 3)).toEqual(money(5997, 'USD'));
    expect(() => multiply(money(1, 'USD'), 1.5)).toThrow(RangeError);
  });

  it('takes a whole percentage, rounding half up', () => {
    expect(percentOf(money(1000, 'USD'), 8)).toEqual(money(80, 'USD'));
    // 1006 * 8% = 80.48 -> 80
    expect(percentOf(money(1006, 'USD'), 8)).toEqual(money(80, 'USD'));
    // 1025 * 10% = 102.5 -> 103
    expect(percentOf(money(1025, 'USD'), 10)).toEqual(money(103, 'USD'));
  });

  it('compares amounts', () => {
    expect(compare(money(1, 'VND'), money(2, 'VND'))).toBe(-1);
    expect(compare(money(2, 'VND'), money(2, 'VND'))).toBe(0);
    expect(compare(money(3, 'VND'), money(2, 'VND'))).toBe(1);
  });

  it('sums a list, starting from zero in the given currency', () => {
    expect(sum([], 'VND')).toEqual(money(0, 'VND'));
    expect(sum([money(1, 'VND'), money(2, 'VND')], 'VND')).toEqual(
      money(3, 'VND'),
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test shared-kernel`
Expected: FAIL, `Failed to resolve import "./money"`.

- [ ] **Step 3: Implement `money.ts`**

```ts
export type Currency = 'VND' | 'USD';

/** An amount in integer minor units (VND has none; USD is in cents). */
export interface Money {
  readonly amount: number;
  readonly currency: Currency;
}

export function money(amount: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money needs a safe integer amount, got ${amount}`);
  }
  return { amount, currency };
}

function sameCurrency(a: Money, b: Money): Currency {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot combine ${a.currency} and ${b.currency}`);
  }
  return a.currency;
}

export function add(a: Money, b: Money): Money {
  return money(a.amount + b.amount, sameCurrency(a, b));
}

export function subtract(a: Money, b: Money): Money {
  return money(a.amount - b.amount, sameCurrency(a, b));
}

export function multiply(m: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new RangeError(`Money multiplies by an integer, got ${factor}`);
  }
  return money(m.amount * factor, m.currency);
}

/** `rate` percent of a non-negative amount, rounded half up. */
export function percentOf(m: Money, rate: number): Money {
  if (!Number.isInteger(rate) || rate < 0) {
    throw new RangeError(
      `A rate is a whole, non-negative percentage, got ${rate}`,
    );
  }
  return money(Math.floor((m.amount * rate + 50) / 100), m.currency);
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  sameCurrency(a, b);
  return a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0;
}

export function sum(items: readonly Money[], currency: Currency): Money {
  return items.reduce(add, money(0, currency));
}
```

- [ ] **Step 4: Export it**

Append to `libs/shared/kernel/src/index.ts`:

```ts
export * from './lib/money';
```

- [ ] **Step 5: Run the tests**

Run: `npx nx test shared-kernel`
Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add libs/shared/kernel
git commit -m "feat(repo): add Money to the shared kernel"
```

---

### Task 4: `Quantity`

**Files:**

- Create: `libs/shared/kernel/src/lib/quantity.ts`, `libs/shared/kernel/src/lib/quantity.spec.ts`
- Modify: `libs/shared/kernel/src/index.ts`

- [ ] **Step 1: Write the failing test** `quantity.spec.ts`

```ts
import { quantity } from './quantity';

describe('quantity', () => {
  it('accepts a positive integer', () => {
    const result = quantity(3);
    expect(result).toEqual({ ok: true, value: 3 });
  });

  it.each([0, -1, 1.5, Number.NaN])('refuses %s', (value) => {
    expect(quantity(value)).toEqual({ ok: false, error: 'invalid-quantity' });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test shared-kernel`
Expected: FAIL, `Failed to resolve import "./quantity"`.

- [ ] **Step 3: Implement `quantity.ts`**

```ts
import { err, ok, type Result } from './result';

declare const quantityBrand: unique symbol;

/** A count of units: a positive integer, checked once by `quantity()`. */
export type Quantity = number & { readonly [quantityBrand]: true };

export function quantity(value: number): Result<Quantity, 'invalid-quantity'> {
  return Number.isSafeInteger(value) && value > 0
    ? ok(value as Quantity)
    : err('invalid-quantity');
}
```

- [ ] **Step 4: Export it**

Append to `libs/shared/kernel/src/index.ts`:

```ts
export * from './lib/quantity';
```

- [ ] **Step 5: Run the tests**

Run: `npx nx test shared-kernel`
Expected: PASS, 16 tests.

- [ ] **Step 6: Commit**

```bash
git add libs/shared/kernel
git commit -m "feat(repo): add Quantity to the shared kernel"
```

---

### Task 5: `DomainEvent` and `InMemoryEventBus`

**Files:**

- Create: `libs/shared/kernel/src/lib/domain-event.ts`,
  `libs/shared/kernel/src/lib/event-bus.ts`, `libs/shared/kernel/src/lib/event-bus.spec.ts`
- Modify: `libs/shared/kernel/src/index.ts`

- [ ] **Step 1: Write the failing test** `event-bus.spec.ts`

```ts
import { domainEvent, type DomainEvent } from './domain-event';
import { InMemoryEventBus } from './event-bus';

type Pinged = DomainEvent<'Pinged', { n: number }>;
type Ponged = DomainEvent<'Ponged', { n: number }>;

const at = new Date('2026-10-17T08:00:00Z');

describe('domainEvent', () => {
  it('stamps the type, the time and the payload', () => {
    expect(domainEvent('Pinged', { n: 1 }, at)).toEqual({
      type: 'Pinged',
      occurredAt: '2026-10-17T08:00:00.000Z',
      payload: { n: 1 },
    });
  });
});

describe('InMemoryEventBus', () => {
  it('delivers an event to the subscribers of its type only', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const pinged: number[] = [];
    const ponged: number[] = [];
    bus.subscribe('Pinged', (event) => pinged.push(event.payload.n));
    bus.subscribe('Ponged', (event) => ponged.push(event.payload.n));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(pinged).toEqual([1]);
    expect(ponged).toEqual([]);
  });

  it('delivers to every subscriber in subscription order', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const calls: string[] = [];
    bus.subscribe('Pinged', () => calls.push('first'));
    bus.subscribe('Pinged', () => calls.push('second'));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(calls).toEqual(['first', 'second']);
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new InMemoryEventBus<Pinged>();
    const seen: number[] = [];
    const unsubscribe = bus.subscribe('Pinged', (e) => seen.push(e.payload.n));

    unsubscribe();
    bus.publish(domainEvent('Pinged', { n: 1 }, at));

    expect(seen).toEqual([]);
  });

  it('delivers to subscribers of every type through subscribeAll', () => {
    const bus = new InMemoryEventBus<Pinged | Ponged>();
    const seen: string[] = [];
    bus.subscribeAll((event) => seen.push(event.type));

    bus.publish(domainEvent('Pinged', { n: 1 }, at));
    bus.publish(domainEvent('Ponged', { n: 2 }, at));

    expect(seen).toEqual(['Pinged', 'Ponged']);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test shared-kernel`
Expected: FAIL, `Failed to resolve import "./domain-event"`.

- [ ] **Step 3: Implement `domain-event.ts`**

```ts
/** Something that happened in a bounded context, named in the past tense. */
export interface DomainEvent<
  TType extends string = string,
  TPayload = unknown,
> {
  readonly type: TType;
  /** ISO 8601, UTC. */
  readonly occurredAt: string;
  readonly payload: TPayload;
}

export function domainEvent<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  at: Date,
): DomainEvent<TType, TPayload> {
  return { type, occurredAt: at.toISOString(), payload };
}
```

- [ ] **Step 4: Implement `event-bus.ts`**

```ts
import type { DomainEvent } from './domain-event';

type Handler<E> = (event: E) => void;

/**
 * Delivers domain events synchronously, in memory, in subscription order.
 *
 * The suite's mock backend owns one; a real system would put a broker here.
 */
export class InMemoryEventBus<E extends DomainEvent> {
  private readonly handlers = new Map<string, Handler<E>[]>();
  private readonly allHandlers: Handler<E>[] = [];

  subscribe<T extends E['type']>(
    type: T,
    handler: Handler<Extract<E, { type: T }>>,
  ): () => void {
    const list = this.handlers.get(type) ?? [];
    const entry = handler as Handler<E>;
    list.push(entry);
    this.handlers.set(type, list);
    return () => list.splice(list.indexOf(entry), 1);
  }

  subscribeAll(handler: Handler<E>): () => void {
    this.allHandlers.push(handler);
    return () => this.allHandlers.splice(this.allHandlers.indexOf(handler), 1);
  }

  publish(event: E): void {
    for (const handler of [...(this.handlers.get(event.type) ?? [])]) {
      handler(event);
    }
    for (const handler of [...this.allHandlers]) handler(event);
  }
}
```

- [ ] **Step 5: Export them**

Append to `libs/shared/kernel/src/index.ts`:

```ts
export * from './lib/domain-event';
export * from './lib/event-bus';
```

- [ ] **Step 6: Run the tests and lint**

```bash
npx nx test shared-kernel
npx nx lint shared-kernel
```

Expected: PASS, 21 tests; lint clean.

- [ ] **Step 7: Commit**

```bash
git add libs/shared/kernel
git commit -m "feat(repo): add domain events and an in-memory event bus to the shared kernel"
```

---

### Task 6: Scaffold `booking-domain` and its boundary rules

**Files:**

- Create: `libs/booking/domain/` with the same seven config files as Task 1, `src/index.ts`,
  `src/lib/smoke.spec.ts` (deleted in Task 7)
- Modify: `tsconfig.base.json`, `eslint.config.mjs`, `docs/architecture/c4-containers.md`

- [ ] **Step 1: Create `libs/booking/domain/project.json`**

```json
{
  "name": "booking-domain",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/booking/domain/src",
  "projectType": "library",
  "tags": ["type:lib", "scope:booking", "layer:domain"],
  "targets": {
    "test": {
      "executor": "@nx/vitest:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "reportsDirectory": "coverage/libs/booking/domain"
      }
    }
  }
}
```

- [ ] **Step 2: Copy the configs from `shared-kernel`, changing the names**

```bash
for f in tsconfig.json tsconfig.lib.json tsconfig.spec.json vite.config.mts eslint.config.mjs; do
  sed -e 's#libs/shared/kernel#libs/booking/domain#g' -e "s#'shared-kernel'#'booking-domain'#" \
    libs/shared/kernel/$f > libs/booking/domain/$f
done
grep -n "kernel" libs/booking/domain/*.* || echo "no leftovers"
```

Expected: `no leftovers`. The relative `../../../` depth is the same, so nothing else changes.

- [ ] **Step 3: Create `README.md`, `src/index.ts`, smoke test**

`libs/booking/domain/README.md`:

```markdown
# booking-domain

The Booking bounded context's model: the `SalesOrder` aggregate, its lines, delivery slots, totals
and the `OrderPlaced` and `OrderCancelled` events. Plain TypeScript on `shared-kernel`; every rule
has a unit test.

Run `npx nx test booking-domain` for the unit tests.
```

`src/index.ts`: `export {};` and `src/lib/smoke.spec.ts` identical to Task 1 Step 5, with the
describe name `'booking-domain'`.

- [ ] **Step 4: Add the path alias**

In `tsconfig.base.json` paths, after the `shared-kernel` line:

```json
      "@angular-saas-kit/booking-domain": ["./libs/booking/domain/src/index.ts"]
```

- [ ] **Step 5: Add the boundary rules to `eslint.config.mjs`**

Append inside `depConstraints`, after the `scope:landing` entry:

```js
            // A bounded context's domain layer depends only on other domain
            // code (its own and the shared kernel): no data access, no UI.
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:domain'],
            },
            // A business context sees itself and shared code. Other contexts
            // reach it only through its contracts (added with SCM).
            {
              sourceTag: 'scope:booking',
              onlyDependOnLibsWithTags: ['scope:booking', 'scope:shared'],
            },
```

- [ ] **Step 6: Prove the rule bites, then remove the probe**

```bash
echo "import '@angular-saas-kit/mock-api';" > libs/booking/domain/src/lib/probe.ts
npx nx lint booking-domain
rm libs/booking/domain/src/lib/probe.ts
```

Expected: lint FAILS with `A project tagged with "layer:domain" can only depend on libs tagged with "layer:domain"`.
(It also reports the `no-restricted-imports` rule if `mock-api` pulls Angular in; either error proves the point.)

- [ ] **Step 7: Add the container and edge to the C4 map**

In `docs/architecture/c4-containers.md`, after the `kernel` container line:

```text
    Container(bookingdomain, "booking-domain", "TypeScript library", "Booking context model: SalesOrder, lines, delivery slots, totals, OrderPlaced and OrderCancelled. No Angular")
```

after the last `Rel(...)` line:

```text
  Rel(bookingdomain, kernel, "Imports")
```

and a table row after `shared-kernel`:

```markdown
| `booking-domain` | library | `type:lib`, `scope:booking`, `layer:domain` | Not published. Plain TypeScript; may import only `layer:domain` libraries ([ADR 0021](../adr/0021-bounded-contexts-as-nx-libraries.md)). |
```

The edge exists from Task 7 on; until then the check reports it as drawn but missing, so run the
architecture check at the end of Task 7, not here.

- [ ] **Step 8: Run the smoke test and lint**

```bash
npx nx test booking-domain
npx nx lint booking-domain
```

Expected: 1 test passes; lint clean.

- [ ] **Step 9: Commit**

```bash
git add libs/booking/domain tsconfig.base.json eslint.config.mjs docs/architecture/c4-containers.md
git commit -m "feat(repo): scaffold booking-domain with layer and scope boundaries"
```

---

### Task 7: Domain errors and delivery slots

**Files:**

- Create: `libs/booking/domain/src/lib/errors.ts`, `delivery-slot.ts`, `delivery-slot.spec.ts`
- Modify: `libs/booking/domain/src/index.ts`
- Delete: `libs/booking/domain/src/lib/smoke.spec.ts`

- [ ] **Step 1: Write the failing test** `delivery-slot.spec.ts`

```ts
import {
  bookSlot,
  isBookable,
  releaseSlot,
  slotStart,
  type DeliverySlot,
} from './delivery-slot';

const slot = (overrides: Partial<DeliverySlot> = {}): DeliverySlot => ({
  id: 'slot-2026-10-20-am',
  date: '2026-10-20',
  window: '08-12',
  capacity: 2,
  booked: 0,
  ...overrides,
});

describe('DeliverySlot', () => {
  it('starts at the window opening, local time', () => {
    expect(slotStart(slot())).toEqual(new Date(2026, 9, 20, 8));
    expect(slotStart(slot({ window: '13-17' }))).toEqual(
      new Date(2026, 9, 20, 13),
    );
  });

  it('is bookable when it starts after now and has room', () => {
    expect(isBookable(slot(), new Date(2026, 9, 19))).toEqual({
      ok: true,
      value: slot(),
    });
  });

  it('is not bookable once it has started', () => {
    expect(isBookable(slot(), new Date(2026, 9, 20, 8))).toMatchObject({
      ok: false,
      error: { code: 'slot-in-past' },
    });
  });

  it('is not bookable when full', () => {
    expect(
      isBookable(slot({ booked: 2 }), new Date(2026, 9, 19)),
    ).toMatchObject({ ok: false, error: { code: 'slot-full' } });
  });

  it('books and releases one place', () => {
    expect(bookSlot(slot()).booked).toBe(1);
    expect(releaseSlot(slot({ booked: 1 })).booked).toBe(0);
    expect(releaseSlot(slot({ booked: 0 })).booked).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test booking-domain`
Expected: FAIL, `Failed to resolve import "./delivery-slot"`.

- [ ] **Step 3: Implement `errors.ts`**

```ts
/** Why a Booking operation was refused. The UI maps each code to a message. */
export type DomainErrorCode =
  | 'empty-order'
  | 'slot-in-past'
  | 'slot-full'
  | 'invalid-transition'
  | 'reason-required'
  | 'not-draft'
  | 'invalid-quantity'
  | 'currency-mismatch'
  | 'discount-too-large'
  | 'duplicate-line'
  | 'line-not-found';

export interface DomainError {
  readonly code: DomainErrorCode;
  /** For logs and developers; the UI shows its own text for the code. */
  readonly detail: string;
}

export function domainError(
  code: DomainErrorCode,
  detail: string,
): DomainError {
  return { code, detail };
}
```

- [ ] **Step 4: Implement `delivery-slot.ts`**

```ts
import { err, ok, type Result } from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';

export type DeliveryWindow = '08-12' | '13-17';

export interface DeliverySlot {
  readonly id: string;
  /** Local calendar date, `YYYY-MM-DD`. */
  readonly date: string;
  readonly window: DeliveryWindow;
  readonly capacity: number;
  readonly booked: number;
}

export function slotStart(slot: DeliverySlot): Date {
  const [year, month, day] = slot.date.split('-').map(Number);
  const hour = Number(slot.window.slice(0, 2));
  return new Date(year, month - 1, day, hour);
}

export function isBookable(
  slot: DeliverySlot,
  now: Date,
): Result<DeliverySlot, DomainError> {
  if (slotStart(slot) <= now) {
    return err(domainError('slot-in-past', `${slot.id} has started`));
  }
  if (slot.booked >= slot.capacity) {
    return err(domainError('slot-full', `${slot.id} is full`));
  }
  return ok(slot);
}

export function bookSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: slot.booked + 1 };
}

export function releaseSlot(slot: DeliverySlot): DeliverySlot {
  return { ...slot, booked: Math.max(0, slot.booked - 1) };
}
```

- [ ] **Step 5: Export, drop the smoke test**

`libs/booking/domain/src/index.ts`:

```ts
export * from './lib/errors';
export * from './lib/delivery-slot';
```

```bash
git rm libs/booking/domain/src/lib/smoke.spec.ts
```

- [ ] **Step 6: Run tests, lint and the architecture check**

```bash
npx nx test booking-domain
npx nx lint booking-domain
npm run check:architecture
```

Expected: PASS, 5 tests; lint clean; `The map matches the code` (the `booking-domain -> shared-kernel` edge now exists).

- [ ] **Step 7: Commit**

```bash
git add libs/booking/domain
git commit -m "feat(repo): add delivery slots and domain errors to booking-domain"
```

---

### Task 8: Order lines and their money

Rule 2 (positive quantity, matching currency) and the per-line half of rule 6.

**Files:**

- Create: `libs/booking/domain/src/lib/order-line.ts`, `order-line.spec.ts`
- Modify: `libs/booking/domain/src/index.ts`

- [ ] **Step 1: Write the failing test** `order-line.spec.ts`

```ts
import { money } from '@angular-saas-kit/shared-kernel';

import { lineNet, lineVat, orderLine } from './order-line';

const input = {
  productId: 'P-001',
  name: 'Carton of rice, 10 kg',
  quantity: 3,
  unitPrice: money(250_000, 'VND'),
  discount: money(50_000, 'VND'),
  vatRate: 8 as const,
};

describe('orderLine', () => {
  it('builds a line from valid input', () => {
    const result = orderLine(input);
    expect(result.ok).toBe(true);
  });

  it('refuses a quantity that is not a positive integer', () => {
    expect(orderLine({ ...input, quantity: 0 })).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' },
    });
  });

  it('refuses a discount in another currency than the price', () => {
    expect(orderLine({ ...input, discount: money(1, 'USD') })).toMatchObject({
      ok: false,
      error: { code: 'currency-mismatch' },
    });
  });

  it('refuses a discount above the line total', () => {
    expect(
      orderLine({ ...input, discount: money(750_001, 'VND') }),
    ).toMatchObject({ ok: false, error: { code: 'discount-too-large' } });
  });
});

describe('line money', () => {
  const line = (() => {
    const result = orderLine(input);
    if (!result.ok) throw new Error('fixture');
    return result.value;
  })();

  it('nets quantity times price minus the discount', () => {
    expect(lineNet(line)).toEqual(money(700_000, 'VND'));
  });

  it('charges VAT on the net, rounded half up', () => {
    expect(lineVat(line)).toEqual(money(56_000, 'VND'));
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test booking-domain`
Expected: FAIL, `Failed to resolve import "./order-line"`.

- [ ] **Step 3: Implement `order-line.ts`**

```ts
import {
  compare,
  err,
  multiply,
  ok,
  percentOf,
  quantity as toQuantity,
  subtract,
  type Money,
  type Quantity,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';

export type VatRate = 0 | 8 | 10;

export interface OrderLine {
  readonly productId: string;
  readonly name: string;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
  readonly discount: Money;
  readonly vatRate: VatRate;
}

export interface OrderLineInput {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly discount: Money;
  readonly vatRate: VatRate;
}

export function orderLine(
  input: OrderLineInput,
): Result<OrderLine, DomainError> {
  const quantity = toQuantity(input.quantity);
  if (!quantity.ok) {
    return err(
      domainError('invalid-quantity', `${input.productId}: ${input.quantity}`),
    );
  }
  if (input.discount.currency !== input.unitPrice.currency) {
    return err(
      domainError('currency-mismatch', `${input.productId}: discount currency`),
    );
  }
  const gross = multiply(input.unitPrice, quantity.value);
  if (compare(input.discount, gross) > 0) {
    return err(
      domainError(
        'discount-too-large',
        `${input.productId}: discount above total`,
      ),
    );
  }
  return ok({ ...input, quantity: quantity.value });
}

export function lineNet(line: OrderLine): Money {
  return subtract(multiply(line.unitPrice, line.quantity), line.discount);
}

export function lineVat(line: OrderLine): Money {
  return percentOf(lineNet(line), line.vatRate);
}
```

- [ ] **Step 4: Export it**

Append to `libs/booking/domain/src/index.ts`:

```ts
export * from './lib/order-line';
```

- [ ] **Step 5: Run the tests**

Run: `npx nx test booking-domain`
Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add libs/booking/domain
git commit -m "feat(repo): add order lines with net and VAT to booking-domain"
```

---

### Task 9: Booking events

**Files:**

- Create: `libs/booking/domain/src/lib/events.ts`
- Modify: `libs/booking/domain/src/index.ts`

Types only; the tests in Tasks 10 and 11 exercise them.

- [ ] **Step 1: Implement `events.ts`**

```ts
import type { DomainEvent, Money } from '@angular-saas-kit/shared-kernel';

export type OrderPlaced = DomainEvent<
  'OrderPlaced',
  {
    readonly orderId: string;
    readonly customerId: string;
    readonly slotId: string;
    readonly total: Money;
    readonly lines: readonly {
      readonly productId: string;
      readonly quantity: number;
    }[];
  }
>;

export type OrderCancelled = DomainEvent<
  'OrderCancelled',
  {
    readonly orderId: string;
    readonly reason: string;
    /** The slot to release; absent when a draft is cancelled. */
    readonly slotId?: string;
  }
>;

export type BookingEvent = OrderPlaced | OrderCancelled;
```

- [ ] **Step 2: Export it**

Append to `libs/booking/domain/src/index.ts`:

```ts
export * from './lib/events';
```

- [ ] **Step 3: Typecheck and commit**

```bash
npm run typecheck
git add libs/booking/domain
git commit -m "feat(repo): add the OrderPlaced and OrderCancelled events"
```

Expected: `tsc` exits 0.

---

### Task 10: `SalesOrder` drafts and totals

Rule 1 (lines change only in `draft`) and rule 6 (totals).

**Files:**

- Create: `libs/booking/domain/src/lib/sales-order.ts`, `totals.ts`,
  `sales-order.spec.ts`, `totals.spec.ts`, `testing.ts` (fixtures for specs only)
- Modify: `libs/booking/domain/src/index.ts`

- [ ] **Step 1: Create the spec fixtures** `testing.ts`

Not exported from `index.ts`; specs import it directly.

```ts
import { money } from '@angular-saas-kit/shared-kernel';

import type { DeliverySlot } from './delivery-slot';
import { orderLine, type OrderLine, type OrderLineInput } from './order-line';

export function line(overrides: Partial<OrderLineInput> = {}): OrderLine {
  const result = orderLine({
    productId: 'P-001',
    name: 'Carton of rice, 10 kg',
    quantity: 2,
    unitPrice: money(250_000, 'VND'),
    discount: money(0, 'VND'),
    vatRate: 8,
    ...overrides,
  });
  if (!result.ok) throw new Error(`bad fixture: ${result.error.code}`);
  return result.value;
}

export function slot(overrides: Partial<DeliverySlot> = {}): DeliverySlot {
  return {
    id: 'slot-2026-10-20-am',
    date: '2026-10-20',
    window: '08-12',
    capacity: 5,
    booked: 0,
    ...overrides,
  };
}

/** Before the fixture slot opens. */
export const NOW = new Date(2026, 9, 18, 9);
```

- [ ] **Step 2: Write the failing draft tests** `sales-order.spec.ts`

```ts
import { money } from '@angular-saas-kit/shared-kernel';

import {
  addLine,
  changeQuantity,
  createDraft,
  removeLine,
  type SalesOrder,
} from './sales-order';
import { line } from './testing';

function unwrap<T>(
  result: { ok: true; value: T } | { ok: false; error: unknown },
): T {
  if (!result.ok)
    throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}

const draft = (): SalesOrder =>
  createDraft({ id: 'SO-0001', customerId: 'C-001', currency: 'VND' });

describe('SalesOrder draft', () => {
  it('starts empty, in draft', () => {
    expect(draft()).toEqual({
      id: 'SO-0001',
      customerId: 'C-001',
      currency: 'VND',
      lines: [],
      status: 'draft',
    });
  });

  it('adds a line', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(order.lines).toHaveLength(1);
  });

  it('refuses a second line for the same product', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(addLine(order, line())).toMatchObject({
      ok: false,
      error: { code: 'duplicate-line' },
    });
  });

  it('refuses a line in another currency', () => {
    expect(
      addLine(
        draft(),
        line({ unitPrice: money(1000, 'USD'), discount: money(0, 'USD') }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'currency-mismatch' } });
  });

  it('changes a quantity', () => {
    const order = unwrap(addLine(draft(), line()));
    const changed = unwrap(changeQuantity(order, 'P-001', 5));
    expect(changed.lines[0].quantity).toBe(5);
  });

  it('refuses an invalid quantity or an unknown product', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(changeQuantity(order, 'P-001', 0)).toMatchObject({
      ok: false,
      error: { code: 'invalid-quantity' },
    });
    expect(changeQuantity(order, 'P-404', 1)).toMatchObject({
      ok: false,
      error: { code: 'line-not-found' },
    });
  });

  it('removes a line', () => {
    const order = unwrap(addLine(draft(), line()));
    expect(unwrap(removeLine(order, 'P-001')).lines).toEqual([]);
  });

  it('refuses line changes outside draft', () => {
    const placed: SalesOrder = {
      ...unwrap(addLine(draft(), line())),
      status: 'placed',
    };
    const notDraft = { ok: false, error: { code: 'not-draft' } };
    expect(addLine(placed, line({ productId: 'P-002' }))).toMatchObject(
      notDraft,
    );
    expect(changeQuantity(placed, 'P-001', 3)).toMatchObject(notDraft);
    expect(removeLine(placed, 'P-001')).toMatchObject(notDraft);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx nx test booking-domain`
Expected: FAIL, `Failed to resolve import "./sales-order"`.

- [ ] **Step 4: Implement the draft half of `sales-order.ts`**

```ts
import {
  err,
  ok,
  quantity as toQuantity,
  type Currency,
  type Result,
} from '@angular-saas-kit/shared-kernel';

import { domainError, type DomainError } from './errors';
import type { OrderLine } from './order-line';

export type OrderStatus = 'draft' | 'placed' | 'confirmed' | 'cancelled';

export interface SalesOrder {
  readonly id: string;
  readonly customerId: string;
  readonly currency: Currency;
  readonly lines: readonly OrderLine[];
  readonly status: OrderStatus;
  readonly slotId?: string;
  /** ISO 8601, set when the order is placed. */
  readonly placedAt?: string;
  readonly cancelReason?: string;
}

export function createDraft(input: {
  id: string;
  customerId: string;
  currency: Currency;
}): SalesOrder {
  return { ...input, lines: [], status: 'draft' };
}

function requireDraft(order: SalesOrder): Result<SalesOrder, DomainError> {
  return order.status === 'draft'
    ? ok(order)
    : err(domainError('not-draft', `${order.id} is ${order.status}`));
}

export function addLine(
  order: SalesOrder,
  line: OrderLine,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
  if (line.unitPrice.currency !== order.currency) {
    return err(
      domainError(
        'currency-mismatch',
        `${line.productId} is not in ${order.currency}`,
      ),
    );
  }
  if (order.lines.some((existing) => existing.productId === line.productId)) {
    return err(
      domainError(
        'duplicate-line',
        `${line.productId} is already on ${order.id}`,
      ),
    );
  }
  return ok({ ...order, lines: [...order.lines, line] });
}

export function changeQuantity(
  order: SalesOrder,
  productId: string,
  value: number,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
  if (!order.lines.some((line) => line.productId === productId)) {
    return err(
      domainError('line-not-found', `${productId} is not on ${order.id}`),
    );
  }
  const quantity = toQuantity(value);
  if (!quantity.ok) {
    return err(domainError('invalid-quantity', `${productId}: ${value}`));
  }
  return ok({
    ...order,
    lines: order.lines.map((line) =>
      line.productId === productId
        ? { ...line, quantity: quantity.value }
        : line,
    ),
  });
}

export function removeLine(
  order: SalesOrder,
  productId: string,
): Result<SalesOrder, DomainError> {
  const draft = requireDraft(order);
  if (!draft.ok) return draft;
  if (!order.lines.some((line) => line.productId === productId)) {
    return err(
      domainError('line-not-found', `${productId} is not on ${order.id}`),
    );
  }
  return ok({
    ...order,
    lines: order.lines.filter((line) => line.productId !== productId),
  });
}
```

Note: `changeQuantity` keeps the line's discount; a quantity cut below the discount is not checked
here. That is deliberate for this slice (discounts are set when the line is added), and recorded in
the spec's out-of-scope list in Task 13.

- [ ] **Step 5: Run the draft tests**

Run: `npx nx test booking-domain`
Expected: PASS, 19 tests.

- [ ] **Step 6: Write the failing totals test** `totals.spec.ts`

```ts
import { money } from '@angular-saas-kit/shared-kernel';

import { addLine, createDraft, type SalesOrder } from './sales-order';
import { line } from './testing';
import { orderTotals } from './totals';

describe('orderTotals', () => {
  it('is zero for an empty order', () => {
    const order = createDraft({
      id: 'SO-1',
      customerId: 'C-1',
      currency: 'VND',
    });
    expect(orderTotals(order)).toEqual({
      subtotal: money(0, 'VND'),
      vat: money(0, 'VND'),
      total: money(0, 'VND'),
    });
  });

  it('sums nets, VAT per line at its own rate, and the total', () => {
    let order: SalesOrder = createDraft({
      id: 'SO-1',
      customerId: 'C-1',
      currency: 'VND',
    });
    for (const l of [
      // 2 x 250,000 = 500,000 net, 8% = 40,000
      line({
        productId: 'P-1',
        quantity: 2,
        unitPrice: money(250_000, 'VND'),
        vatRate: 8,
      }),
      // 3 x 33,335 - 5 = 100,000 net, 10% = 10,000
      line({
        productId: 'P-2',
        quantity: 3,
        unitPrice: money(33_335, 'VND'),
        discount: money(5, 'VND'),
        vatRate: 10,
      }),
      // 1 x 15,005 net, 0% = 0
      line({
        productId: 'P-3',
        quantity: 1,
        unitPrice: money(15_005, 'VND'),
        vatRate: 0,
      }),
    ]) {
      const next = addLine(order, l);
      if (!next.ok) throw new Error(next.error.code);
      order = next.value;
    }

    expect(orderTotals(order)).toEqual({
      subtotal: money(615_005, 'VND'),
      vat: money(50_000, 'VND'),
      total: money(665_005, 'VND'),
    });
  });
});
```

- [ ] **Step 7: Run it and watch it fail**

Run: `npx nx test booking-domain`
Expected: FAIL, `Failed to resolve import "./totals"`.

- [ ] **Step 8: Implement `totals.ts`**

```ts
import { add, sum, type Money } from '@angular-saas-kit/shared-kernel';

import { lineNet, lineVat } from './order-line';
import type { SalesOrder } from './sales-order';

export interface OrderTotals {
  readonly subtotal: Money;
  readonly vat: Money;
  readonly total: Money;
}

/** VAT is rounded per line, then summed: what an invoice line shows adds up. */
export function orderTotals(order: SalesOrder): OrderTotals {
  const subtotal = sum(order.lines.map(lineNet), order.currency);
  const vat = sum(order.lines.map(lineVat), order.currency);
  return { subtotal, vat, total: add(subtotal, vat) };
}
```

- [ ] **Step 9: Export both**

Append to `libs/booking/domain/src/index.ts`:

```ts
export * from './lib/sales-order';
export * from './lib/totals';
```

- [ ] **Step 10: Run the tests**

Run: `npx nx test booking-domain`
Expected: PASS, 21 tests.

- [ ] **Step 11: Commit**

```bash
git add libs/booking/domain
git commit -m "feat(repo): add SalesOrder drafts and order totals to booking-domain"
```

---

### Task 11: Placing, confirming and cancelling

Rules 3, 4 and 5. Each transition returns the new order and the events it raised.

**Files:**

- Modify: `libs/booking/domain/src/lib/sales-order.ts`, `sales-order.spec.ts`

- [ ] **Step 1: Write the failing transition tests**

Append to `sales-order.spec.ts` (and add `cancel, confirm, place` to its import from `./sales-order`,
and `NOW, slot` to its import from `./testing`):

```ts
describe('SalesOrder transitions', () => {
  const withLine = (): SalesOrder => unwrap(addLine(draft(), line()));

  describe('place', () => {
    it('places a draft with lines into a bookable slot and raises OrderPlaced', () => {
      const { order, events } = unwrap(place(withLine(), slot(), NOW));

      expect(order).toMatchObject({
        status: 'placed',
        slotId: 'slot-2026-10-20-am',
        placedAt: NOW.toISOString(),
      });
      expect(events).toEqual([
        {
          type: 'OrderPlaced',
          occurredAt: NOW.toISOString(),
          payload: {
            orderId: 'SO-0001',
            customerId: 'C-001',
            slotId: 'slot-2026-10-20-am',
            total: money(540_000, 'VND'),
            lines: [{ productId: 'P-001', quantity: 2 }],
          },
        },
      ]);
    });

    it('refuses an empty order', () => {
      expect(place(draft(), slot(), NOW)).toMatchObject({
        ok: false,
        error: { code: 'empty-order' },
      });
    });

    it('refuses a full or past slot', () => {
      expect(place(withLine(), slot({ booked: 5 }), NOW)).toMatchObject({
        ok: false,
        error: { code: 'slot-full' },
      });
      expect(
        place(withLine(), slot({ date: '2026-10-17' }), NOW),
      ).toMatchObject({
        ok: false,
        error: { code: 'slot-in-past' },
      });
    });

    it('refuses an order that is not a draft', () => {
      const { order } = unwrap(place(withLine(), slot(), NOW));
      expect(place(order, slot(), NOW)).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });
  });

  describe('confirm', () => {
    it('confirms a placed order', () => {
      const { order } = unwrap(place(withLine(), slot(), NOW));
      expect(unwrap(confirm(order)).status).toBe('confirmed');
    });

    it('refuses anything but a placed order', () => {
      expect(confirm(withLine())).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });
  });

  describe('cancel', () => {
    it('cancels a draft, without a slot to release', () => {
      const { order, events } = unwrap(
        cancel(withLine(), 'Customer changed mind', NOW),
      );
      expect(order).toMatchObject({
        status: 'cancelled',
        cancelReason: 'Customer changed mind',
      });
      expect(events[0].payload).toEqual({
        orderId: 'SO-0001',
        reason: 'Customer changed mind',
      });
    });

    it('cancels a placed or confirmed order and names the slot to release', () => {
      const placed = unwrap(place(withLine(), slot(), NOW)).order;
      const confirmed = unwrap(confirm(placed));
      for (const order of [placed, confirmed]) {
        const { events } = unwrap(cancel(order, 'Out of budget', NOW));
        expect(events).toEqual([
          {
            type: 'OrderCancelled',
            occurredAt: NOW.toISOString(),
            payload: {
              orderId: 'SO-0001',
              reason: 'Out of budget',
              slotId: 'slot-2026-10-20-am',
            },
          },
        ]);
      }
    });

    it('needs a reason', () => {
      expect(cancel(withLine(), '   ', NOW)).toMatchObject({
        ok: false,
        error: { code: 'reason-required' },
      });
    });

    it('refuses to cancel twice', () => {
      const { order } = unwrap(cancel(withLine(), 'Duplicate', NOW));
      expect(cancel(order, 'Again', NOW)).toMatchObject({
        ok: false,
        error: { code: 'invalid-transition' },
      });
    });
  });
});
```

The expected total: 2 × 250,000 = 500,000 net, 8% VAT = 40,000, total 540,000.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx nx test booking-domain`
Expected: FAIL, `place is not a function` (or a missing export error).

- [ ] **Step 3: Implement the transitions**

Add to the imports at the top of `sales-order.ts`:

```ts
import { domainEvent } from '@angular-saas-kit/shared-kernel';

import { isBookable, type DeliverySlot } from './delivery-slot';
import type { BookingEvent, OrderCancelled, OrderPlaced } from './events';
import { orderTotals } from './totals';
```

(`domainEvent` joins the existing `@angular-saas-kit/shared-kernel` import.) Then append:

```ts
/** A state change and what it raised, for the caller to save and publish. */
export interface Transition<E extends BookingEvent = BookingEvent> {
  readonly order: SalesOrder;
  readonly events: readonly E[];
}

function invalidTransition(order: SalesOrder, to: OrderStatus): DomainError {
  return domainError(
    'invalid-transition',
    `${order.id}: ${order.status} -> ${to}`,
  );
}

export function place(
  order: SalesOrder,
  slot: DeliverySlot,
  now: Date,
): Result<Transition<OrderPlaced>, DomainError> {
  if (order.status !== 'draft') return err(invalidTransition(order, 'placed'));
  if (order.lines.length === 0) {
    return err(domainError('empty-order', `${order.id} has no lines`));
  }
  const bookable = isBookable(slot, now);
  if (!bookable.ok) return bookable;

  const placed: SalesOrder = {
    ...order,
    status: 'placed',
    slotId: slot.id,
    placedAt: now.toISOString(),
  };
  const event: OrderPlaced = domainEvent(
    'OrderPlaced',
    {
      orderId: placed.id,
      customerId: placed.customerId,
      slotId: slot.id,
      total: orderTotals(placed).total,
      lines: placed.lines.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    },
    now,
  );
  return ok({ order: placed, events: [event] });
}

export function confirm(order: SalesOrder): Result<SalesOrder, DomainError> {
  return order.status === 'placed'
    ? ok({ ...order, status: 'confirmed' })
    : err(invalidTransition(order, 'confirmed'));
}

export function cancel(
  order: SalesOrder,
  reason: string,
  now: Date,
): Result<Transition<OrderCancelled>, DomainError> {
  if (order.status === 'cancelled')
    return err(invalidTransition(order, 'cancelled'));
  const trimmed = reason.trim();
  if (trimmed === '') {
    return err(domainError('reason-required', `${order.id}: no reason given`));
  }
  const cancelled: SalesOrder = {
    ...order,
    status: 'cancelled',
    cancelReason: trimmed,
  };
  const event: OrderCancelled = domainEvent(
    'OrderCancelled',
    order.slotId
      ? { orderId: order.id, reason: trimmed, slotId: order.slotId }
      : { orderId: order.id, reason: trimmed },
    now,
  );
  return ok({ order: cancelled, events: [event] });
}
```

`sales-order.ts` now imports `orderTotals` from `totals.ts`, which imports only the `SalesOrder`
_type_ back (`import type`), so there is no runtime cycle.

- [ ] **Step 4: Run the tests, lint and typecheck**

```bash
npx nx test booking-domain
npx nx lint booking-domain
npm run typecheck
```

Expected: PASS, 31 tests; lint clean; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add libs/booking/domain
git commit -m "feat(repo): place, confirm and cancel sales orders"
```

---

### Task 12: Coverage check

- [ ] **Step 1: Read the coverage summary**

```bash
npx nx test shared-kernel
npx nx test booking-domain
```

Expected: each prints a `text-summary`; statements and branches at or near 100%. Any uncovered
branch is a rule without a test: add the test (and only then the code, if one is missing) before
moving on.

- [ ] **Step 2: Commit if a test was added**

```bash
git add libs
git commit -m "test(repo): cover the remaining domain branches"
```

---

### Task 13: ADR 0021 and docs

**Files:**

- Create: `docs/adr/0021-bounded-contexts-as-nx-libraries.md`
- Modify: `docs/adr/README.md` (index row), `docs/superpowers/specs/2026-10-17-suite-booking-design.md`
  (out-of-scope line)

- [ ] **Step 1: Read the template and the newest ADR for tone**

```bash
cat docs/adr/template.md
sed -n 1,40p docs/adr/0020-storybook-on-the-angular-webpack-builder.md
```

Use the `write-adr` skill's numbering and index rules.

- [ ] **Step 2: Write `docs/adr/0021-bounded-contexts-as-nx-libraries.md`**

Fill the template's sections with this content (headings as the template names them):

- **Status:** Proposed. **Date:** the commit date.
- **Context:** The kit is adding a second demo, `suite`, with several business domains (Booking,
  then SCM, Logistics, ERP) that must stay separable as they grow. Folder conventions alone drift;
  this repo already enforces boundaries with Nx tags (ADR 0015).
- **Decision:** Each bounded context is a set of Nx libraries under `libs/<context>/`, one per
  layer: `domain` (plain TypeScript), `contracts` (what other contexts may import), `data-access`,
  `feature-*`. Every one keeps `type:lib`, takes `scope:<context>`, and adds a `layer:` tag. Lint
  allows `layer:domain` to depend only on `layer:domain`, and a context only on itself and
  `scope:shared`; domain libraries also refuse `@angular/*` and `rxjs` imports. Value types and the
  event bus shared by every context live in `shared-kernel`. Domain operations are pure functions
  that return a `Result` and the domain events they raised.
- **Consequences:** Good: rules are unit-tested without TestBed and run in milliseconds; the
  mock backend and the UI share one model; a context cannot quietly reach into another. Bad: four
  libraries per context, each with its config; cross-context work goes through contracts and
  events, which is slower to write than a direct import.

- [ ] **Step 3: Add the index row** in `docs/adr/README.md`, matching the existing rows' format.

- [ ] **Step 4: Record the quantity-versus-discount decision in the spec**

In the spec's "Out of scope" paragraph, append: "Changing a line's quantity does not re-check its
discount against the new line total; discounts are validated when the line is added."

- [ ] **Step 5: Format, check, commit**

```bash
npm run format:check || npx prettier --write docs libs eslint.config.mjs tsconfig.base.json
npm run check:architecture
git add docs
git commit -m "docs: record bounded contexts as Nx libraries in ADR 0021"
```

Expected: the architecture check passes; format is clean.

---

### Task 14: Verify and open the PR

- [ ] **Step 1: Run everything CI runs**

Use the `verify` skill, or:

```bash
npm run verify
npm run format:check
```

Expected: both exit 0.

- [ ] **Step 2: Open the PR with the `open-pr` skill**

Title: `feat(repo): add the shared kernel and the Booking domain`. The body says what is built (two
plain-TypeScript libraries and their boundary rules), what is not yet (no app, no UI, no API: plans
2 to 4), and links the spec and ADR 0021.
