---
title: Operation reference
description: "The per-operation catalog of every public AniLink operation across both providers, generated from source metadata so it cannot drift from the code."
layout: .vitepress/theme/DocsLayout.vue
---

# Operation reference

The operation reference is a generated, per-operation catalog of every public AniLink operation across both providers. `scripts/generate-operation-reference.ts` generates it from source metadata during `npm run docs:generate`, so it cannot drift from the code. Regenerate the docs and the catalog follows the source.

## What each operation page shows

Every operation entry has the same sections:

| Section   | Contents                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Signature | The callable TypeScript signature                                                                                  |
| Request   | Variables (AniList GraphQL) or path/query/options parameters (MAL REST), with type, required flag, and description |
| Response  | The return type and its documented fields                                                                          |
| Auth      | Whether an access token is required and which credential slot supplies it                                          |
| Errors    | Thrown error classes and when each occurs                                                                          |
| Example   | A runnable sample extracted from the source JSDoc                                                                  |
| Links     | The TypeDoc page and the upstream AniList or MAL reference                                                         |

## Catalogs

- <Icon name="ArrowRight" :size="14" /> [AniList operation catalog](/operations/anilist/query) covers [queries](/operations/anilist/query), [page queries](/operations/anilist/page), [mutations](/operations/anilist/mutation), and [`custom()`](/operations/anilist/custom).
- <Icon name="ArrowRight" :size="14" /> [MyAnimeList operation catalog](/operations/mal/anime) covers [anime](/operations/mal/anime), [manga](/operations/mal/manga), [user](/operations/mal/user), and [forum](/operations/mal/forum) operations.
