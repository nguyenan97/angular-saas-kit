/**
 * The Booking API's paths, as route patterns. The backend matches on these;
 * a client builds a concrete path with `orderUrl`.
 */
export const BOOKING_API = {
  orders: '/api/booking/orders',
  order: '/api/booking/orders/:id',
  place: '/api/booking/orders/:id/place',
  confirm: '/api/booking/orders/:id/confirm',
  cancel: '/api/booking/orders/:id/cancel',
  customers: '/api/booking/customers',
  products: '/api/booking/products',
  slots: '/api/booking/slots',
  overview: '/api/booking/overview',
} as const;

export type OrderAction = 'place' | 'confirm' | 'cancel';

/** The path of an order, or of an action on it, with the id encoded. */
export function orderUrl(id: string, action?: OrderAction): string {
  const path = `${BOOKING_API.orders}/${encodeURIComponent(id)}`;
  return action ? `${path}/${action}` : path;
}
