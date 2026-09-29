<p align="center">
  <img src="docs-src/public/logo.png" alt="AniLink" width="256" />
</p>

<h1 align="center">AniLink</h1>

[![npm version](https://img.shields.io/npm/v/anilink-api-wrapper.svg)](https://www.npmjs.com/package/anilink-api-wrapper)
[![npm downloads](https://img.shields.io/npm/dm/anilink-api-wrapper.svg)](https://www.npmjs.com/package/anilink-api-wrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
[![CI](https://github.com/RLAlpha49/AniLink/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/RLAlpha49/AniLink/actions/workflows/ci.yml)
[![CodeQL](https://github.com/RLAlpha49/AniLink/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/RLAlpha49/AniLink/actions/workflows/codeql.yml)
[![Documentation](https://img.shields.io/website?url=https%3A%2F%2Fanilink.alpha49.com%2F&label=docs)](https://anilink.alpha49.com/)

A typed TypeScript wrapper for the [AniList GraphQL API](https://docs.anilist.co/) and the [MyAnimeList REST API](https://myanimelist.net/apiconfig/references/api/v2). One class exposes two isolated provider namespaces. Every operation with inputs takes a single typed params object plus an optional trailing options object. Normalized errors, retries, pacing, and caching work identically on both. Import the root package for both providers, or scope imports to one provider with the `anilink-api-wrapper/anilist` and `anilink-api-wrapper/mal` subpaths.

## Quickstart

```bash
npm install anilink-api-wrapper
```

Requires Node.js 22 or later. The package is ESM-only, so use `import` syntax, not CommonJS `require`.

```typescript
import { AniLink } from "anilink-api-wrapper";

// AniList (GraphQL) needs no token for public queries
const aniLink = new AniLink();
const anime = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });

// MyAnimeList (REST) has its own credential slot
const client = new AniLink({ mal: { accessToken: "mal-token" } });
const malAnime = await client.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture"] }
);
```

## What you can do

### AniList (`aniLink.anilist`)

- **Queries and mutations.** 25 typed queries (`user`, `media`, `character`, `staff`, `studio`, `review`, `thread`, and more) and 29 typed mutations covering list entries, activities, replies, reviews, threads, and favourites.
- **Page queries.** 18 paginated reads under `query.page` (`medias`, `characters`, `airingSchedules`, `notifications`, and more). Each returns its items plus `PageInfo`.
- **Custom documents.** `custom()` and `customPage()` send your own GraphQL documents with the same validation, transport, and caching as the built-in operations.
- **Pagination.** `paginate`, `paginatePages`, and `paginateChunks` walk multi-page results, stopping at the server-reported last page.
- **Data helpers.** `fuzzyDate` builds `FuzzyDateInput` objects for list-entry mutations, `fuzzyDateInt` builds the `YYYYMMDD` integers that query filters take, `flattenMediaListCollection` flattens list collections, `crossLink` builds AniList-to-MAL id maps from `idMal`, and `mapExternalIds` maps ids in either direction through [ARM](https://arm.haglund.dev/).
- **Watchers.** `watch.notifications` and `watch.activity` poll AniList and yield new items as async generators.

### MyAnimeList (`aniLink.mal`)

- **Reads.** `anime.get`, `manga.get`, `user.me`, `user.get`, `anime.search`, `manga.search`, `seasonal`, `anime.ranking`, `manga.ranking`, `suggestions`, `user.animeList`, `user.mangaList`, and the `forum.boards`, `forum.topics`, and `forum.topic` forum reads. The `fields` option selects the response shape.
- **Writes.** `updateMyListStatus` and `deleteFromList` on both `anime` and `manga`.
- **Pagination.** `paginate` and `paginatePages` walk the paginated list endpoints.

Both namespaces share one transport layer, which handles timeouts, retries, pacing, circuit breaking, hooks, automatic token refresh, and an opt-in response cache. Each provider slot has its own credentials and transport settings.

## Documentation

| Docs                        | Start here                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guides**                  | [Introduction](https://anilink.alpha49.com/introduction) · [Getting started](https://anilink.alpha49.com/getting-started) · [Provider configuration](https://anilink.alpha49.com/provider-configuration) · [Per-request options](https://anilink.alpha49.com/per-request-options) · [Error handling](https://anilink.alpha49.com/error-handling) · [Retries & resilience](https://anilink.alpha49.com/retries-and-resilience) · [Cancellation & timeouts](https://anilink.alpha49.com/cancellation-and-timeouts) · [Observability](https://anilink.alpha49.com/observability) · [Recipes](https://anilink.alpha49.com/recipes) · [TypeScript patterns](https://anilink.alpha49.com/typescript-patterns) · [Troubleshooting](https://anilink.alpha49.com/troubleshooting) · [Response cache](https://anilink.alpha49.com/response-cache)  |
| **AniList guides**          | [Authentication](https://anilink.alpha49.com/guides/anilist/authentication) · [Client configuration](https://anilink.alpha49.com/guides/anilist/configuration) · [Querying](https://anilink.alpha49.com/guides/anilist/querying) · [Page queries](https://anilink.alpha49.com/guides/anilist/page-queries) · [Pagination](https://anilink.alpha49.com/guides/anilist/pagination) · [Mutations](https://anilink.alpha49.com/guides/anilist/mutations) · [Custom queries](https://anilink.alpha49.com/guides/anilist/custom-queries) · [Field selection](https://anilink.alpha49.com/guides/anilist/field-selection) · [Helpers](https://anilink.alpha49.com/guides/anilist/helpers) · [Watchers](https://anilink.alpha49.com/guides/anilist/watchers) · [Complete examples](https://anilink.alpha49.com/guides/anilist/complete-examples) |
| **MAL guides**              | [Authentication](https://anilink.alpha49.com/guides/mal/authentication) · [Client configuration](https://anilink.alpha49.com/guides/mal/configuration) · [Operations](https://anilink.alpha49.com/guides/mal/operations) · [Pagination](https://anilink.alpha49.com/guides/mal/pagination) · [Complete examples](https://anilink.alpha49.com/guides/mal/complete-examples)                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Operation reference**     | [Overview](https://anilink.alpha49.com/operations/) · [AniList catalog](https://anilink.alpha49.com/operations/anilist) · [MAL catalog](https://anilink.alpha49.com/operations/mal)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **API reference (TypeDoc)** | [AniLink](https://anilink.alpha49.com/classes/AniLink.AniLink.html) class; the full generated reference is at the [docs root](https://anilink.alpha49.com/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Development

```bash
npm install               # install dependencies
npm run check             # typecheck, lint, tests, format, JSDoc, api-compare, build
npm run check:fast        # typecheck, lint, and tests only
npm run docs:generate     # TypeDoc + operation reference + guides site into docs/
npm run docs:dev          # serve the guides site locally
```

See the [contributing guide](CONTRIBUTING.md) for workflow details.

## Resources

- [Changelog](CHANGELOG.md) and [GitHub Releases](https://github.com/RLAlpha49/AniLink/releases)
- [Contributing guide](CONTRIBUTING.md)

## License

[MIT](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
