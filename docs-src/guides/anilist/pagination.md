---
title: Pagination
layout: .vitepress/theme/DocsLayout.vue
---

# Pagination

Three helpers cover the three traversal styles:

<Mermaid
    :code="`flowchart LR\n    subgraph pg[paginate]\n        direction TB\n        p1[Page 1] --> p2[Page 2] --> p3[Page 3]\n    end\n    p3 --> buf1([All items buffered\nPaginateResult]):::out\n\n    subgraph pp[paginatePages]\n        direction TB\n        q1[Page 1] --> q2[Page 2] --> q3[Page 3]\n    end\n    q1 --> gen1([yield page 1]):::out\n    q2 --> gen2([yield page 2]):::out\n    q3 --> gen3([yield page 3]):::out\n    gen1 -.->|early exit| stop([break]):::out\n\n    subgraph pc[paginateChunks]\n        direction TB\n        c1[Chunk 1] --> c2[Chunk 2] --> c3[Chunk 3]\n    end\n    c3 --> buf2([All items buffered\nChunkPaginateResult]):::out\n\n    classDef out fill:#d5e8d4,stroke:#82b366,color:#2d5016;`"
/>

| Helper           | Walks                 | Returns                                       | Use when                         |
| ---------------- | --------------------- | --------------------------------------------- | -------------------------------- |
| `paginate`       | `pageInfo` pages      | All items buffered in a `PaginateResult`      | You want the complete set        |
| `paginatePages`  | `pageInfo` pages      | An async generator of raw pages               | You want to stream or exit early |
| `paginateChunks` | `hasNextChunk` chunks | All items buffered in a `ChunkPaginateResult` | Traversing `mediaListCollection` |

## `paginate`

```typescript
const result = await aniLink.anilist.paginate(
    (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
    "media",
    { perPage: 50, maxPages: 10, concurrency: 4 }
);
console.log(result.items.length, result.pageCount, result.truncated);
```

## `paginatePages`

```typescript
for await (const page of aniLink.anilist.paginatePages((page, perPage) =>
    aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
)) {
    console.log(page.pageInfo.currentPage, page.media.length);
    if (page.media[0]?.id === 1) break; // early exit without buffering everything
}
```

## `paginateChunks`

```typescript
const chunked = await aniLink.anilist.paginateChunks(
    (chunk, perChunk) =>
        aniLink.anilist.query.mediaListCollection({
            userId: 542244,
            type: "ANIME",
            chunk,
            perChunk,
        }),
    "lists",
    { perChunk: 500, maxChunks: 20 }
);
console.log(chunked.items.length, chunked.chunkCount, chunked.truncated);
```

## Options and clamps

| Option                     | Applies to                  | Default | Clamp | Meaning                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | --------------------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `perPage`                  | `paginate`, `paginatePages` | `50`    | ≤ 50  | Items per page. Values above 50 are clamped down                                                                                                                                                                                                                                                                                                              |
| `perChunk`                 | `paginateChunks`            | `500`   | ≤ 500 | Entries per chunk. Values above 500 are clamped down                                                                                                                                                                                                                                                                                                          |
| `startPage` / `startChunk` | all                         | `1`     | —     | 1-based position to start from                                                                                                                                                                                                                                                                                                                                |
| `maxPages` / `maxChunks`   | all                         | `100`   | —     | Hard cap guarding unbounded loops                                                                                                                                                                                                                                                                                                                             |
| `concurrency`              | all                         | `3`     | ≤ 8   | Look-ahead requests kept in flight. A small window overlaps round-trip latency by default; pass `1` for strictly sequential fetches. Because the window runs ahead of consumption, look-ahead may issue up to `concurrency - 1` requests after the terminal page before it is known to be terminal; those stragglers are drained and their payloads discarded |

## Ordering and truncation guarantees

- Results are always **in page/chunk order**, regardless of completion order.
- Scheduling stops only after the terminal result is processed (consumed in order), not when it settles: a fetched page reporting `hasNextPage: false` (or a chunk reporting `hasNextChunk: false`) halts further scheduling once it has been consumed, and any already-launched stragglers are drained and discarded.
- `truncated` is `true` when the traversal stopped at `maxPages`/`maxChunks` before the source ran out.
- `hasNextChunk` semantics: `paginateChunks` continues while the fetched chunk reports more chunks ahead, up to `maxChunks`.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Page queries](/guides/anilist/page-queries) — the single-page building blocks.
- <Icon name="ArrowRight" :size="14" /> [Recipes](/recipes) — a complete list-sync workflow.
