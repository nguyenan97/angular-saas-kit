import { money } from '@angular-saas-kit/shared-kernel';
import { describe, expect, it } from 'vitest';

import { formatMoney } from './money';

describe('formatMoney', () => {
  it('reads VND as whole dong and USD as cents', () => {
    expect(formatMoney(money(540_000, 'VND'))).toBe('₫540,000');
    expect(formatMoney(money(1250, 'USD'))).toBe('$12.50');
  });
});
