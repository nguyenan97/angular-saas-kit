#!/usr/bin/env node
/**
 * Assembles the GitHub Pages site from the `pages` builds and checks it.
 *
 *   _site/         <- apps/landing    static, prerendered
 *   _site/demo/    <- apps/dashboard  single-page app, hash routing
 *   _site/docs/    <- docs            VitePress site
 *
 * Run through `npm run pages`, which builds all three first.
 *
 * The check exists because a wrong <base href> is the classic way for a Pages
 * deploy to go green and serve a blank page: every local file an index.html
 * points at has to exist where the browser will actually look for it.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');

/** Where the project site lives: https://<owner>.github.io/angular-saas-kit/ */
const SITE_BASE = '/angular-saas-kit/';

const parts = [
  {
    name: 'landing',
    from: 'dist/apps/landing/browser',
    to: '',
    base: SITE_BASE,
  },
  {
    name: 'dashboard',
    from: 'dist/apps/dashboard/browser',
    to: 'demo',
    base: `${SITE_BASE}demo/`,
  },
  {
    name: 'docs',
    from: 'docs/.vitepress/dist',
    to: 'docs',
    base: `${SITE_BASE}docs/`,
    // VitePress writes absolute paths under its `base` and emits no <base> tag.
    baseTag: false,
  },
];

const problems = [];

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });

for (const part of parts) {
  const source = join(root, part.from);
  if (!existsSync(source)) {
    console.error(
      `Missing ${part.from} - build "${part.name}" first (npm run pages does).`,
    );
    process.exit(1);
  }
  cpSync(source, join(site, part.to), { recursive: true });
}

/** Maps a URL path on the deployed site to the file it would be served from. */
function fileFor(urlPath) {
  const relative = urlPath.slice(SITE_BASE.length);
  const target = join(site, relative);
  // A directory URL is served from its index.html.
  return existsSync(target) && statSync(target).isDirectory()
    ? join(target, 'index.html')
    : target;
}

for (const part of parts) {
  const indexPath = join(site, part.to, 'index.html');
  const html = readFileSync(indexPath, 'utf8');

  if (part.baseTag !== false) {
    const base = /<base href="([^"]*)"/.exec(html)?.[1];
    if (base !== part.base) {
      problems.push(
        `${part.name}: <base href> is "${base}", expected "${part.base}"`,
      );
      continue;
    }
  }

  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(
    (m) => m[1],
  );
  for (const reference of references) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue; // absolute URL, mailto:, anchor
    const urlPath = new URL(reference, `http://site${part.base}`).pathname;
    if (!urlPath.startsWith(SITE_BASE)) {
      problems.push(
        `${part.name}: "${reference}" resolves outside ${SITE_BASE} (${urlPath})`,
      );
      continue;
    }
    if (!existsSync(fileFor(urlPath))) {
      problems.push(
        `${part.name}: "${reference}" -> ${urlPath} does not exist in _site`,
      );
    }
  }
}

if (!existsSync(join(site, '404.html'))) {
  problems.push('404.html is missing at the site root');
}

if (problems.length > 0) {
  console.error(
    `\n_site failed its checks:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
  );
  process.exit(1);
}

const urls = parts.map((p) => `${SITE_BASE}${p.to ? `${p.to}/` : ''}`);
console.log(
  `_site is ready and every local reference resolves: ${urls.join('  ')}`,
);
