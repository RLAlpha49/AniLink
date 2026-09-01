/**
 * Vitest configuration for the unit suite.
 *
 * Runs unit tests outside `__tests__/integration` and collects V8 coverage
 * for `src`, while loading the shared network-blocking test setup.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/integration/**'],
    setupFiles: ['./__tests__/setup.ts'],
    testTimeout: 5000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['node_modules/**', 'dist/**', 'docs-src/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  }
})
