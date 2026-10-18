import type { NextFunction, Request, Response } from 'express';

/**
 * The last middleware of the landing's Node server: what a request that failed
 * gets back.
 *
 * Express's own handler writes the error's stack into the page unless
 * `NODE_ENV` is `production`, and answers a malformed URL (`/%E0%A4%A`, which
 * Angular's router cannot decode) with `500`. This one never sends the error
 * itself, answers what the client got wrong with a `4xx`, and logs the rest
 * on the server, where the stack belongs.
 */
export function serverErrors(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Part of the answer is already on its way; only Express can end it.
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = statusOf(error);
  if (status >= 500) {
    console.error(error);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(status >= 500 ? 'Server error' : 'Bad request');
}

function statusOf(error: unknown): number {
  if (error instanceof URIError) {
    return 400;
  }
  // Express's body parsers and http-errors carry the status they mean.
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : 500;
}

/** A file the build named after its content: `chunk-C7wytggW.js`, `styles-W3ASZ43O.css`. */
const HASHED = /-[A-Za-z0-9_]{8}\.(?:js|mjs|css)$/;

/**
 * The `Cache-Control` of a static file. A hashed bundle never changes under
 * its name, so a browser keeps it for a year. Anything else, a page or the
 * favicon, keeps its name across deploys and is checked again each visit:
 * an `index.html` cached for a year would point at bundles the next deploy
 * deleted.
 */
export function cacheControlFor(path: string): string {
  const file = path.split(/[\\/]/).at(-1) ?? '';
  return HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache';
}
