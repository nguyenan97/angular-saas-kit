import type {
  Customer,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductStatus,
} from '../data/models';

/**
 * The demo's data: invented people, products and orders.
 *
 * Generated from a fixed seed, so every load shows the same shop, and
 * relative to `today`, so the charts end today instead of on the day the data
 * was written. The names are made-up combinations and every email is on
 * example.com, a domain reserved for exactly this.
 */
export interface Dataset {
  readonly customers: Customer[];
  readonly products: Product[];
  readonly orders: Order[];
}

const DAY = 24 * 60 * 60 * 1000;

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

// prettier-ignore
const FIRST_NAMES = [
  'Amara', 'Bao', 'Camila', 'Dmitri', 'Elif', 'Farah', 'Goran', 'Hana',
  'Ikaika', 'Jonas', 'Keiko', 'Lucia', 'Mateo', 'Nadia', 'Omar', 'Priya',
  'Quinn', 'Rafael', 'Sana', 'Tomas', 'Uma', 'Viktor', 'Wen', 'Yara',
  'Zoltan', 'Ines', 'Kofi', 'Mira',
];

// prettier-ignore
const LAST_NAMES = [
  'Okafor', 'Tran', 'Silva', 'Petrov', 'Yilmaz', 'Haddad', 'Kovac', 'Sato',
  'Kahale', 'Berg', 'Tanaka', 'Moreno', 'Rossi', 'Karimi', 'Farouk', 'Iyer',
  'Walsh', 'Duarte', 'Malik', 'Ortega', 'Das', 'Novak', 'Liang', 'Costa',
  'Varga', 'Mensah', 'Lindqvist', 'Aziz',
];

// prettier-ignore
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Vietnam', 'Brazil', 'Japan',
  'India', 'France', 'Canada', 'Australia',
];

const PRODUCTS: readonly (readonly [string, string, number])[] = [
  ['Aurora Desk Lamp', 'Lighting', 4900],
  ['Cedar Standing Desk', 'Furniture', 42900],
  ['Drift Office Chair', 'Furniture', 31900],
  ['Echo Wireless Headset', 'Audio', 12900],
  ['Flux USB-C Hub', 'Accessories', 5900],
  ['Glide Mouse', 'Accessories', 3900],
  ['Halo Monitor Arm', 'Accessories', 8900],
  ['Ion Mechanical Keyboard', 'Accessories', 14900],
  ['Juniper Plant Pot', 'Decor', 2900],
  ['Kite Laptop Stand', 'Accessories', 4500],
  ['Lumen 27-inch Monitor', 'Displays', 34900],
  ['Mesa Cable Tray', 'Accessories', 1900],
];

const pad = (value: number, width: number) =>
  String(value).padStart(width, '0');

/** UTC midnight of the day `date` falls on, so a day is the same everywhere. */
export function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function createDataset(today: Date, seed = 20260927): Dataset {
  const random = generator(seed);
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)] as T;
  const between = (min: number, max: number) =>
    min + Math.floor(random() * (max - min + 1));
  const end = startOfDay(today).getTime();

  const products: Product[] = PRODUCTS.map(
    ([name, category, priceCents], i) => {
      const status: ProductStatus =
        i === 8 ? 'draft' : i === 11 ? 'archived' : 'active';
      return {
        id: `PRD-${pad(i + 1, 3)}`,
        name,
        sku: `${name.slice(0, 3).toUpperCase()}-${pad(between(100, 999), 3)}`,
        category,
        priceCents,
        // A few run low or out, so the stock column has something to say.
        stock: i % 5 === 3 ? between(0, 4) : between(12, 140),
        status,
      };
    },
  );
  const forSale = products.filter((product) => product.status === 'active');

  const customers: Customer[] = FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length] as string;
    return {
      id: `CUS-${pad(i + 1, 3)}`,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      country: pick(COUNTRIES),
      joinedAt: new Date(end - between(95, 720) * DAY).toISOString(),
      orders: 0,
      spentCents: 0,
    };
  });

  // Ninety days of orders, oldest first, a few more on recent days.
  const orders: Order[] = [];
  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const count = between(0, 2) + (daysAgo < 30 ? between(0, 1) : 0);
    for (let n = 0; n < count; n++) {
      const customer = pick(customers);
      const lines: OrderLine[] = Array.from({ length: between(1, 3) }, () => {
        const product = pick(forSale);
        return {
          productId: product.id,
          product: product.name,
          quantity: between(1, 2),
          unitPriceCents: product.priceCents,
        };
      });
      const roll = random();
      const status: OrderStatus =
        daysAgo < 3 && roll < 0.5
          ? 'pending'
          : roll < 0.8
            ? 'paid'
            : roll < 0.9
              ? 'pending'
              : roll < 0.96
                ? 'refunded'
                : 'failed';

      orders.push({
        id: `ORD-${1001 + orders.length}`,
        customerId: customer.id,
        customer: customer.name,
        email: customer.email,
        placedAt: new Date(
          end - daysAgo * DAY + between(8, 21) * 60 * 60 * 1000,
        ).toISOString(),
        lines,
        items: lines.reduce((sum, line) => sum + line.quantity, 0),
        totalCents: lines.reduce(
          (sum, line) => sum + line.quantity * line.unitPriceCents,
          0,
        ),
        status,
      });
    }
  }

  // What each customer has ordered and paid for.
  const withTotals = customers.map((customer) => {
    const theirs = orders.filter((order) => order.customerId === customer.id);
    return {
      ...customer,
      orders: theirs.length,
      spentCents: theirs
        .filter((order) => order.status === 'paid')
        .reduce((sum, order) => sum + order.totalCents, 0),
    };
  });

  return { customers: withTotals, products, orders };
}
