import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import security from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

/**
 * Shared flat ESLint configuration for source, test, script, and docs-site files.
 *
 * Type-aware rules are limited to source TypeScript files; tests and scripts use
 * syntax-only parsing so fixtures do not require the source project service.
 */
export default [
  ...plugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
    },
    ...prettierConfig,
  },
  {
    files: ['__tests__/**/*.ts', 'scripts/**/*.ts', '*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    ...prettierConfig,
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'off',
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'docs',
      'coverage',
      '/docs/*',
    ],
  },
];