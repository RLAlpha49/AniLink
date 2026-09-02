# Contributing to AniLink

Thank you for considering a contribution. This document explains how to set up the project and get a pull request merged.

## Project Overview

AniLink is a TypeScript wrapper for the AniList GraphQL API. The source lives in `src/`. The public entry point is `src/AniLink.ts`. Query and mutation operations live in `src/apis/anilist/`. Shared request handling lives in `src/base/`.

## Getting Started

1. Fork the repository and create your branch from `master`.
2. Install Node.js 22 or later and npm.
3. Run `npm install` to install dependencies.

## Development Workflow

| Command                                  | What it does                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                           | Lints source, tests, and scripts with ESLint                                                                      |
| `npm run typecheck`                      | Runs `tsc --noEmit`                                                                                               |
| `npm test`                               | Runs the unit tests with Vitest                                                                                   |
| `npm run test:integration`               | Runs the integration tests (needs the network)                                                                    |
| `npm run format:check`                   | Checks formatting with Prettier                                                                                   |
| `npm run jsdoc:check`                    | Validates the JSDoc contract                                                                                      |
| `npm run interfaces:generate -- --check` | Validates generated interfaces stay in sync with the AniList schema snapshot                                      |
| `npm run anilist:api:compare`            | Compares package contracts against the AniList schema snapshot; CI runs it with `--strict --ignore-unimplemented` |
| `npm run build`                          | Builds `dist/`                                                                                                    |
| `npm run docs:generate`                  | Generates the API docs into `docs/`                                                                               |

Run `npm run check` before you push. It chains every gate CI enforces on a pull request — typecheck, lint, coverage-thresholded tests, formatting, JSDoc, interface sync, the strict API-drift compare, and the build — so local and CI verdicts match one-for-one. A pull request merges only when all checks pass.

The `graphql` devDependency is used by the API-drift tooling (`lib/api-compare/`) to parse AniList's introspection schema; do not remove it even though `src/` never imports it.

## JSDoc Contract

`scripts/check-jsdoc.ts` enforces documentation rules on a narrow slice of the public API surface — not every exported symbol in `src/`. What the validator checks:

- **Public operations in `src/AniLink.ts`:** each operation property needs a JSDoc block with a `@param` tag for every parameter in its signature, plus `@returns`, a concrete `@example`, and a valid `@see` link to a page in `scripts/reference-pages.json`.
- **Exported interfaces and classes in `src/apis/graphql/anilist/query` and `src/apis/graphql/anilist/mutation`:** need JSDoc and a valid `@see` tag. Mutation methods additionally need `@throws`. A `variables` parameter needs `@param variables`; async methods need `@returns`.
- **Exported types and consts in `src/apis/graphql/anilist/types`:** need JSDoc and a valid `@see` tag.

Anything else — query-method `@throws`, non-exported helpers, exports outside these trees — is accepted but not enforced. Run `npm run jsdoc:check` after you touch public API code; the validator is the source of truth for the exact rules.

## Commit Messages

This project uses [semantic-release](https://semantic-release.org/) with conventional commits. The commit messages decide the release version:

| Commit message                          | Release |
| --------------------------------------- | ------- |
| `fix:`                                  | patch   |
| `feat:`                                 | minor   |
| `feat!:` or a `BREAKING CHANGE:` footer | major   |

Docs, style, refactor, and dependency commits also produce patch releases. Write the summary line in the imperative mood, for example `add pagination guard`.

When the strict API-drift compare fails because AniList itself changed, see [Upstream compatibility](README.md#upstream-compatibility) in the README for how removals and deprecations map to release categories.

## Pull Requests

1. Rebase your branch on `master` before you open the pull request.
2. Keep the pull request focused on one change.
3. Add or update tests for behavior changes. Tests live in `__tests__/`.
4. Make sure all CI checks pass. A maintainer reviews after CI is green.

## Reporting Issues

Open a GitHub issue for bugs and feature requests.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
