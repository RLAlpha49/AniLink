---
title: Operation reference
layout: .vitepress/theme/DocsLayout.vue
---

# Operation reference

The operation reference is a generated, per-operation catalog of every public AniLink operation across both providers. It is produced from source metadata by `scripts/generate-operation-reference.ts` during `npm run docs:generate`, so it cannot drift from the code.

## What each operation page shows

Every operation entry carries the same anatomy:

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

- <Icon name="ArrowRight" :size="14" /> [AniList operation catalog](/operations/anilist/query) — choose from [queries](/operations/anilist/query), [page queries](/operations/anilist/page), [mutations](/operations/anilist/mutation), and [`custom()`](/operations/anilist/custom).
- <Icon name="ArrowRight" :size="14" /> [MyAnimeList operation catalog](/operations/mal) — every MAL operation is REST, so the catalog is a single page: `mal.anime.get` and `mal.user.me`.

## Relationship to the other surfaces

- <Icon name="ArrowRight" :size="14" /> **Guides** teach concepts and workflows and link here for per-operation detail.
- <Icon name="ArrowRight" :size="14" /> **TypeDoc** (the [API reference](/typedoc/AniLink.html)) states the exact contract-level types. The operation reference links to it for full response shapes.
- <Icon name="ArrowRight" :size="14" /> The former interactive Explorer was retired in favor of this catalog: it listed operations but did not document request/response anatomy.
