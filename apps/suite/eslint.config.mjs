import baseConfig from '../../eslint.config.mjs';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, {
  files: ['**/*.ts'],
  rules: {
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'ask', style: 'camelCase' },
    ],
    '@angular-eslint/component-selector': [
      'error',
      { type: 'element', prefix: 'ask', style: 'kebab-case' },
    ],
  },
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
