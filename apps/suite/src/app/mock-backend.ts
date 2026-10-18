import type { HttpInterceptorFn } from '@angular/common/http';
import { InMemoryEventBus } from '@angular-saas-kit/shared-kernel';
import type { BookingEvent } from '@angular-saas-kit/booking-domain';
import {
  bookingMockRoutes,
  createBookingDataset,
} from '@angular-saas-kit/booking-data-access/mock';
import {
  mockApiInterceptor,
  registerMockRoutes,
} from '@angular-saas-kit/mock-api';

import { activityLog } from './mock/activity';

/**
 * Where `/api` is answered in this build: from memory, by the Booking domain
 * behind the mock routes, with one event bus for the whole suite.
 *
 * Used in development and by the demo on GitHub Pages. The production build
 * replaces this file with `mock-backend.production.ts` (`fileReplacements` in
 * project.json), so neither the mock nor its data ships there.
 */
const data = createBookingDataset(new Date());
const bus = new InMemoryEventBus<BookingEvent>();
const activity = activityLog(bus, data);

registerMockRoutes(
  ...bookingMockRoutes(data, {
    now: () => new Date(),
    publish: (event) => bus.publish(event),
  }),
  activity.route,
);

export const backendInterceptors: readonly HttpInterceptorFn[] = [
  mockApiInterceptor,
];
