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
      exclude: ['explorer-src/**', 'node_modules/**', 'dist/**'],
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
