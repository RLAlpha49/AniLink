---
title: AniList helpers
description: "The four AniList data helpers as client methods on the anilist namespace: fuzzyDate, fuzzyDateInt, flattenMediaListCollection, and crossLink."
layout: .vitepress/theme/DocsLayout.vue
---

# AniList helpers

Four data helpers live on the `anilist` namespace: `aniLink.anilist.fuzzyDate`, `aniLink.anilist.fuzzyDateInt`, `aniLink.anilist.flattenMediaListCollection`, and `aniLink.anilist.crossLink`. They are methods on the client, not standalone imports. There is no extra import to remember.

## `fuzzyDate`

Builds an AniList `FuzzyDateInput` from optional year, month, and day parts. AniList represents unknown fuzzy-date parts as `0`; this helper fills each omitted part with `0`, so the result always satisfies the `FuzzyDateInput` contract. Use it to construct `startedAt`/`completedAt` values for list-entry mutations instead of hand-building objects and guessing which fields to zero out.

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

AniList's query arguments type fuzzy dates differently from its mutations. The query filters (`startDate`, `endDate`, `startedAt`, `completedAt` and their `_greater`/`_lesser` variants on `query.media`, `query.mediaList`, `query.mediaListCollection`, and the `page` counterparts) take the `FuzzyDateInt` scalar, an integer in `YYYYMMDD` form. The list-entry mutations take the `FuzzyDateInput` object `fuzzyDate` builds.

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

Use `fuzzyDate` when the variable goes into a mutation (`saveMediaListEntry`, `updateMediaListEntries`); use `fuzzyDateInt` when it goes into a query filter.

## `flattenMediaListCollection`

`mediaListCollection` returns lists nested by status and custom list. `flattenMediaListCollection` flattens that structure into a single array of `FlattenedMediaListEntry` objects, deduplicated by entry id.

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

When an entry appears in multiple status groups, the helper deduplicates it by entry id. A media present in both `COMPLETED` and a custom list yields one entry, with every group name accumulated in `listNames`. The helper keeps custom-list-only membership and does not filter entries to the primary status groups. The output reflects exactly what AniList returned.

## `crossLink`

AniList media carries `idMal`, the MyAnimeList id of the same show or book. `crossLink` turns any batch of AniList media entries into bidirectional id lookup maps, so a cross-provider workflow is two map lookups instead of a hand-rolled mapping. The helper collects entries without a MAL id in `unmapped` instead of dropping them silently.

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

| Field          | Type                          | Description                                                                    |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `anilistToMal` | `ReadonlyMap<number, number>` | Maps AniList media id to MyAnimeList id for entries that carry one             |
| `malToAnilist` | `ReadonlyMap<number, number>` | Maps MyAnimeList id to AniList media id; the last entry wins on shared MAL ids |
| `unmapped`     | `TMedia[]`                    | The input entries that carry no `idMal`, in input order                        |

The helper is pure and makes no requests. Pass it the `media` array of a `page.medias` response, a one-element array around a `query.media` result, or any `Media`-shaped entries carrying `id` and `idMal`. See the [cross-provider workflow recipe](/recipes) for the full flow.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) covers `paginateChunks` for large collections.
- <Icon name="ArrowRight" :size="14" /> [Cross-provider workflow recipe](/recipes) shows `crossLink` feeding `mal.anime.get`.
- <Icon name="ArrowRight" :size="14" /> [Query operation reference](/operations/anilist/query#lists) documents the `mediaListCollection` response shape.
