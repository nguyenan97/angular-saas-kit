import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import { describe, expect, it } from 'vitest';

import { ACCENTS, type Accent } from './theme.types';

/**
 * The kit says accessibility is a gate, and colour contrast is the part of it
 * that lives in the tokens. This reads tokens.css the way a browser applies
 * it - the base rules, then `.dark`, then the accent - and checks every pair
 * a component is allowed to combine, in both modes and with every accent.
 */

// See theme-init.spec.ts for why the path starts at workspaceRoot.
const css = readFileSync(
  join(workspaceRoot, 'libs', 'tokens', 'src', 'lib', 'styles', 'tokens.css'),
  'utf-8',
).replace(/\/\*[\s\S]*?\*\//g, '');

type Tokens = Record<string, string>;

const rules = css
  .split('}')
  .map((chunk) => chunk.split('{'))
  .filter((parts): parts is [string, string] => parts.length === 2)
  .map(([selectors, body]) => ({
    selectors: selectors.split(',').map((selector) => selector.trim()),
    declarations: Object.fromEntries(
      [...body.matchAll(/--([\w-]+):\s*oklch\(([^)]*)\)/g)].map((match) => [
        match[1],
        match[2],
      ]),
    ) as Tokens,
  }));

/** The declarations of every rule that lists `selector`, in source order. */
function declaredBy(selector: string): Tokens {
  return Object.assign(
    {},
    ...rules
      .filter((rule) => rule.selectors.includes(selector))
      .map((rule) => rule.declarations),
  );
}

function tokensFor(mode: 'light' | 'dark', accent: Accent): Tokens {
  const light = {
    ...declaredBy(':root'),
    ...declaredBy(`[data-accent='${accent}']`),
  };
  return mode === 'light'
    ? light
    : {
        ...light,
        ...declaredBy('.dark'),
        ...declaredBy(`.dark[data-accent='${accent}']`),
      };
}

/** OKLCH to linear sRGB. Components outside 0..1 mean out of gamut. */
function linearSrgb(l: number, c: number, h: number): number[] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

const inGamut = (rgb: number[]) =>
  rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * WCAG relative luminance of an opaque `L C H` value. A colour outside sRGB
 * is shown the way CSS Color 4 maps it: same lightness and hue, less chroma.
 */
function luminance(value: string): number {
  const [l = 0, c = 0, h = 0] = value.trim().split(/\s+/).map(Number);
  let chroma = c;
  if (!inGamut(linearSrgb(l, c, h))) {
    let low = 0;
    let high = c;
    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      if (inGamut(linearSrgb(l, mid, h))) {
        low = mid;
      } else {
        high = mid;
      }
    }
    chroma = low;
  }
  const [r = 0, g = 0, b = 0] = linearSrgb(l, chroma, h).map((v) =>
    Math.min(1, Math.max(0, v)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (x, y) => y - x,
  );
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

const STATUSES = ['primary', 'destructive', 'success', 'warning', 'info'];

/** Text and the surface it sits on: 4.5:1, WCAG 1.4.3. */
const TEXT: readonly (readonly [string, string])[] = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ...STATUSES.flatMap((status) => [
    // A filled badge or button...
    [`${status}-foreground`, status] as const,
    // ...and the colour as text, such as a delta or a link.
    [status, 'background'] as const,
    [status, 'card'] as const,
  ]),
];

/** What identifies a control or its focus: 3:1, WCAG 1.4.11. */
const NON_TEXT: readonly (readonly [string, string])[] = [
  ['ring', 'background'],
  ['ring', 'card'],
  ['input', 'background'],
  ['input', 'card'],
];

function failures(
  tokens: Tokens,
  pairs: readonly (readonly [string, string])[],
  minimum: number,
): string[] {
  return pairs.flatMap(([foreground, background]) => {
    const fg = tokens[foreground];
    const bg = tokens[background];
    if (!fg || !bg) {
      return [`${foreground} on ${background}: not declared`];
    }
    // A translucent colour's contrast depends on what is behind it, which a
    // token cannot know. Checked pairs must be opaque.
    if (fg.includes('/') || bg.includes('/')) {
      return [`${foreground} on ${background}: translucent, cannot be checked`];
    }
    const ratio = contrast(fg, bg);
    return ratio >= minimum
      ? []
      : [`${foreground} on ${background}: ${ratio.toFixed(2)}:1`];
  });
}

describe('token contrast', () => {
  describe.each(['light', 'dark'] as const)('in %s mode', (mode) => {
    it.each(ACCENTS)('gives text 4.5:1 with the %s accent', (accent) => {
      expect(failures(tokensFor(mode, accent), TEXT, 4.5)).toEqual([]);
    });

    it.each(ACCENTS)(
      'gives the focus ring and input borders 3:1 with the %s accent',
      (accent) => {
        expect(failures(tokensFor(mode, accent), NON_TEXT, 3)).toEqual([]);
      },
    );
  });

  it('reads the values a browser would apply', () => {
    // A guard for the parser: if it stopped seeing the accent or dark rules,
    // every case above could pass by comparing the wrong values.
    expect(tokensFor('light', 'orange')['primary']).not.toBe(
      tokensFor('light', 'blue')['primary'],
    );
    expect(tokensFor('dark', 'blue')['background']).not.toBe(
      tokensFor('light', 'blue')['background'],
    );
    expect(contrast('1 0 0', '0 0 0')).toBeCloseTo(21, 5);
  });
});
