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
    },
  },

  // -- Module boundaries ----------------------------------------------------
  // Every project carries a `type:` and a `scope:` tag in its project.json.
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
