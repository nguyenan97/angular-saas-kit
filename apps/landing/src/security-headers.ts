import type { NextFunction, Request, Response } from 'express';

/**
 * The headers the landing's Node server sends with every response, files and
 * rendered pages alike.
 *
 * The Content-Security-Policy restricts what does not depend on the page's own
 * scripts: no plugins, no `<base>` pointing elsewhere, no framing by another
 * site, forms posting only here. It does not restrict `script-src` yet. The
 * page has two inline scripts (the theme snippet in `index.html` and Angular's
 * event-replay bootstrap), and Angular's `autoCsp` does not work with server
 * rendering; a script policy needs a nonce per request, which is planned.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy':
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  // A year, and not for subdomains: the kit does not know what else runs on
  // its owner's domain.
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  // The CSP's frame-ancestors, for browsers that predate it.
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
  next();
}
