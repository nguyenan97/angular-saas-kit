import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

/**
 * Workspace-wide lint rules.
 *
 * Individual projects extend this and add only their own selector prefix, so
 * a rule change here reaches every app and library at once.
 */
/**
 * Domain purity (ADR 0021). Domain libraries (the shared kernel and each
 * context's `domain`) are plain TypeScript, so they may not import Angular or
 * RxJS. The tag rule limits which projects they depend on; this limits packages.
 *
 * It is exported rather than scoped here with `files`: ESLint resolves a
 * `files` glob against the config file of the project being linted, so a
 * `libs/...` path in this file never matches. Each domain library's own
 * eslint.config.mjs adds it.
 */
export const domainPurity = {
  files: ['**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@angular/*', 'rxjs', 'rxjs/*'],
            message:
              'The domain layer is plain TypeScript: no Angular, no RxJS.',
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/.nx',
      '**/coverage',
      '**/test-output',
      '**/.angular',
    ],
  },

  // -- TypeScript -----------------------------------------------------------
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Unused values are almost always a leftover from a refactor. Allow the
      // `_` prefix as the explicit "yes, I meant to ignore this" escape hatch.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // A type-only import that is emitted as a value import can drag a whole
      // module into the bundle for nothing.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // Signals-first (ADR 0003, 0022): inputs, outputs and queries are signal
      // functions. Opting out of OnPush is already an error through
      // tsRecommended.
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
    },
  },

  // -- Module boundaries ----------------------------------------------------
  // Every project carries a `type:` and a `scope:` tag in its project.json, and
  // bounded-context libraries a `layer:` tag too (ADR 0021).
  // These constraints turn the tags into rules, so a wrong import fails lint
  // instead of waiting for a reviewer to notice it.
  {
    files: ['**/*.ts'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          // A buildable library (tokens, ui) may depend only on other
          // buildable ones, or its package could not be built on its own.
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Apps use libraries. Nothing imports an app.
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:lib'] },
            { sourceTag: 'type:lib', onlyDependOnLibsWithTags: ['type:lib'] },
            // Browser tests drive an app through the browser; in code they may
            // use libraries (a token name, a test helper), never an app.
            { sourceTag: 'type:e2e', onlyDependOnLibsWithTags: ['type:lib'] },
            // Shared code knows nothing about the apps that use it.
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:dashboard',
              onlyDependOnLibsWithTags: ['scope:dashboard', 'scope:shared'],
            },
            {
              sourceTag: 'scope:landing',
              onlyDependOnLibsWithTags: ['scope:landing', 'scope:shared'],
            },
            // A bounded context's domain layer depends only on other domain
            // code (its own and the shared kernel): no data access, no UI.
            {
              sourceTag: 'layer:domain',
              onlyDependOnLibsWithTags: ['layer:domain'],
            },
            // Contracts publish what other contexts may use, built on the
            // domain's value types only.
            {
              sourceTag: 'layer:contracts',
              onlyDependOnLibsWithTags: ['layer:domain'],
            },
            // Data access talks HTTP: it sees the domain, the contracts and
            // shared libraries (the mock API), never a feature.
            {
              sourceTag: 'layer:data-access',
              onlyDependOnLibsWithTags: [
                'layer:domain',
                'layer:contracts',
                'scope:shared',
              ],
            },
            // A business context sees itself and shared code. Other contexts
            // reach it only through its contracts (added with SCM).
            {
              sourceTag: 'scope:booking',
              onlyDependOnLibsWithTags: ['scope:booking', 'scope:shared'],
            },
          ],
        },
      ],
    },
  },

  // -- Angular templates ----------------------------------------------------
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Accessibility is a selling point of this kit, so template a11y
      // findings are errors rather than warnings.
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/valid-aria': 'error',
    },
  },
);
