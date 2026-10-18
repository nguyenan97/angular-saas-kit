/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/booking/data-access',
  plugins: [angular(), nxViteTsPaths()],
  test: {
    name: 'booking-data-access',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      // Under `nx test` the @nx/vitest executor overrides this with
      // project.json's options.reportsDirectory (the same location); this
      // value only applies to a bare `vitest` run.
      reportsDirectory: '../../../coverage/libs/booking/data-access',
      provider: 'v8' as const,
      reporter: ['lcov', 'text-summary'],
    },
  },
}));
