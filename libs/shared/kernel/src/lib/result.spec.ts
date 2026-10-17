import { err, ok, type Result } from './result';

describe('Result', () => {
  it('wraps a value', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('wraps an error', () => {
    const result = err('nope');
    expect(result).toEqual({ ok: false, error: 'nope' });
  });

  it('narrows on ok', () => {
    const result: Result<string, number> = ok('a');
    if (result.ok) {
      expect(result.value.toUpperCase()).toBe('A');
    } else {
      throw new Error('expected ok');
    }
  });
});
