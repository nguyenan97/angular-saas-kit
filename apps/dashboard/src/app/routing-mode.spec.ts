import { describe, expect, it } from 'vitest';

import { routerFeatures as standalone } from './routing-mode';
import { routerFeatures as pages } from './routing-mode.pages';

describe('routing mode', () => {
  it('keeps path-based URLs by default', () => {
    expect(standalone).toEqual([]);
  });

  it('switches to hash-based URLs for the Pages build', () => {
    // GitHub Pages cannot rewrite an unknown path to index.html, so a refresh
    // on a path-based deep link would 404.
    expect(pages).toHaveLength(1);
  });
});
