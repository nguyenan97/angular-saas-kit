import js from '@eslint/js';
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
