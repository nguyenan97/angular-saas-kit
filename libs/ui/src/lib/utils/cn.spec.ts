import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins plain classes', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('lets a later class win over an earlier conflicting one', () => {
    // This is the whole reason the helper exists: a consumer passing
    // `class="bg-red-500"` must beat a component's own `bg-primary`.
    expect(cn('bg-primary', 'bg-red-500')).toBe('bg-red-500');
    expect(cn('px-4', 'px-8')).toBe('px-8');
  });

  it('keeps utilities that only look like they conflict', () => {
    expect(cn('px-4', 'py-4')).toBe('px-4 py-4');
    expect(cn('border-border', 'border-2')).toBe('border-border border-2');
  });

  it('resolves conflicts per variant, not globally', () => {
    expect(cn('bg-white dark:bg-black', 'dark:bg-slate-900')).toBe(
      'bg-white dark:bg-slate-900',
    );
  });

  it('drops falsy values so conditionals stay inline', () => {
    const disabled = false;
    expect(cn('btn', disabled && 'opacity-50', null, undefined, '')).toBe(
      'btn',
    );
  });

  it('accepts arrays and objects', () => {
    expect(cn(['px-4', 'py-2'], { 'text-primary': true, hidden: false })).toBe(
      'px-4 py-2 text-primary',
    );
  });

  it('returns an empty string for no input', () => {
    expect(cn()).toBe('');
  });
});
