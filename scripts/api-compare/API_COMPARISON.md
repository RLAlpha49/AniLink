# API comparison

This repository includes a development tool that compares AniLink's implemented API operations with the upstream provider contracts: the AniList GraphQL schema and the MyAnimeList (MAL) v2 OpenAPI document.

The CLI is provider-based. Every invocation selects a provider with `--provider` (required — there is no default):

```bash
npx tsx scripts/api-compare/cli.ts <command> --provider <name>
```

Adding a provider means adding an entry in `scripts/api-compare/providers.ts` (plus a schema snapshot at its `schemaPath`) — no changes to the CLI or comparison core are required. GraphQL providers additionally need their operations discoverable under `sourceRoot`; OpenAPI providers need endpoint mappings in `scripts/api-compare/rest-contracts.ts`.

## AniList (GraphQL, `--provider anilist`)

It checks query and mutation coverage, operation fields, arguments, variables, response selections, and selected TypeScript contracts. The comparison works in both directions: it reports API operations that AniLink does not implement, and it reports package operations that are absent from the API schema. It also warns when a package operation is still present but deprecated. The reports identify API drift and operations that still need package support.

### Commands

Run the deterministic comparison against the committed schema snapshot:

```bash
npm run anilist:api:compare
```

Fetch the current AniList schema and compare against it without changing the snapshot:

```bash
npm run anilist:api:compare -- --live
```

Update the committed schema snapshot after reviewing an AniList API change:

```bash
npm run anilist:api:update-schema
```

### Unimplemented operations

Unimplemented operations are warnings and never affect the exit status — not even in `--strict` mode. While operations are being wrapped one at a time, their absence is expected work-in-progress, not a defect; the warnings stay visible in the output and reports so coverage gaps remain discoverable, but only real contract drift (missing fields, wrong types, removed operations) fails the build.

Operations that can never be wrapped belong in `IGNORED_UNIMPLEMENTED_OPERATIONS` (`lib/api-compare/compare.ts`) instead — such as `query.Like` (AniList only serves likes through the paged `Page.likes` field) — and are never reported at all.

## MyAnimeList (OpenAPI, `--provider mal`)

The MAL comparison checks the package's handwritten REST response types (`src/apis/rest/mal/types.ts`) against MAL's published OpenAPI 3.0 document. It runs in both directions:

- **Forward:** for every mapped response interface, each declared field must exist on the endpoint's response schema with a compatible type, so upstream contract changes surface as CI failures instead of runtime surprises.
- **Reverse:** every endpoint in the spec must be mapped by a package type or listed in `MAL_IGNORED_ENDPOINTS` with a dated `review: YYYY-Qn` note, so newly published upstream endpoints surface as warnings instead of being silently missed. Unimplemented endpoints are warnings and never affect the exit status — not even in `--strict` mode.

MAL does not publish a standalone spec URL; the OpenAPI document is embedded inline in the [API v2 reference page](https://myanimelist.net/apiconfig/references/api/v2). The tool extracts it from that page for `--live` runs and `update-schema` — the page's own JS bundle also mentions `"openapi"` in its schema definitions, so the extractor only accepts JSON objects whose first key is `"openapi"` and that parse as a document.

### Commands

Run the deterministic comparison against the committed OpenAPI snapshot:

```bash
npm run mal:api:compare
```

Fetch the current MAL OpenAPI document and compare against it without changing the snapshot:

```bash
npm run mal:api:compare -- --live
```

Update the committed OpenAPI snapshot after reviewing a MAL API change:

```bash
npm run mal:api:update-schema
```

### Scope

The comparison covers the response interfaces mapped in `scripts/api-compare/rest-contracts.ts` (`MAL_ENDPOINT_MAPPINGS`). Request-shape interfaces (`MalRequestOptions` and its option subclasses, the form-encoded list-status update payloads) are excluded: the spec declares request bodies inline per-operation rather than as named components, and the integration suite exercises them live.

Currently unwrapped endpoints and why:

| Endpoint                                                                | Reason                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /anime`, `GET /manga`                                              | `q` text-search list queries; no MAL text-search bridge yet |
| `GET /manga/ranking`                                                    | No wrapped counterpart yet; a feature request, not drift    |
| `GET /forum/boards`, `GET /forum/topics`, `GET /forum/topic/{topic_id}` | Forum domain the package does not target                    |

Adding a wrapped MAL endpoint means adding its response interface to `MAL_ENDPOINT_MAPPINGS` (and removing any ignore entry it replaces).

## Shared behavior

### Terminal output

Each command prints progress and a result summary. A comparison prints the implemented-operation or verified-type and endpoint counts, discrepancy count, status, and report paths. A schema update prints the snapshot path after the file is written.

The AniList comparison writes:

- `artifacts/anilist-api-compare/report.md`
- `artifacts/anilist-api-compare/report.json`

The MAL comparison writes:

- `artifacts/mal-api-compare/report.md`
- `artifacts/mal-api-compare/report.json`

### Exit codes

- `0`: no discrepancies or the schema snapshot was updated.
- `1`: actionable discrepancies were found.
- `2`: the comparison tool could not load, fetch, or parse its inputs (including a missing `--provider` flag).

## Maintenance workflow

CI runs both snapshot comparisons (`--strict`) on every push and pull request, so package-vs-snapshot drift fails the build immediately. A separate scheduled workflow ("Live API drift check") compares against both providers' live contracts every Monday and can also be triggered manually from the Actions tab to investigate an upstream API update: review the generated reports, then update the snapshots with `npm run anilist:api:update-schema` and `npm run mal:api:update-schema`.
