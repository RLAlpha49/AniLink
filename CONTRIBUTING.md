# Contributing to AniLink

Thank you for considering a contribution. This document explains how to set up the project and get a pull request merged.

## Project Overview

AniLink is a TypeScript wrapper for the AniList GraphQL API. The source lives in `src/`. The public entry point is `src/AniLink.ts`. Query and mutation operations live in `src/apis/anilist/`. Shared request handling lives in `src/base/`.

## Getting Started

1. Fork the repository and create your branch from `master`.
2. Install Node.js 20 or later and npm.
3. Run `npm install` to install dependencies.

## Development Workflow

| Command                    | What it does                                   |
| -------------------------- | ---------------------------------------------- |
| `npm run lint`             | Lints source, tests, and scripts with ESLint   |
| `npm run typecheck`        | Runs `tsc --noEmit`                            |
| `npm test`                 | Runs the unit tests with Vitest                |
| `npm run test:integration` | Runs the integration tests (needs the network) |
| `npm run format:check`     | Checks formatting with Prettier                |
| `npm run jsdoc:check`      | Validates the JSDoc contract                   |
| `npm run build`            | Builds `dist/`                                 |
| `npm run docs:generate`    | Generates the API docs into `docs/`            |

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run jsdoc:check`, `npm run format:check`, and `npm run build` before you push. CI runs the same gates on every pull request, and a pull request merges only when all checks pass.

## JSDoc Contract

`scripts/check-jsdoc.ts` enforces documentation rules on the public API surface. Every public operation, exported interface, class, type, and constant in `src/` needs a JSDoc block with `@param`, `@returns`, `@throws`, `@example`, and a `@see` link to the AniList API reference. Run `npm run jsdoc:check` after you touch public API code. The validator is the source of truth for the exact rules.

## Commit Messages

This project uses [semantic-release](https://semantic-release.org/) with conventional commits. The commit messages decide the release version:

| Commit message                          | Release |
| --------------------------------------- | ------- |
| `fix:`                                  | patch   |
| `feat:`                                 | minor   |
| `feat!:` or a `BREAKING CHANGE:` footer | major   |

Docs, style, refactor, and dependency commits also produce patch releases. Write the summary line in the imperative mood, for example `add pagination guard`.

## Pull Requests

1. Rebase your branch on `master` before you open the pull request.
2. Keep the pull request focused on one change.
3. Add or update tests for behavior changes. Tests live in `__tests__/`.
4. Make sure all CI checks pass. A maintainer reviews after CI is green.

## Reporting Issues

Open a GitHub issue for bugs and feature requests.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
