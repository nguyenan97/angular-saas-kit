#!/usr/bin/env node
/**
 * Checks that each built package can be installed and used on its own.
 *
 * `nx build tokens ui` writes the packages to dist/libs. What a consumer
 * receives has to be complete, and it once was not, silently: the built `ui`
 * imported three packages its manifest did not declare, and the built `tokens`
 * shipped none of its stylesheets. For every package this checks that
 *
 *   - every package its code and its stylesheets import is declared in the
 *     manifest (dependencies, peerDependencies or optionalDependencies);
 *   - every file the manifest points at (`exports`, `module`, `typings`)
 *     exists, and so does every file a shipped stylesheet reaches with a
 *     relative @import or @source;
 *   - there is a LICENSE, and `npm pack` would include every file above.
 *
 * It looks at what was built, so run it after `nx build`. With nothing built
 * there is nothing to check, and it says so.
 *
 *   node scripts/check-packages.mjs
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const libs = join(root, 'dist', 'libs');

const posix = (path) => path.split(sep).join('/');

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path));
    else found.push(path);
  }
  return found;
}

const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// `from 'x'`, `import('x')` and `import 'x'`.
const JS_REFERENCE =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\1/g;
// `@import 'x'` and `@source 'x'`.
const CSS_REFERENCE = /@(import|source)\s+(?:url\(\s*)?(['"])([^'"\n]+)\2/g;

const isRelative = (specifier) => /^\.{1,2}(?:\/|$)/.test(specifier);
const isUrl = (specifier) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(specifier);
const isBuiltin = (name) =>
  name.startsWith('node:') || builtinModules.includes(name);

function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function check(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);
  const rel = (path) => posix(relative(dir, path));
  const problems = new Set();
  /** Files the package promises: they must exist and be packed. */
  const promised = new Set();
  const files = walk(dir);

  const requireDeclared = (name, where) => {
    if (name === manifest.name || isBuiltin(name) || declared.has(name)) return;
    problems.add(
      `${where} needs "${name}", which package.json does not declare`,
    );
  };

  for (const file of files.filter((f) => /\.(?:mjs|cjs|js)$/.test(f))) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const match of code.matchAll(JS_REFERENCE)) {
      const specifier = match[2];
      if (isRelative(specifier) || specifier.startsWith('/')) continue;
      requireDeclared(packageName(specifier), rel(file));
    }
  }

  for (const file of files.filter((f) => f.endsWith('.css'))) {
    const css = stripComments(readFileSync(file, 'utf8'));
    for (const match of css.matchAll(CSS_REFERENCE)) {
      const [, kind, , specifier] = match;
      if (isRelative(specifier)) {
        const target = resolve(dirname(file), specifier);
        if (!existsSync(target)) {
          problems.add(
            `${rel(file)}: @${kind} '${specifier}' is not in the package`,
          );
        } else if (statSync(target).isFile()) {
          promised.add(target);
        }
      } else if (kind === 'import' && !isUrl(specifier)) {
        requireDeclared(packageName(specifier), rel(file));
      }
    }
  }

  const targets = [];
  const collect = (value) => {
    if (typeof value === 'string') targets.push(value);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(collect);
  };
  collect(manifest.exports);
  for (const key of ['module', 'main', 'typings', 'types']) {
    if (typeof manifest[key] === 'string') targets.push(manifest[key]);
  }
  for (const target of targets.filter((t) => !t.includes('*'))) {
    const path = resolve(dir, target);
    if (existsSync(path)) promised.add(path);
    else
      problems.add(
        `package.json points at "${target}", which is not in the package`,
      );
  }

  if (!existsSync(join(dir, 'LICENSE'))) {
    problems.add('there is no LICENSE file');
  }

  try {
    const out = execSync('npm pack --dry-run --json --ignore-scripts', {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const packed = new Set(JSON.parse(out)[0].files.map((f) => f.path));
    for (const file of promised) {
      if (!packed.has(rel(file))) {
        problems.add(`npm pack would leave out ${rel(file)}`);
      }
    }
  } catch (error) {
    problems.add(
      `npm pack --dry-run failed: ${String(error.message).split('\n')[0]}`,
    );
  }

  return {
    name: manifest.name,
    problems: [...problems],
    promised: promised.size,
  };
}

if (!existsSync(libs)) {
  console.log('No built packages in dist/libs, so there is nothing to check.');
  process.exit(0);
}

const results = readdirSync(libs, { withFileTypes: true })
  .filter(
    (d) => d.isDirectory() && existsSync(join(libs, d.name, 'package.json')),
  )
  .map((d) => check(join(libs, d.name)));

if (results.length === 0) {
  console.log('No built packages in dist/libs, so there is nothing to check.');
  process.exit(0);
}

const failed = results.filter((r) => r.problems.length > 0);
for (const { name, problems } of failed) {
  console.error(`\n${name} is not ready to publish:`);
  for (const problem of problems) console.error(`  - ${problem}`);
}
if (failed.length > 0) {
  console.error(
    '\nFix libs/<name>/package.json, ng-package.json or the shipped files, then rebuild.',
  );
  process.exit(1);
}

for (const { name, promised } of results) {
  console.log(
    `${name}: imports declared, ${promised} promised files exist and would be packed`,
  );
}
