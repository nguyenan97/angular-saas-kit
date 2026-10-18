import type { Routes } from '@angular/router';

/**
 * The Booking order pages, for an app to mount under a path of its choice
 * (the suite uses `booking/orders`). The app provides `HttpClient` and, in
 * its development and demo builds, the mock backend.
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Orders',
    loadComponent: () =>
      import('./orders-list/orders-list').then((m) => m.OrdersList),
  },
  {
    path: 'new',
    title: 'New order',
    loadComponent: () =>
      import('./new-order/new-order').then((m) => m.NewOrder),
  },
  {
    path: ':id',
    title: 'Order',
    loadComponent: () =>
      import('./order-detail/order-detail').then((m) => m.OrderDetail),
  },
];
