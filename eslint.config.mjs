import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

export default [
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
    ignores: [
      'node_modules',
      'dist',
      'docs',
      'coverage',
      '**/*.js',
      '/docs/*',
    ],
  },
];