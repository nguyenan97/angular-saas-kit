import {
  EnvironmentInjector,
  createEnvironmentInjector,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OrdersRepository } from '@angular-saas-kit/booking-data-access';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { pageRoutes } from './pages.routes';

describe('pageRoutes', () => {
  it('gives the pages a Booking repository that the mock backend answers', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const pages = createEnvironmentInjector(
      [...(pageRoutes[0]?.providers ?? [])],
      TestBed.inject(EnvironmentInjector),
    );

    const overview = await firstValueFrom(
      pages.get(OrdersRepository).overview(),
    );

    expect(overview.daily).toHaveLength(14);
    expect(overview.revenueThisWeek.currency).toBe('VND');
  });
});
