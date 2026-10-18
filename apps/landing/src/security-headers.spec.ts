import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { securityHeaders } from './security-headers';

function run(): { headers: Map<string, string>; next: NextFunction } {
  const headers = new Map<string, string>();
  const res = {
    setHeader: (name: string, value: string) => headers.set(name, value),
  } as unknown as Response;
  const next = vi.fn();
  securityHeaders({} as Request, res, next);
  return { headers, next };
}

describe('securityHeaders', () => {
  it('forbids framing, plugins and a foreign base or form target', () => {
    const csp = run().headers.get('Content-Security-Policy') ?? '';
    const directives = csp.split(';').map((d) => d.trim());

    expect(directives).toEqual(
      expect.arrayContaining([
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ]),
    );
  });

  it('leaves scripts to the page, since it has inline ones', () => {
    const csp = run().headers.get('Content-Security-Policy') ?? '';

    expect(csp).not.toMatch(/(?:^|;)\s*(?:default-src|script-src)/);
  });

  it('sends the transport, sniffing, referrer and feature headers', () => {
    const { headers } = run();

    expect(Object.fromEntries(headers)).toMatchObject({
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('passes the request on', () => {
    expect(run().next).toHaveBeenCalledOnce();
  });
});
