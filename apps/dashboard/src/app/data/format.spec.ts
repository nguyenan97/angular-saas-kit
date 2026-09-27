import { describe, expect, it } from 'vitest';

import {
  formatKpiChange,
  formatKpiValue,
  formatMoney,
  isGoodChange,
} from './format';
import type { Kpi } from './models';

const kpi = (overrides: Partial<Kpi>): Kpi => ({
  key: 'revenue',
  label: 'Revenue',
  value: 0,
  format: 'money',
  change: 0,
  better: 'up',
  ...overrides,
});

describe('format', () => {
  it('shows cents as dollars', () => {
    expect(formatMoney(4812050)).toBe('$48,120.50');
    expect(formatKpiValue(kpi({ value: 4812050 }))).toBe('$48,121');
  });

  it('shows a rate as a percentage, and its change in points', () => {
    const refunds = kpi({ format: 'percent', value: 0.024, change: -0.006 });

    expect(formatKpiValue(refunds)).toBe('2.4%');
    expect(formatKpiChange(refunds)).toBe('-0.6 pts');
  });

  it('signs a change, and leaves no change unsigned', () => {
    expect(formatKpiChange(kpi({ change: 0.124 }))).toBe('+12.4%');
    expect(formatKpiChange(kpi({ change: 0 }))).toBe('0.0%');
  });

  it('knows that fewer refunds is good news', () => {
    expect(isGoodChange(kpi({ change: 0.1, better: 'up' }))).toBe(true);
    expect(isGoodChange(kpi({ change: -0.1, better: 'up' }))).toBe(false);
    expect(isGoodChange(kpi({ change: -0.01, better: 'down' }))).toBe(true);
    expect(isGoodChange(kpi({ change: 0.01, better: 'down' }))).toBe(false);
  });
});
