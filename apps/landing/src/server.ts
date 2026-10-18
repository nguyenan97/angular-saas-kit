import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { securityHeaders } from './security-headers';
import { cacheControlFor, serverErrors } from './server-responses';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// No framework banner, and the security headers on every response, the static
// files included, so this runs before anything else.
app.disable('x-powered-by');
app.use(securityHeaders);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/*splat', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser: hashed bundles for a year, everything
 * else checked again on each visit (`cacheControlFor`).
 */
app.use(
  express.static(browserDistFolder, {
    cacheControl: false,
    index: false,
    redirect: false,
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', cacheControlFor(path));
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 *
 * No path argument - Express 5's stricter path-to-regexp parser rejects a
 * bare `/**` wildcard. Omitting the path matches every request, which is
 * exactly what a catch-all needs anyway.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/** Last: a failed request gets a status and a line of text, never a stack trace. */
app.use(serverErrors);

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
