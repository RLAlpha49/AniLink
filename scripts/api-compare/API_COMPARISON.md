# API comparison

This repository includes a development tool that compares AniLink's implemented API operations with the upstream provider contracts: the AniList GraphQL schema and the MyAnimeList (MAL) v2 OpenAPI document.

The CLI is provider-based. Every invocation selects a provider with `--provider` (required — there is no default):

```bash
npx tsx scripts/api-compare/cli.ts <command> --provider <name>
```

Adding a provider means adding an entry in `scripts/api-compare/providers.ts` (plus a schema snapshot at its `schemaPath`) — no changes to the CLI or comparison core are required. GraphQL providers additionally need their operations discoverable under `sourceRoot`; OpenAPI providers need endpoint mappings in `scripts/api-compare/rest-contracts.ts`.

## AniList (GraphQL, `--provider anilist`)

It checks query and mutation coverage, operation fields, arguments, variables, response selections, and selected TypeScript contracts. The comparison works in both directions: it reports API operations that AniLink does not implement, and it reports package operations that are absent from the API schema. It also warns when a package operation is still present but deprecated. The reports identify API drift and operations that still need package support.

### AniList commands

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

Unimplemented operations already present in the committed schema baseline are warnings and do not fail `--strict` mode. An operation absent from the baseline is reported as a `new-upstream-operation` error and fails strict comparisons until AniLink implements it or the team reviews and baselines it.

Operations that can never be wrapped belong in `IGNORED_UNIMPLEMENTED_OPERATIONS` (`lib/api-compare/compare.ts`) instead — such as `query.Like` (AniList only serves likes through the paged `Page.likes` field) — and are never reported at all.

## MyAnimeList (OpenAPI, `--provider mal`)

The MAL comparison checks the package's REST response and request types against MAL's published OpenAPI 3.0 document. It runs in both directions:

- **Forward:** for every mapped response interface, each declared field must exist on the endpoint's response schema with a compatible type, so upstream contract changes surface as CI failures instead of runtime surprises.
- **Reverse:** every endpoint in the spec must have a package mapping, so newly published upstream endpoints and unwrapped coverage gaps surface as warnings instead of being silently missed. Unimplemented endpoints do not fail strict comparisons.
- **Request parameters:** the comparison checks mapped query and path parameter names and types, verifies required parameters against the extracted `Mal*Params` interfaces, and reports unmapped properties in those interfaces.
- **Request bodies:** list-status bodies are checked for field names, types, required fields, and the `application/x-www-form-urlencoded` content type used by AniLink.

MAL does not publish a standalone spec URL; the OpenAPI document is embedded inline in the [API v2 reference page](https://myanimelist.net/apiconfig/references/api/v2). The tool extracts it from that page for `--live` runs and `update-schema` — the page's own JS bundle also mentions `"openapi"` in its schema definitions, so the extractor only accepts JSON objects whose first key is `"openapi"` and that parse as a document.

### MAL commands

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

The comparison covers response interfaces, operation parameter interfaces, and the form-encoded list-status payloads referenced by `MAL_ENDPOINT_MAPPINGS` in `scripts/api-compare/rest-contracts.ts`. `MalRequestOptions` remains excluded because it configures AniLink rather than one operation's request contract. The request map links TypeScript property names to the wire names declared by the spec.

Endpoints the package does not wrap yet are reported as unimplemented-endpoint warnings in every run — there is no ignore list, so a coverage gap can never silently disappear from the reports. Currently unwrapped:

| Endpoint                                                                | Reason                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /anime`, `GET /manga`                                              | `q` text-search list queries; no MAL text-search bridge yet |
| `GET /manga/ranking`                                                    | No wrapped counterpart yet; a feature request, not drift    |
| `GET /forum/boards`, `GET /forum/topics`, `GET /forum/topic/{topic_id}` | Forum domain the package does not target                    |

Adding a wrapped MAL endpoint means adding a request contract and a `MAL_ENDPOINT_MAPPINGS` entry. Map its operation parameter interface through `paramsTypeName` and each source property through `sourceProperty`. Endpoints with a response contract also map that interface through `typeName`. Void-returning endpoints omit `typeName` but still fail comparison if the mapped endpoint disappears from the spec.

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
