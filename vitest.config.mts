/**
 * Vitest configuration for the unit suite.
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
      include: ['src/**', 'scripts/check-jsdoc.ts'],
      exclude: ['node_modules/**', 'dist/**', 'docs-src/**'],
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
