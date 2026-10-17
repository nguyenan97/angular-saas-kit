/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/booking/domain',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'booking-domain',
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
      reportsDirectory: '../../../coverage/libs/booking/domain',
      provider: 'v8' as const,
      reporter: ['lcov', 'text-summary'],
      // A ratchet (CONSTRAINTS.md): the domain is pure and tested at its
      // functions, so coverage stays near full. Raise these, never lower them.
      thresholds: { lines: 98, branches: 95, functions: 100 },
    },
  },
}));
