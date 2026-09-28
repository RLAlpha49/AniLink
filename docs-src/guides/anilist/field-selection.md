---
title: Field selection
description: "Request fields from AniList operations at any nesting depth. Response types include the requested fields and any always-selected keys."
layout: .vitepress/theme/DocsLayout.vue
---

# Field selection

AniList operations return the maximal selection by default. The `fields` option composes a document from the selections you name at any nesting depth, and the return type narrows to those fields plus any always-selected keys:

```typescript
const full = await aniLink.anilist.query.media({ id: 123 });
// full: MediaResponse, every field

const slim = await aniLink.anilist.query.media(
    { id: 123 },
    { fields: ["id", "title", "averageScore"] }
);
// slim: DeepPick<MediaResponse, "id" | "title" | "averageScore" | "idMal">
```

<script setup>
import fieldSelection from "../../diagrams/field-selection.mmd?raw";
</script>

<Mermaid :code="fieldSelection" />

`fields` and transport settings share the same trailing options argument:

```typescript
const slim = await aniLink.anilist.query.media(
    { id: 123 },
    { fields: ["id", "title"], timeout: 5_000 }
);
```

## Nested paths

A path is a dot-separated field chain into the response. Stop at an object to take it whole, or keep drilling to take single leaves:

```typescript
// Whole object: every title variant.
const titled = await aniLink.anilist.query.media({ id: 123 }, { fields: ["title"] });

// One leaf of it: romaji only.
const romaji = await aniLink.anilist.query.media({ id: 123 }, { fields: ["title.romaji"] });
// romaji: { id: number; idMal: number; title: { romaji: string } }
// The always-selected id and idMal are part of the narrowed type:
// the composed document always sends them, so the type always has them.
const handle: number = romaji.idMal;
```

Paths drill through lists too. The path addresses the element's shape, and the result keeps the array:

```typescript
const tagged = await aniLink.anilist.query.media(
    { id: 123 },
    { fields: ["tags.name", "tags.category"] }
);
// tagged: { id: number; idMal: number; tags: ({ name: string } & { category: string })[] }
```

Paths sharing a head merge into one selection of that head, so `["title.romaji", "title.english"]` sends one `title { romaji english }` block. Depth is unlimited: `"stats.scoreDistribution.score"` works.

## Always-selected keys

Most entities always select their `id` (and media also `idMal`) even when not requested. Use that `id` in later calls. The composed document keeps always-keys whole even when a requested path extends them: requesting `"pageInfo.total"` on a page query keeps the whole always-selected `pageInfo` block (a superset), so pagination metadata stays available to the `paginate` helpers.

Always-keys are part of the narrowed type as well as the document: `fields: ["title.romaji"]` on `media` narrows the type to `{ id: number; idMal: number; title: { romaji: string } }`, because the composed document always sends `id` and `idMal`.

Entities whose response has no `id` (`mediaTrend`, `siteStatistics`, `mediaListCollection`) force-select nothing.

## Narrowed types

The return type is `DeepPick<Response, K | Always>`, where `K` contains the paths you pass and `Always` contains the operation's always-selected keys. Each path contributes one key. Nested paths pick into their field's type, and arrays unwrap. AniLink rejects unknown paths before dispatch with an `AniLinkValidationError`. The error lists every invalid path, including a valid head with an invalid leaf (`"title.nope"`) and a path that drills into a scalar (`"episodes.deeper"`). An empty `fields` list is rejected the same way when it would compose an empty selection.

There is one TypeScript limitation. TypeScript unions the overloads' return types when you pass a fields-enabled operation directly to a generic such as `paginate`. To keep the full response type, annotate the callback's return type (`(page, perPage): Promise<MediasPageResponse> => ...`).

## Which operations accept `fields`

- **The 14 single-entity queries**: `media`, `airingSchedule`, `character`, `mediaList`, `mediaListCollection`, `mediaTrend`, `recommendation`, `review`, `siteStatistics`, `staff`, `studio`, `thread`, `threadComment`, `user`.
- **The 16 page queries** (`query.page.*`) whose inner entity is a plain selection: paths such as `"pageInfo.total"`, `"media.title.romaji"`, and `"users.name"` address the page response. The composed document keeps the `Page` root and the inner entity's filter arguments. Only the selection narrows.
- **24 mutations with plain-selection responses** accept `fields`, including `saveMediaListEntry`, `updateUser`, `saveThread`, `toggleFavourite`, and the delete operations. Paths address the written entity you get back.

Out of scope:

- **`notification`** (query and page) and **`activities`** (page) return unions narrowed by inline fragments (`... on TextActivity`), which per-key selection cannot express.
- **`toggleActivityPin`, `toggleActivitySubscription`, `toggleLikeV2`** return union types (`Activity`, `Likeable`) whose documents are inline fragments.
- **`updateAniChartSettings`, `updateAniChartHighlights`** return a scalar with no selection to compose.
- **Plain-response queries without a `fields` option**: `viewer`, `follower`, `following`, `activity`, `activityReply`, `mediaTagCollection`, `aniChartUser`, `markdown`, `genreCollection`, `externalLinkSourceCollection`. These return fixed shapes (a user, a tag list, rendered HTML) where a sub-selection adds nothing the maximal document does not already include.

## When to use `custom()` instead

Use `aniLink.anilist.custom()` when you need something `fields` cannot express: aliased fields, multiple root fields in one document, or variables the typed operations do not expose. You trade the narrowed typing for full GraphQL control.

See [Custom queries](/guides/anilist/custom-queries) for writing your own document, and [Per-request options](/per-request-options) for how `fields` compares to the MAL field selector.
