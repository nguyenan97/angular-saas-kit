import { describe, expect, it } from 'vitest';

import { BOOKING_API, orderUrl } from './api';

describe('orderUrl', () => {
  it('builds the path of an order, and of an action on it', () => {
    expect(orderUrl('SO-0001')).toBe('/api/booking/orders/SO-0001');
    expect(orderUrl('SO-0001', 'place')).toBe(
      '/api/booking/orders/SO-0001/place',
    );
  });

  it('encodes the id, so it stays one path segment', () => {
    expect(orderUrl('a/b c')).toBe('/api/booking/orders/a%2Fb%20c');
  });

  it('matches the route patterns the backend serves', () => {
    expect(BOOKING_API.order.replace(':id', 'SO-1')).toBe(orderUrl('SO-1'));
    expect(BOOKING_API.cancel.replace(':id', 'SO-1')).toBe(
      orderUrl('SO-1', 'cancel'),
    );
  });
});
