/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/kernel',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'shared-kernel',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      // Under `nx test` the @nx/vitest executor overrides this with
      // project.json's options.reportsDirectory (the same location); this
      // value only applies to a bare `vitest` run.
      reportsDirectory: '../../../coverage/libs/shared/kernel',
      provider: 'v8' as const,
      reporter: ['lcov', 'text-summary'],
    },
  },
}));
