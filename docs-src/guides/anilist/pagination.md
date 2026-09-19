---
title: Pagination
description: "The three AniList pagination helpers: paginate, paginatePages, and the chunk-based paginateChunks. When to use each traversal style."
layout: .vitepress/theme/DocsLayout.vue
---

# Pagination

Three helpers offer three traversal styles. Pick the one that matches how you want to consume the data:

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

| Option                     | Applies to                  | Default | Clamp | Meaning                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `perPage`                  | `paginate`, `paginatePages` | `50`    | ≤ 50  | Items per page. Values above 50 are clamped down                                                                                                                                                                                                                                                                                                             |
| `perChunk`                 | `paginateChunks`            | `500`   | ≤ 500 | Entries per chunk. Values above 500 are clamped down                                                                                                                                                                                                                                                                                                         |
| `startPage` / `startChunk` | all                         | `1`     | none  | 1-based position to start from                                                                                                                                                                                                                                                                                                                               |
| `maxPages` / `maxChunks`   | all                         | `100`   | none  | Hard cap that prevents unbounded loops                                                                                                                                                                                                                                                                                                                       |
| `concurrency`              | all                         | `3`     | ≤ 8   | Look-ahead requests in flight. A small window overlaps round-trip latency by default; pass `1` for strictly sequential fetches. Because the window runs ahead of consumption, look-ahead may issue up to `concurrency - 1` requests after the terminal page before the helper knows it is terminal. The helper drains stragglers and discards their payloads |
| `signal`                   | all                         | none    | none  | `AbortSignal` to cancel the traversal. Aborting the signal cancels in-flight look-ahead requests immediately                                                                                                                                                                                                                                                 |
| `onPage`                   | `paginate`                  | none    | none  | Per-page callback invoked as each page is fetched, for incremental consumption without retaining every raw page response in memory                                                                                                                                                                                                                           |
| `onChunk`                  | `paginateChunks`            | none    | none  | Per-chunk callback invoked as each chunk is fetched, for incremental consumption without retaining every raw chunk response in memory                                                                                                                                                                                                                        |
| `onHookError`              | `paginate`/`paginateChunks` | none    | none  | Observer for failures thrown by `onPage`/`onChunk`. When provided, this handler receives the hook name and error when any callback throws. Otherwise, the helper falls back to `console.warn`                                                                                                                                                                |

## Ordering and truncation guarantees

- Results are always **in page/chunk order**, regardless of completion order. Concurrency never reorders your data.
- Scheduling stops only after you consume the terminal result in order, not when it settles. A fetched page that reports `hasNextPage: false` (or a chunk that reports `hasNextChunk: false`) halts further scheduling once you have consumed it. The helper drains and discards any already-launched stragglers.
- Page look-ahead never launches a page beyond the smallest `pageInfo.lastPage` a received page has reported. The helper would only drain and discard those requests, so skipping them saves rate-limit budget. The `lastPage` bound does not affect chunk traversals. `MediaListCollection` chunks carry no `pageInfo`.
- `truncated` is `true` when the traversal stopped at `maxPages`/`maxChunks` before the source ran out. `truncated` is also `true` when the `lastPage` bound ended a page traversal whose last fetched page still reported `hasNextPage: true`. You never mistake a short read for a clean end. For `paginatePages`, the same situation is visible on the last yielded page's `pageInfo` (`hasNextPage: true` at `currentPage === lastPage`) since a generator has no result flag.
- `hasNextChunk` semantics: `paginateChunks` continues while the fetched chunk reports more chunks ahead, up to `maxChunks`.

## Cancelling look-ahead

Pass a `signal` to cancel the traversal and abort in-flight look-ahead requests immediately. Break out of a `paginatePages` loop early without passing a `signal`, and the generator's `finally` block aborts in-flight look-ahead requests on its own. You spend no rate-limit budget on discarded payloads:

```typescript
const controller = new AbortController();

for await (const page of aniLink.anilist.paginatePages(
    (page, perPage, signal) =>
        aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }, { signal }),
    { signal: controller.signal, concurrency: 4 }
)) {
    if (page.media[0]?.id === 1) {
        controller.abort(); // cancel in-flight look-ahead, then break
        break;
    }
}
```

## Incremental consumption

The eager variants (`paginate`, `paginateChunks`) collect every response before returning, so `onPage` and `onChunk` fire after the last response arrives. They do not reduce peak memory or release collected items incrementally. For true streaming and early-exit workflows, use `paginatePages`:

```typescript
for await (const page of aniLink.anilist.paginatePages(
    (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
)) {
    for (const item of page.media) store.upsert(item);
}
```

The `onPage` and `onChunk` callbacks are still useful for side-effects (logging, metrics) on each page or chunk after the traversal completes.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Page queries](/guides/anilist/page-queries), the single-page building blocks.
- <Icon name="ArrowRight" :size="14" /> [Recipes](/recipes) for a complete list-sync workflow.
