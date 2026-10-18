import { money } from '@angular-saas-kit/shared-kernel';
import {
  addLine,
  cancel,
  confirm,
  createDraft,
  orderLine,
  place,
  releaseSlot,
  slotStart,
  type DeliverySlot,
  type DeliveryWindow,
  type SalesOrder,
  type VatRate,
} from '@angular-saas-kit/booking-domain';
import type {
  CustomerDto,
  ProductDto,
  StatusChange,
} from '@angular-saas-kit/booking-contracts';

/** An order as the backend stores it: the aggregate and what the API adds. */
export interface OrderRecord {
  order: SalesOrder;
  readonly createdAt: string;
  readonly history: StatusChange[];
}

/**
 * The Booking demo's data: an invented distributor's customers, catalogue,
 * delivery slots and orders. Writable: the mock backend saves over it.
 */
export interface BookingDataset {
  readonly customers: readonly CustomerDto[];
  readonly products: readonly ProductDto[];
  readonly slots: DeliverySlot[];
  /** Oldest first. */
  readonly orders: OrderRecord[];
  /** The number the next new order takes. */
  nextId: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SLOT_CAPACITY = 3;
const WINDOWS: readonly DeliveryWindow[] = ['08-12', '13-17'];

/** mulberry32: small, fast and deterministic. Not for anything that needs real randomness. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

/** The local calendar date `days` from `from`, as `YYYY-MM-DD`. */
export function localDate(from: Date, days: number): string {
  const date = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + days,
  );
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// prettier-ignore
const SHOPS = [
  'Minh Chau Mart', 'Hoa Binh Grocery', 'Sen Vang Store', 'An Phu Foods',
  'Thanh Dat Retail', 'Bao Ngoc Minimart', 'Phuc Loc Trading', 'Kim Lien Shop',
  'Tan Tien Market', 'Hai Dang Provisions', 'Mai Anh Corner', 'Viet Hung Depot',
  'Ngoc Lan Grocers', 'Duc Thinh Supplies', 'Lotus Bay Kitchen', 'Song Hong Cafe',
  'Truong Son Canteen', 'Hanh Phuc Bakery', 'Quang Minh Hotel', 'Bach Tung School',
];

// prettier-ignore
const CITIES = ['Ha Noi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho'];

// prettier-ignore
const CATALOGUE: readonly (readonly [string, number, VatRate])[] = [
  ['Jasmine rice, 10 kg', 250_000, 8], ['Fish sauce, 1 l', 65_000, 8],
  ['Soy sauce, 500 ml', 28_000, 8], ['Instant noodles, carton of 30', 120_000, 8],
  ['Cooking oil, 5 l', 210_000, 8], ['White sugar, 1 kg', 24_000, 8],
  ['Sea salt, 1 kg', 9_000, 0], ['Black pepper, 200 g', 45_000, 8],
  ['Green tea, 500 g', 95_000, 8], ['Ground coffee, 1 kg', 280_000, 8],
  ['Condensed milk, carton of 48', 960_000, 8], ['Fresh milk, 1 l', 32_000, 8],
  ['Bottled water, case of 24', 96_000, 10], ['Orange juice, 1 l', 38_000, 10],
  ['Soft drink, case of 24', 220_000, 10], ['Beer, case of 24', 360_000, 10],
  ['Rice paper, 500 g', 30_000, 8], ['Rice vermicelli, 1 kg', 36_000, 8],
  ['Dried shiitake, 200 g', 85_000, 8], ['Peanuts, 1 kg', 70_000, 8],
  ['Cashews, 500 g', 160_000, 8], ['Chili sauce, 500 ml', 26_000, 8],
  ['Oyster sauce, 500 ml', 42_000, 8], ['Canned tuna, pack of 6', 135_000, 8],
  ['Dish soap, 3.6 kg', 98_000, 10], ['Laundry powder, 6 kg', 230_000, 10],
  ['Paper towels, pack of 12', 110_000, 10], ['Toilet paper, pack of 10', 85_000, 10],
  ['Shampoo, 1 l', 150_000, 10], ['Hand soap, 500 ml', 55_000, 10],
];

/** How many orders end in each status. */
const STATUS_MIX = {
  draft: 8,
  placed: 18,
  confirmed: 22,
  cancelled: 12,
} as const;
type SeedStatus = keyof typeof STATUS_MIX;

function slotsAround(now: Date): DeliverySlot[] {
  const slots: DeliverySlot[] = [];
  for (let day = -14; day < 14; day++) {
    const date = localDate(now, day);
    for (const window of WINDOWS) {
      slots.push({
        id: `slot-${date}-${window === '08-12' ? 'am' : 'pm'}`,
        date,
        window,
        capacity: SLOT_CAPACITY,
        booked: 0,
      });
    }
  }
  return slots;
}

/** Throws on a `Result` error: seed data that the domain refuses is a bug here. */
function must<T>(
  result: { ok: true; value: T } | { ok: false; error: { code: string } },
): T {
  if (!result.ok) throw new Error(`Bad seed data: ${result.error.code}`);
  return result.value;
}

/**
 * Generated from a fixed seed, so every load shows the same distributor, and
 * relative to `now`, so the orders end today. Every order is built through the
 * domain's operations, exactly as the mock backend builds them, and each
 * slot's `booked` counts the orders that occupy it. The names are invented.
 */
export function createBookingDataset(now: Date): BookingDataset {
  const random = generator(20261017);
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)] as T;

  const customers: CustomerDto[] = SHOPS.map((name, i) => ({
    id: `C-${pad(i + 1)}`,
    name,
    city: CITIES[i % CITIES.length] as string,
  }));
  const products: ProductDto[] = CATALOGUE.map(([name, price, vatRate], i) => ({
    id: `P-${pad(i + 1, 3)}`,
    name,
    unitPrice: money(price, 'VND'),
    vatRate,
  }));
  const slots = slotsAround(now);

  const statuses: SeedStatus[] = (
    Object.entries(STATUS_MIX) as [SeedStatus, number][]
  ).flatMap(([status, count]) => Array<SeedStatus>(count).fill(status));
  // Shuffled, so statuses are spread over the days.
  for (let i = statuses.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [statuses[i], statuses[j]] = [
      statuses[j] as SeedStatus,
      statuses[i] as SeedStatus,
    ];
  }

  // The first orders are from today, so the Overview has some; the rest
  // spread over the last 20 days. Oldest first, so the ids follow.
  const created = statuses
    .map((_, i) =>
      i < 3
        ? now.getTime() - (i + 1) * HOUR
        : now.getTime() - Math.floor((1 + random() * 19) * DAY),
    )
    .sort((a, b) => a - b);

  // Two slots still to come are filled to capacity by the first placed orders.
  const toFill = [
    `slot-${localDate(now, 2)}-am`,
    `slot-${localDate(now, 3)}-pm`,
  ];
  const fillQueue = toFill.flatMap((id) =>
    Array<string>(SLOT_CAPACITY).fill(id),
  );

  const orders: OrderRecord[] = created.map((at, i) => {
    const status = statuses[i] as SeedStatus;
    const createdAt = new Date(at);
    const history: StatusChange[] = [
      { status: 'draft', at: createdAt.toISOString() },
    ];
    let order: SalesOrder = createDraft({
      id: `SO-${pad(i + 1, 4)}`,
      customerId: pick(customers).id,
      currency: 'VND',
    });

    const lineCount = 1 + Math.floor(random() * 4);
    const chosen = new Set<ProductDto>();
    while (chosen.size < lineCount) chosen.add(pick(products));
    for (const product of chosen) {
      const quantity = 1 + Math.floor(random() * 20);
      const gross = product.unitPrice.amount * quantity;
      const discount =
        random() < 0.25 ? Math.floor(gross / 20 / 1000) * 1000 : 0;
      const line = must(
        orderLine({
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: product.unitPrice,
          discount: money(discount, 'VND'),
          vatRate: product.vatRate,
        }),
      );
      order = must(addLine(order, line));
    }

    const placedAt = new Date(Math.min(at + HOUR / 2, now.getTime()));
    const wantsSlot =
      status !== 'draft' && !(status === 'cancelled' && random() < 0.4);
    if (wantsSlot) {
      const forced = status === 'placed' ? fillQueue.shift() : undefined;
      const open = slots.filter(
        (slot) =>
          !toFill.includes(slot.id) &&
          slot.booked < slot.capacity &&
          slotStart(slot) > placedAt &&
          // A placed order still waits for its delivery.
          (status !== 'placed' || slotStart(slot) > now),
      );
      const slot = forced
        ? slots.find((candidate) => candidate.id === forced)
        : pick(open.slice(0, 6));
      if (slot) {
        const placed = must(place(order, slot, placedAt));
        slots[slots.indexOf(slot)] = placed.slot;
        order = placed.order;
        history.push({ status: 'placed', at: placedAt.toISOString() });
      }
    }

    const laterAt = new Date(
      Math.min(placedAt.getTime() + 3 * HOUR, now.getTime()),
    );
    if (status === 'confirmed' && order.status === 'placed') {
      order = must(confirm(order)).order;
      history.push({ status: 'confirmed', at: laterAt.toISOString() });
    }
    if (status === 'cancelled') {
      const reason = pick([
        'Customer changed the order',
        'Wrong address',
        'Duplicate order',
      ]);
      const cancelled = must(cancel(order, reason, laterAt));
      const freed = cancelled.events[0]?.payload.slotId;
      const index = slots.findIndex((slot) => slot.id === freed);
      if (index >= 0) slots[index] = releaseSlot(slots[index] as DeliverySlot);
      order = cancelled.order;
      history.push({ status: 'cancelled', at: laterAt.toISOString() });
    }
    return { order, createdAt: createdAt.toISOString(), history };
  });

  return { customers, products, slots, orders, nextId: orders.length + 1 };
}
