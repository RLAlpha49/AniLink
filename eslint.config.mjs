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
    // Underscore-prefixed parameters mark intentionally-unused mock signatures
    // (test doubles that mirror a transport's arity without consuming every
    // argument); the prefix documents the intent at the declaration site.
    files: ['src/**/*.ts', '__tests__/**/*.ts', 'scripts/**/*.ts', 'lib/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
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
    files: ['src/**/*.ts', 'scripts/**/*.ts', 'docs-src/**/*.{js,mjs}'],
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      // Object access in `src` is type-checked (TypeScript strict mode), so
      // this rule is redundant there; new dynamic indexing must use
      // ValidateVariables.ts-style allowlists instead of raw object access.
      'security/detect-object-injection': 'off',
    },
  },
  {
    // Build-time codegen scripts traverse the repository with computed
    // paths and build regexes from identifiers parsed out of the repo's own
    // source, so the non-literal fs/regexp rules fire on their designed
    // behavior. These scripts only run against the repository's own trusted
    // content (CI, docs generation), never on untrusted input, so those
    // rules are scoped off here; every other security rule still applies.
    // The sitemap generator shells out to a fixed `git log` with no
    // user-controlled arguments to derive lastmod dates, so the child-process
    // detector's warning is a false positive for the same reason.
    files: ['scripts/**/*.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-child-process': 'off',
    },
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'docs',
      'coverage',
      '/docs/*',
      'docs-src/.vitepress/cache',
    ],
  },
];
