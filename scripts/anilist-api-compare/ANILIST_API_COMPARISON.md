# AniList API comparison

This repository includes a development tool that compares AniLink's implemented AniList GraphQL operations with an AniList introspection schema.

It checks query and mutation coverage, operation fields, arguments, variables, response selections, and selected TypeScript contracts. The comparison works in both directions: it reports API operations that AniLink does not implement, and it reports package operations that are absent from the API schema. It also warns when a package operation is still present but deprecated. The reports identify API drift and operations that still need package support.

## Commands

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

## Terminal output

Each command prints progress and a result summary. A comparison prints the implemented-operation count, discrepancy count, status, and report paths. A schema update prints the snapshot path after the file is written.

The comparison writes:

- `artifacts/anilist-api-compare/report.md`
- `artifacts/anilist-api-compare/report.json`

The report summary includes separate counts for unimplemented, removed, and deprecated operations. Use `--live` when checking for changes that are not yet reflected in the committed schema snapshot.

## Exit codes

- `0`: no discrepancies or the schema snapshot was updated.
- `1`: actionable discrepancies were found.
- `2`: the comparison tool could not load, fetch, or parse its inputs.

## Maintenance workflow

GitHub Actions runs the snapshot comparison on pushes and pull requests. To investigate an AniList API update, run the workflow manually with its live option, review the generated reports, then update the snapshot with `npm run anilist:api:update-schema`.
