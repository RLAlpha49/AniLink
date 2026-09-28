---
title: MAL pagination
description: "The two MyAnimeList pagination helpers: malPaginate and the streaming malPaginatePages, over the offset/limit list endpoints."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL pagination

MyAnimeList paginates its list endpoints (`anime.search`, `anime.ranking`,
`anime.seasonal`, `anime.suggestions`, `manga.search`, `manga.ranking`,
`user.animeList`, `user.mangaList`, `forum.topics`) with `offset`/`limit`
query parameters. The `mal.paginate` and `mal.paginatePages` helpers request
pages from these endpoints. Pass each helper a `fetchPage` closure that maps
its `(page, perPage)` arguments to the endpoint's params:

```typescript
(page, perPage) =>
    aniLink.mal.anime.search({
        q: "one piece",
        limit: perPage,
        offset: (page - 1) * perPage,
    });
```

The helper advances through pages, detects the end of the list, and enforces
the page guards. The closure converts `(page, perPage)` into the endpoint's
params.

<script setup>
import malPaginationEndDetection from "../../diagrams/mal-pagination-end-detection.mmd?raw";
</script>

<Mermaid :code="malPaginationEndDetection" />

| Helper              | Returns                                     | Use when                         |
| ------------------- | ------------------------------------------- | -------------------------------- |
| `mal.paginate`      | All items buffered in a `MalPaginateResult` | You want the complete set        |
| `mal.paginatePages` | An async generator of raw pages             | You want to stream or exit early |

## `mal.paginate`

```typescript
const result = await aniLink.mal.paginate(
    (page, perPage) =>
        aniLink.mal.anime.search({
            q: "one piece",
            limit: perPage,
            offset: (page - 1) * perPage,
        }),
    { perPage: 100, maxPages: 5 }
);
console.log(result.items.length, result.pageCount, result.truncated);
```

If a response includes a `paging` node, the helper treats `paging.next` as
authoritative. A `paging` node without a `next` URL ends the traversal, even
when the page is full. The helper does not send a confirmation request for
that final page. If `paging` is absent, the helper stops when a page contains
fewer items than requested. `truncated` is `true` only when the `maxPages`
guard ends the traversal.

## `mal.paginatePages`

```typescript
for await (const page of aniLink.mal.paginatePages((page, perPage) =>
    aniLink.mal.user.animeList({
        username: "@me",
        limit: perPage,
        offset: (page - 1) * perPage,
    })
)) {
    console.log(page.data.length);
    if (page.data[0]?.node.id === 21) break; // early exit without buffering everything
}
```

Each yielded page is the raw list response (`{ data, paging? }`). If the
response has a `paging` node without `next`, the helper has reached the end.
If `paging` is absent, a short page (fewer items than requested) marks the
end. Use `break` to stop iteration. The helper cancels any in-flight request.
`onPage` fires once for each yielded page, matching the observer behavior of
`mal.paginate`.

## Options and clamps

| Option | Default | Clamp | Meaning | |
| ------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | |
| `perPage` | `100` | ≤ 100 | Entries per page. Values above 100, the most restrictive documented cap across MAL's list endpoints, are clamped down | |
| `startPage` | `1` | none | 1-based page to start from. For example, `startPage: 3` sets the initial `offset` to `2 * perPage` | |
| `maxPages` | `100` | none | Hard cap that prevents unbounded loops | |
| `concurrency` | `1` | ≤ 8 | Look-ahead requests in flight. Requests run sequentially by default because MAL's rate limit (~1-2 req/sec) limits the benefit of look-ahead | |
| `signal` | none | none | `AbortSignal` to cancel the traversal. Aborting cancels in-flight requests immediately | |
| `onPage` | none | none | Per-page callback. On `mal.paginate`, it runs after collection. On `mal.paginatePages`, it runs as each page is yielded. AniLink reports a throwing callback through `onHookError` and swallows it. |

## Which endpoints paginate

Every endpoint returning `{ data, paging? }` works with both helpers. The
`forum.topic` endpoint is the exception. It paginates posts within one
response (`data.posts` has its own `paging`) rather than across responses.
To fetch more posts, call `topic()` repeatedly with the same closure pattern.

## Relation to the AniList helpers

`aniLink.mal.paginate` uses the same pagination engine as the helpers in the
[AniList pagination guide](/guides/anilist/pagination). The providers use
different paging inputs. AniList passes `page` and `perPage` as GraphQL
variables and checks `pageInfo.hasNextPage`. MAL sends `offset` and `limit`
query parameters and checks `paging.next`. If the `paging` node is absent,
MAL uses the short-page heuristic. The options match, so switching providers
requires changing only the `fetchPage` closure.
