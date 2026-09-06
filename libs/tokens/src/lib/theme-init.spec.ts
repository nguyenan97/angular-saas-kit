import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { describe, expect, it } from 'vitest';

import { THEME_INIT_SCRIPT } from './theme-init';

/**
 * The anti-flash snippet lives in two places by necessity: as a TS export
 * (so the kit can be embedded elsewhere) and inlined in each index.html (so
 * it runs before first paint). Nothing stops those copies drifting apart
 * except this test - and a drifted copy is invisible in review but produces
 * a theme flash on every reload.
 */
describe('THEME_INIT_SCRIPT', () => {
  const apps = ['dashboard', 'landing'];

  /**
   * Prettier reformats index.html, so a byte-for-byte comparison would fail
   * on every commit for no reason. Collapsing whitespace still catches the
   * drift that matters - a renamed storage key, a dropped attribute, a
   * changed default - while letting the formatter do its job.
   */
  const normalise = (value: string): string =>
    value.replace(/\s+/g, ' ').trim();

  const readIndex = (app: string): string =>
    readFileSync(
      join(workspaceRoot, 'apps', app, 'src', 'index.html'),
      'utf-8',
    );

  it.each(apps)('is inlined in the %s index.html', (app) => {
    expect(normalise(readIndex(app))).toContain(normalise(THEME_INIT_SCRIPT));
  });

  it('runs before the closing head tag, so before first paint', () => {
    const html = readIndex('dashboard');
    const normalised = normalise(html);

    expect(normalised.indexOf(normalise(THEME_INIT_SCRIPT))).toBeLessThan(
      normalised.indexOf('</head>'),
    );
  });

  it.each(apps)('reads the same storage key in %s as the service', (app) => {
    // The one value that silently breaks persistence if the two copies drift.
    expect(readIndex(app)).toContain('ask.theme.v1');
  });

  it('never throws, whatever localStorage returns', () => {
    // Storage can be disabled, full, or hold corrupt JSON. Any of those
    // throwing in <head> would block the whole page from rendering.
    expect(THEME_INIT_SCRIPT).toContain('try{');
    expect(THEME_INIT_SCRIPT).toContain('catch(e){}');
  });
});
