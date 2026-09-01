---
title: AniList helpers
layout: .vitepress/theme/DocsLayout.vue
---

# AniList helpers

Two data helpers live on the `anilist` namespace: `aniLink.anilist.fuzzyDate` and `aniLink.anilist.flattenMediaListCollection`. They are methods on the client, not standalone imports.

## `fuzzyDate`

Builds an AniList `FuzzyDateInput` from optional year, month, and day parts. AniList represents unknown fuzzy-date parts as `0`; this helper fills each omitted part with `0`, so the result always satisfies the `FuzzyDateInput` contract. Use it to construct `startedAt`/`completedAt` values for list-entry mutations.

```typescript
const aniLink = new AniLink("anilist-token");

const startedAt = aniLink.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
// { year: 2024, month: 4, day: 15 }

const yearOnly = aniLink.anilist.fuzzyDate({ year: 2024 });
// { year: 2024, month: 0, day: 0 } — omitted parts become 0

await aniLink.anilist.mutation.saveMediaListEntry({
    mediaId: 1,
    status: "COMPLETED",
    startedAt,
});
```

All three fields are optional. Pass an empty object (or omit the argument) to produce an all-zero date.

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

Each entry carries the list-entry fields and its full list membership — not the embedded `media` object. To resolve media details, fetch the media by `mediaId` separately.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `number` | The list-entry id |
| `userId` | `number` | The owning user's id |
| `mediaId` | `number` | The media the entry refers to |
| `status` | `string` | The entry status (e.g. `CURRENT`, `COMPLETED`) |
| `score` | `number` | The score assigned |
| `progress` | `number` | Episodes or chapters watched/read |
| `listNames` | `string[]` | Every list group the entry belongs to (status list name plus any custom lists) |
| `inCustomList` | `boolean` | `true` when the entry appears in at least one custom list group |
| `inSplitCompletedList` | `boolean` | `true` when the entry appears in at least one split completed list group |

### Dedup and list-membership behavior

Entries appearing in multiple status groups are deduplicated by entry id — a media present in both `COMPLETED` and a custom list yields one entry, with every group name accumulated in `listNames`. Custom-list-only membership is preserved. Entries are not filtered to the primary status groups.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) — `paginateChunks` for large collections.
- <Icon name="ArrowRight" :size="14" /> [Query operation reference](/operations/anilist/query#lists) — the `mediaListCollection` response shape.
