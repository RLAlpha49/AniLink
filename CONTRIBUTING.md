# Contributing to AniLink

Use this guide to set up the project and prepare a pull request.

## Project overview

AniLink is a typed TypeScript wrapper for the AniList GraphQL API and the MyAnimeList REST API. Source files are in `src/`, and `src/AniLink.ts` is the public entry point. AniList query operations are in `src/apis/graphql/anilist/query/`. Mutation operations are in `src/apis/graphql/anilist/mutation/`. MyAnimeList REST operations are in `src/apis/rest/mal/`. The shared transport, retry, pacing, circuit-breaker, and hook code is in `src/base/`.

## Getting started

1. Fork the repository and create your branch from `master`.
2. Install Node.js 22 or later and npm.
3. Run `npm install` to install dependencies.

### `.npmrc` settings

- Set `onnxruntime-node-install = skip` in `.npmrc`. The docs search-index embedder, `@huggingface/transformers`, depends on `onnxruntime-node`. Its install script downloads native binaries that the build does not use. This setting prevents that download. The package's bundled CPU bindings are enough for `npm run docs:search-index`.

## Development workflow

| Command                                  | What it does                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`                           | Lints source, tests, and scripts with ESLint                                                 |
| `npm run typecheck`                      | Runs `tsc --noEmit`                                                                          |
| `npm run typecheck:tests`                | Typechecks the test suites with `tsc --noEmit -p tsconfig.test.json`                         |
| `npm test`                               | Runs the unit tests with Vitest                                                              |
| `npm run test:integration`               | Runs the integration tests (needs the network)                                               |
| `npm run test:package`                   | Runs the packaged-distribution smoke test. CI runs it as a separate job                      |
| `npm run mutation:test`                  | Runs the StrykerJS mutation tests; CI runs them on a weekly schedule                         |
| `npm run format:check`                   | Checks formatting with Prettier                                                              |
| `npm run jsdoc:check`                    | Validates the JSDoc contract                                                                 |
| `npm run interfaces:generate -- --check` | Validates generated interfaces stay in sync with the AniList schema snapshot                 |
| `npm run anilist:api:compare`            | Compares package contracts against the AniList schema snapshot; CI runs it with `--strict`   |
| `npm run mal:api:compare`                | Compares the MAL response types against the MAL OpenAPI snapshot; CI runs it with `--strict` |
| `npm run mal:api:update-schema`          | Refreshes the committed MAL OpenAPI snapshot from MAL's reference page                       |
| `npm run build`                          | Builds `dist/`                                                                               |
| `npm run docs:generate`                  | Generates the API docs into `docs/`                                                          |

Run `npm run check` before you push. It runs the pull-request CI checks for source and test typechecking, lint, tests with coverage thresholds, formatting, JSDoc, facade and interface sync, strict API-drift comparisons for AniList and MyAnimeList, and the build. CI runs the packaged-distribution smoke test (`npm run test:package`) as a separate job. StrykerJS mutation tests run weekly (`npm run mutation:test`).

For a faster check before you push, run `npm run check:fast`. It runs source and test typechecking, lint, and unit tests without coverage. CI requires the full `npm run check` chain for pull requests.

### Patched dependencies

The repository applies one `patch-package` patch through the `postinstall` script: `patches/@stryker-mutator+vitest-runner+10.0.0.patch`. If the patch is missing from the repository checkout, `postinstall` exits with an error. Packaged consumer installs skip the patch because the tarball does not contain `package-lock.json` or a `patches/` directory. Restore the tracked patch file before running `npm install` in the repository.

The patch adapts `@stryker-mutator/vitest-runner` to Vitest 5. Vitest 5 matches `testNamePattern` against the full test-name chain, so `collectTestName` must join suite parts with `" > "`. Upstream's space-joined names caused the per-test filter to match zero tests, so Stryker reported every covered mutant as Survived. The patch also guards the debug log of the final Vitest config because some configs cannot be serialized.

Upstream tracks the fix in [stryker-js#6210](https://github.com/stryker-mutator/stryker-js/issues/6210). Pull requests [#6214](https://github.com/stryker-mutator/stryker-js/pull/6214) and [#6220](https://github.com/stryker-mutator/stryker-js/pull/6220) are open. Remove the patch after a release includes the fix. The patch file's header comment records these details.

The API-drift tooling in `lib/api-compare/` uses the `graphql` devDependency to parse AniList's introspection schema. Keep this dependency even though files in `src/` do not import it. The MAL contract extractor uses the TypeScript compiler API from the `typescript` devDependency. `tsc` uses the same dependency.

See [OWNERSHIP.md](OWNERSHIP.md) for the response-shape code-generation pipeline and its artifacts. The file also records the project's [design decisions](OWNERSHIP.md#design-decisions). These include an ESM-only distribution, `axios` as the only runtime dependency, hooks and correlation IDs instead of a telemetry SDK, and in-memory-only state.

## JSDoc contract

`scripts/check-jsdoc.ts` enforces documentation rules for a subset of the public API in `src/`. The validator checks the following:

- For each public operation property in `src/AniLink.ts`, add a JSDoc block. Include a `@param` tag for every parameter in its signature, plus `@returns`, a concrete `@example`, and a valid `@see` link to a page in `scripts/reference-pages.json`.
- Exported interfaces and classes in `src/apis/graphql/anilist/query` and `src/apis/graphql/anilist/mutation` need JSDoc and a valid `@see` tag. Mutation methods also need `@throws`. If a method has a `variables` parameter, document it with `@param variables`. Add `@returns` to async methods.
- Exported types and constants in `src/apis/graphql/anilist/types` need JSDoc and a valid `@see` tag.

The validator does not require `@throws` on query methods, JSDoc for non-exported helpers, or JSDoc for exports outside these directories. Run `npm run jsdoc:check` after you change public API code. The validator defines the exact requirements.

## Commit messages

This project uses [semantic-release](https://semantic-release.org/) with conventional commits. The commit messages decide the release version:

| Commit message                          | Release |
| --------------------------------------- | ------- |
| `fix:`                                  | patch   |
| `feat:`                                 | minor   |
| `feat!:` or a `BREAKING CHANGE:` footer | major   |

Docs, style, refactor, and dependency commits also produce patch releases. Write the summary line in the imperative mood, for example `add pagination guard`.

When the strict API-drift compare fails because AniList itself changed, see [Upstream compatibility](README.md#upstream-compatibility) in the README for how removals and deprecations map to release categories.

## Pull requests

1. Rebase your branch on `master` before you open the pull request.
2. Keep the pull request focused on one change.
3. Add or update tests for behavior changes. Tests live in `__tests__/`.
4. Confirm that all CI checks pass. A maintainer reviews the pull request after CI passes.

## Reporting issues

Open a GitHub issue for bugs and feature requests.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
