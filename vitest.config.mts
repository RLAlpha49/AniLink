/**
 * Vitest configuration for the unit suite.
 *
 * Runs unit tests outside `__tests__/integration` and collects V8 coverage
 * for `src` only — `scripts/` is dev tooling (including the token CLIs), not
 * library code, so it is excluded from coverage — while loading the shared
 * network-blocking test setup.
 */
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/integration/**'],
    setupFiles: ['./__tests__/setup.ts'],
    testTimeout: 5000,
    fsModuleCache: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['node_modules/**', 'dist/**', 'docs-src/**', 'scripts/**'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  }
})
