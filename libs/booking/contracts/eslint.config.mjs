import baseConfig, { domainPurity } from '../../../eslint.config.mjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(...baseConfig, domainPurity, {
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
