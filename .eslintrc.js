module.exports = {
    extends: 'standard-with-typescript',
    parserOptions: {
        project: './tsconfig.json'
    },
    rules: {
        '@typescript-eslint/consistent-type-definitions': 'off'
    },
    ignorePatterns: ['**/*.js'],
    overrides: [
        {
            extends: ['plugin:@typescript-eslint/disable-type-checked'],
            files: ['./**/*.ts']
        },
    ],
}