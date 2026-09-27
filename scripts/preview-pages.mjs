#!/usr/bin/env node
/**
 * Serves `_site` the way GitHub Pages serves a project site, so the demo can be
 * reviewed locally before it is deployed:
 *
 *   npm run pages && npm run pages:preview
 *   -> http://localhost:8123/angular-saas-kit/
 *
 * It mirrors the parts of Pages that bite: everything lives under the
 * repository path, a directory URL is served from its index.html, and anything
 * else gets 404.html with a real 404 status.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '_site');
const base = '/angular-saas-kit/';
const port = Number(process.env['PORT'] ?? 8123);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(root)) {
  console.error('No _site folder - run `npm run pages` first.');
  process.exit(1);
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = null;

  if (url.startsWith(base)) {
    let candidate = join(root, url.slice(base.length));
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      // Pages redirects "/demo" to "/demo/" before serving the index.
      if (!url.endsWith('/')) {
        res.writeHead(301, { Location: `${url}/` });
        res.end();
        return;
      }
      candidate = join(candidate, 'index.html');
    }
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      file = candidate;
    }
  }

  if (file) {
    res.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': types['.html'] });
  createReadStream(join(root, '404.html')).pipe(res);
}).listen(port, () => {
  console.log(`Pages preview: http://localhost:${port}${base}`);
  console.log(`Dashboard demo: http://localhost:${port}${base}demo/`);
});
