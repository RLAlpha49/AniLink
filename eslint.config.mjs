import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
  ...plugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {},
    ...prettierConfig,
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