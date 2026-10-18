import { money } from '@angular-saas-kit/shared-kernel';
import { describe, expect, it } from 'vitest';

import {
  ERROR_MESSAGE,
  failureMessage,
  formatMoney,
  formatSlot,
} from './format';

describe('the messages of a refusal', () => {
  it('gives every code its own sentence, never the code itself', () => {
    const messages = Object.entries(ERROR_MESSAGE);

    expect(messages.length).toBe(15);
    for (const [code, message] of messages) {
      expect(message).not.toContain(code);
      expect(message).toMatch(/\.$/);
    }
    expect(new Set(messages.map(([, m]) => m)).size).toBe(messages.length);
  });

  it('maps a business refusal to its message, and leaves a network failure to the Retry banner', () => {
    expect(
      failureMessage({ kind: 'business', code: 'slot-full', message: 'x' }),
    ).toBe('That delivery slot is full. Choose another one.');
    expect(failureMessage({ kind: 'network', status: 503 })).toBeNull();
    expect(failureMessage(null)).toBeNull();
  });
});

describe('formats', () => {
  it('shows money in its currency, minor units as the currency has them', () => {
    expect(formatMoney(money(540_000, 'VND'))).toBe('₫540,000');
    expect(formatMoney(money(1250, 'USD'))).toBe('$12.50');
  });

  it('names a slot by its day and window', () => {
    expect(formatSlot({ date: '2026-10-20', window: '08-12' })).toBe(
      'Tue, Oct 20, 08:00 to 12:00',
    );
  });
});
