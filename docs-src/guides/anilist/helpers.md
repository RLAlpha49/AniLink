---
title: AniList helpers
description: "The four AniList data helpers as client methods on the anilist namespace: fuzzyDate, fuzzyDateInt, flattenMediaListCollection, and crossLink."
layout: .vitepress/theme/DocsLayout.vue
---

# AniList helpers

The `anilist` namespace exposes four data helpers: `aniLink.anilist.fuzzyDate`, `aniLink.anilist.fuzzyDateInt`, `aniLink.anilist.flattenMediaListCollection`, and `aniLink.anilist.crossLink`. Call each helper on the client rather than importing it separately.

## `fuzzyDate`

The helper builds an AniList `FuzzyDateInput` from optional year, month, and day parts. AniList represents unknown fuzzy-date parts as `0`. The helper fills each omitted part with `0`, so the result always satisfies the `FuzzyDateInput` contract. Use it to build `startedAt` and `completedAt` values for list-entry mutations.

```typescript
const aniLink = new AniLink("anilist-token");

const startedAt = aniLink.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
// { year: 2024, month: 4, day: 15 }

const yearOnly = aniLink.anilist.fuzzyDate({ year: 2024 });
// { year: 2024, month: 0, day: 0 }; omitted parts become 0

await aniLink.anilist.mutation.saveMediaListEntry({
    mediaId: 1,
    status: "COMPLETED",
    startedAt,
});
```

All three fields are optional. Pass an empty object or omit the argument entirely to produce an all-zero date.

## `fuzzyDateInt`

AniList uses different fuzzy-date formats for queries and mutations. Query filters (`startDate`, `endDate`, `startedAt`, `completedAt` and their `_greater`/`_lesser` variants on `query.media`, `query.mediaList`, `query.mediaListCollection`, and the `page` counterparts) take the `FuzzyDateInt` scalar, an integer in `YYYYMMDD` form. List-entry mutations take the `FuzzyDateInput` object built by `fuzzyDate`.

`fuzzyDateInt` packs optional year, month, and day parts into that integer, filling omitted parts with `0` exactly like the object form:

```typescript
const aniLink = new AniLink("anilist-token");

const full = aniLink.anilist.fuzzyDateInt({ year: 2024, month: 4, day: 15 });
// 20240415

const yearOnly = aniLink.anilist.fuzzyDateInt({ year: 2024 });
// 20240000; omitted parts become 0

const page = await aniLink.anilist.query.page.medias({
    page: 1,
    perPage: 50,
    type: "ANIME",
    startDate: full,
});
```

Use `fuzzyDate` for mutation arguments (`saveMediaListEntry`, `updateMediaListEntries`). Use `fuzzyDateInt` for query filters.

## `flattenMediaListCollection`

The `mediaListCollection` response groups lists by status and custom list. `flattenMediaListCollection` combines those groups into one array of `FlattenedMediaListEntry` objects and removes duplicate entry IDs.

<Mermaid
    :code="`flowchart LR\n    subgraph src[mediaListCollection response]\n        direction TB\n        cg[COMPLETED group]:::grp\n        wg[WATCHING group]:::grp\n        clg[Custom list group]:::grp\n        cg --> e1[entry 1<br/>media A]:::entry\n        cg --> e2[entry 2<br/>media B]:::entry\n        wg --> e3[entry 3<br/>media C]:::entry\n        clg --> e4[entry 1<br/>media A]:::dup\n    end\n\n    src --> flat[flattenMediaListCollection]:::proc\n\n    flat --> dedup[Dedup by entry id]:::proc\n    e4 -.->|same id as entry 1| dedup\n\n    dedup --> out([FlattenedMediaListEntry array<br/>entry 1, entry 2, entry 3<br/>one flat list]):::out\n\n    classDef grp fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c;\n    classDef entry fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef dup fill:#f8cecc,stroke:#b85450,color:#5c1a1a;\n    classDef proc fill:#fff2cc,stroke:#d6b656,color:#5c4a00;\n    classDef out fill:#f5f5f5,stroke:#666666,color:#333333;`"
/>

```typescript
const aniLink = new AniLink("anilist-token");

const collection = await aniLink.anilist.query.mediaListCollection({
    userId: 542244,
    type: "ANIME",
});

const entries = aniLink.anilist.flattenMediaListCollection(collection);
console.log(entries.length, entries[0]?.listNames);
```

### `FlattenedMediaListEntry` shape

Each entry carries the list-entry fields and its full list membership, not the embedded `media` object. If you need media details, fetch the media by `mediaId` separately.

| Field                  | Type       | Description                                                                    |
| ---------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                   | `number`   | The list-entry id                                                              |
| `userId`               | `number`   | The owning user's id                                                           |
| `mediaId`              | `number`   | The media the entry refers to                                                  |
| `status`               | `string`   | The entry status (e.g. `CURRENT`, `COMPLETED`)                                 |
| `score`                | `number`   | The score assigned                                                             |
| `progress`             | `number`   | Episodes watched or chapters read                                              |
| `listNames`            | `string[]` | Every list group the entry belongs to (status list name plus any custom lists) |
| `inCustomList`         | `boolean`  | `true` when the entry appears in at least one custom list group                |
| `inSplitCompletedList` | `boolean`  | `true` when the entry appears in at least one split completed list group       |

### Dedup and list-membership behavior

When an entry appears in multiple status groups, the helper keeps one copy per entry ID and adds each group name to `listNames`. It also includes entries that appear only in custom lists, not just entries in the primary status groups.

## `crossLink`

AniList media entries include `idMal`, the matching MyAnimeList ID for each show or book. `crossLink` builds maps from AniList IDs to MyAnimeList IDs and back for a batch of media entries. Entries without a MAL ID appear in `unmapped`.

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "anilist-token" },
    mal: { accessToken: "mal-token" },
});

const page = await aniLink.anilist.query.page.medias({ page: 1, perPage: 50, type: "ANIME" });
const { anilistToMal, unmapped } = aniLink.anilist.crossLink(page.media);

const malId = anilistToMal.get(21);
if (malId !== undefined) {
    const malAnime = await aniLink.mal.anime.get({ id: malId }, { fields: ["id", "title"] });
}
```

### `CrossLinkResult` shape

| Field          | Type                          | Description                                                                                                |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `anilistToMal` | `ReadonlyMap<number, number>` | Maps AniList media id to MyAnimeList id for entries that carry one                                         |
| `malToAnilist` | `ReadonlyMap<number, number>` | Maps MAL IDs to AniList media IDs. The last entry wins for duplicates.                                     |
| `unmapped`     | `TMedia[]`                    | The input entries that carry no `idMal`, in input order                                                    |

The helper is pure and makes no requests. Pass it the `media` array from a `page.medias` response, a one-element array containing a `query.media` result, or an array of `Media`-shaped entries with `id` and `idMal`. See the [cross-provider workflow recipe](/recipes) for the full flow.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) covers `paginateChunks` for large collections.
- <Icon name="ArrowRight" :size="14" /> [Cross-provider workflow recipe](/recipes) shows `crossLink` feeding `mal.anime.get`.
- <Icon name="ArrowRight" :size="14" /> [Query operation reference](/operations/anilist/query#lists) documents the `mediaListCollection` response shape.
