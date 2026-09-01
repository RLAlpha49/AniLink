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

A typed TypeScript wrapper for the [AniList GraphQL API](https://docs.anilist.co/) and the [MyAnimeList REST API](https://myanimelist.net/apiconfig/references/api/v2). One class, two isolated provider surfaces, normalized errors, retries, and a generated operation reference.

## Quickstart

```bash
npm install anilink-api-wrapper
```

```typescript
import { AniLink } from "anilink-api-wrapper";

// AniList (GraphQL) — public queries need no token
const aniLink = new AniLink();
const anime = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });

// MyAnimeList (REST) — isolated credential slot
const client = new AniLink({ mal: { accessToken: "mal-token" } });
const malAnime = await client.mal.anime.get(21, { fields: ["id", "title", "main_picture"] });
```

## What you can do

| Provider | Namespace | Capabilities |
| --- | --- | --- |
| **AniList** | `aniLink.anilist` | Queries, page queries, mutations, pagination helpers, `custom()`, data helpers |
| **MyAnimeList** | `aniLink.mal` | `anime.get` and `user.me` REST reads with field selection |

Both surfaces share one transport layer (timeouts, retries, pacing, circuit breaker, hooks) while keeping credentials and transport settings isolated per provider slot.

## Documentation

| Surface | Start here |
| --- | --- |
| **Guides** | [Introduction](https://anilink.alpha49.com/introduction) · [Getting started](https://anilink.alpha49.com/getting-started) · [Provider configuration](https://anilink.alpha49.com/provider-configuration) · [Per-request options](https://anilink.alpha49.com/per-request-options) · [Error handling](https://anilink.alpha49.com/error-handling) · [Retries & resilience](https://anilink.alpha49.com/retries-and-resilience) · [Cancellation & timeouts](https://anilink.alpha49.com/cancellation-and-timeouts) · [Observability](https://anilink.alpha49.com/observability) · [Recipes](https://anilink.alpha49.com/recipes) · [TypeScript patterns](https://anilink.alpha49.com/typescript-patterns) · [Troubleshooting](https://anilink.alpha49.com/troubleshooting) |
| **AniList guides** | [Authentication](https://anilink.alpha49.com/guides/anilist/authentication) · [Client configuration](https://anilink.alpha49.com/guides/anilist/configuration) · [Querying](https://anilink.alpha49.com/guides/anilist/querying) · [Page queries](https://anilink.alpha49.com/guides/anilist/page-queries) · [Pagination](https://anilink.alpha49.com/guides/anilist/pagination) · [Mutations](https://anilink.alpha49.com/guides/anilist/mutations) · [Custom queries](https://anilink.alpha49.com/guides/anilist/custom-queries) · [Helpers](https://anilink.alpha49.com/guides/anilist/helpers) |
| **MAL guides** | [Authentication](https://anilink.alpha49.com/guides/mal/authentication) · [Client configuration](https://anilink.alpha49.com/guides/mal/configuration) · [Operations](https://anilink.alpha49.com/guides/mal/operations) |
| **Operation reference** | [Overview](https://anilink.alpha49.com/operations/) · [AniList catalog](https://anilink.alpha49.com/operations/anilist) · [MAL catalog](https://anilink.alpha49.com/operations/mal) |
| **API reference (TypeDoc)** | [AniLink](https://anilink.alpha49.com/classes/AniLink.AniLink.html) — full generated reference at the [docs root](https://anilink.alpha49.com/) |

## Development

```bash
npm install               # install dependencies
npm run check             # typecheck, lint, tests, format, JSDoc, api-compare, build
npm run docs:generate     # TypeDoc + operation reference + guides site into docs/
npm run docs:dev          # serve the guides site locally
```

See the [contributing guide](CONTRIBUTING.md) for workflow details.

## Resources

- [Changelog](CHANGELOG.md) and [GitHub Releases](https://github.com/RLAlpha49/AniLink/releases)
- [Contributing guide](CONTRIBUTING.md)

## License

[MIT](https://github.com/RLAlpha49/AniLink/blob/master/LICENSE)
