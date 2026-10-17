#!/usr/bin/env node
/**
 * Checks that components take their colours from the semantic tokens.
 *
 * A component names a role (`bg-card`, `text-muted-foreground`), never a
 * colour (`bg-white`, `text-slate-500`, `bg-[#fff]`), and never overrides a
 * colour for dark mode (`dark:bg-...`): the tokens already change with the
 * theme, the accent and the contrast. A named colour breaks all three axes at
 * once, and nothing else would catch it (ADR 0004).
 *
 * It scans the `.ts` and `.html` under every project's `src/`, except
 * `libs/tokens` (which defines the colours), specs and stories.
 *
 *   node scripts/check-tokens.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'dist', 'coverage', 'test-output']);

const posix = (path) => path.split(sep).join('/');

const UTILITY =
  '(?:bg|text|border(?:-[xytrbl])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow)';
const PALETTE =
  '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
// A palette colour with a shade, white or black, or an arbitrary colour value.
const NAMED_COLOUR = new RegExp(
  `(?<![\\w-])(?:[\\w-]+:)*${UTILITY}-(?:${PALETTE}-\\d{2,3}|white|black|\\[(?:#|rgba?\\(|hsla?\\(|oklch\\(|color:))`,
  'g',
);
// Any colour utility behind `dark:`: the tokens already switch with the theme.
const DARK_OVERRIDE = new RegExp(
  `(?<![\\w-])(?:[\\w-]+:)*dark:(?:[\\w-]+:)*${UTILITY}-`,
  'g',
);

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path);
    else if (/\.(?:ts|html)$/.test(entry.name)) yield path;
  }
}

const scanned = (file) => {
  const path = posix(relative(root, file));
  return (
    path.includes('/src/') &&
    !path.startsWith('libs/tokens/') &&
    !/\.(?:spec|stories)\.ts$/.test(path)
  );
};

const problems = [];
let files = 0;
for (const top of ['apps', 'libs']) {
  for (const file of sourceFiles(join(root, top))) {
    if (!scanned(file)) continue;
    files++;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const pattern of [NAMED_COLOUR, DARK_OVERRIDE]) {
        for (const match of line.matchAll(pattern)) {
          problems.push(
            `${posix(relative(root, file))}:${index + 1}  ${match[0]}`,
          );
        }
      }
    });
  }
}

// A walk that silently finds nothing would pass every check.
if (files === 0) {
  console.error(
    'Scanned no source files - the check itself is probably out of date.',
  );
  process.exit(1);
}

if (problems.length > 0) {
  console.error(
    `\nComponents name a colour instead of a semantic token:\n${problems.map((p) => `  - ${p}`).join('\n')}\n\nUse the token for the role (bg-card, text-muted-foreground, border-border, text-destructive). If none fits, add one to libs/tokens in the same change.`,
  );
  process.exit(1);
}

console.log(`No named colours: ${files} files use semantic tokens only.`);
