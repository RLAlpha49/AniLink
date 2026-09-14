# Contributing to AniLink

Thank you for considering a contribution. This document explains how to set up the project and get a pull request merged.

## Project Overview

AniLink is a typed TypeScript wrapper for two providers: the AniList GraphQL API and the MyAnimeList REST API. The source lives in `src/`. The public entry point is `src/AniLink.ts`. AniList query operations live in `src/apis/graphql/anilist/query/` and mutations in `src/apis/graphql/anilist/mutation/`; the MyAnimeList REST surface lives in `src/apis/rest/mal/`. Shared request handling — the transport, retries, pacing, circuit breaker, and hooks — lives in `src/base/`.

## Getting Started

1. Fork the repository and create your branch from `master`.
2. Install Node.js 22 or later and npm.
3. Run `npm install` to install dependencies.

## Development Workflow

| Command                                  | What it does                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`                           | Lints source, tests, and scripts with ESLint                                                 |
| `npm run typecheck`                      | Runs `tsc --noEmit`                                                                          |
| `npm run typecheck:tests`                | Typechecks the test suites with `tsc --noEmit -p tsconfig.test.json`                         |
| `npm test`                               | Runs the unit tests with Vitest                                                              |
| `npm run test:integration`               | Runs the integration tests (needs the network)                                               |
| `npm run test:package`                   | Runs the packaged-dist smoke test; CI runs it as its own job                                 |
| `npm run mutation:test`                  | Runs the StrykerJS mutation tests; CI runs them on a weekly schedule                         |
| `npm run format:check`                   | Checks formatting with Prettier                                                              |
| `npm run jsdoc:check`                    | Validates the JSDoc contract                                                                 |
| `npm run interfaces:generate -- --check` | Validates generated interfaces stay in sync with the AniList schema snapshot                 |
| `npm run anilist:api:compare`            | Compares package contracts against the AniList schema snapshot; CI runs it with `--strict`   |
| `npm run mal:api:compare`                | Compares the MAL response types against the MAL OpenAPI snapshot; CI runs it with `--strict` |
| `npm run mal:api:update-schema`          | Refreshes the committed MAL OpenAPI snapshot from MAL's reference page                       |
| `npm run build`                          | Builds `dist/`                                                                               |
| `npm run docs:generate`                  | Generates the API docs into `docs/`                                                          |

Run `npm run check` before you push. It chains every gate CI enforces on a pull request — typecheck (source and tests), lint, coverage-thresholded tests, formatting, JSDoc, facade and interface sync, the strict API-drift compares (AniList and MyAnimeList), and the build — so local and CI verdicts match one-for-one. A pull request merges only when all checks pass. Two further CI gates run outside the chain: the packaged-dist smoke test (`npm run test:package`, its own CI job) and the weekly StrykerJS mutation run (`npm run mutation:test`).

The `graphql` devDependency is used by the API-drift tooling (`lib/api-compare/`) to parse AniList's introspection schema; do not remove it even though `src/` never imports it. The `typescript` compiler API used by the MAL contract extraction comes from the same `typescript` devDependency that powers `tsc`.

The response-shape codegen pipeline and its artifacts are documented in [OWNERSHIP.md](OWNERSHIP.md), which also records the project's [design decisions](OWNERSHIP.md#design-decisions) — ESM-only distribution, axios as the sole runtime dependency, hooks and correlation IDs over a telemetry SDK, and in-memory-only state.

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
