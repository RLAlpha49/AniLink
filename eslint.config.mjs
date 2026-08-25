import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import security from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

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
    files: ['src/**/*.ts', 'scripts/**/*.ts', '__tests__/**/*.ts', '*.ts'],
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: ['explorer-src/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        performance: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        self: 'readonly',
        globalThis: 'readonly',
        module: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // The explorer keeps ES5-style var declarations on purpose.
      'no-var': 'off',
      'prefer-const': 'off',
      'no-unused-vars': [
        'warn',
        {
          args: 'none',
          caughtErrors: 'none',
        },
      ],
    },
    ...prettierConfig,
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