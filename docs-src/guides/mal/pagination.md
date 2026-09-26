---
title: MAL pagination
description: "The two MyAnimeList pagination helpers: malPaginate and the streaming malPaginatePages, over the offset/limit list endpoints."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL pagination

MyAnimeList paginates its list endpoints (`anime.search`, `anime.ranking`,
`anime.seasonal`, `anime.suggestions`, `manga.search`, `manga.ranking`,
`user.animeList`, `user.mangaList`, `forum.topics`) with `offset`/`limit`
query parameters. Two helpers walk those endpoints for you. Both take a
`fetchPage` closure that maps the traversal's page slot onto the endpoint's
own params:

```typescript
(page, perPage) => aniLink.mal.anime.search({
    q: "one piece",
    limit: perPage,
    offset: (page - 1) * perPage,
})
```

The closure pattern is the whole adapter: the helpers handle the paging
arithmetic, the end-of-list detection, and the guards, while each endpoint
keeps its own params object.

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

The traversal stops at the first page that reports the end of the list:
MAL's own `paging` node is authoritative when present (a node with no
`next` URL ends the run even when the page came back full, so a full final
page costs no extra confirmation request), with the short-page heuristic —
a page that returns fewer items than requested — as the fallback for
responses with no `paging` node at all. `truncated` is `true` only when
the `maxPages` guard ended the run first.

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

Each yielded page is the raw list response (`{ data, paging? }`). A
terminal page — a `paging` node with no `next` URL, or a short page when
the response carries no `paging` node — is the visible end-of-list signal;
`break` stops the traversal and cancels any in-flight request. `onPage`
fires once per page as it is yielded, the same observer contract as
`mal.paginate`, in streaming form.

## Options and clamps

| Option        | Default | Clamp | Meaning                                                                                                                                                             |       |
| ------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |       |
| `perPage`     | `100`   | ≤ 100 | Entries per page. Values above 100 — the most restrictive documented cap across MAL’s list endpoints — are clamped down                                             |       |
| `startPage`   | `1`     | none  | 1-based page to start from. The closure’s offset math rotates with it: `startPage: 3` starts at `offset = 2 * perPage`                                              |       |
| `maxPages`    | `100`   | none  | Hard cap that prevents unbounded loops                                                                                                                              |       |
| `concurrency` | `1`     | ≤ 8   | Look-ahead requests in flight. Defaults to strictly sequential because MAL’s rate limit (~1-2 req/sec) makes look-ahead counterproductive                           |       |
| `signal`      | none    | none  | `AbortSignal` to cancel the traversal. Aborting cancels in-flight requests immediately                                                                              |       |
| `onPage`      | none    | none  | Per-page callback: after collection on `mal.paginate`, as each page is yielded on `mal.paginatePages`; a throwing callback is reported through `onHookError` and swallowed |

## Which endpoints paginate

Every endpoint returning `{ data, paging? }` works with both helpers. The
one exception is `forum.topic`: it paginates posts *inside* one response
(`data.posts` with its own `paging`), not across responses. Page its posts
with repeated `topic()` calls using the same closure pattern.

## Relation to the AniList helpers

`aniLink.mal.paginate` is the sibling of the helpers in the [AniList pagination guide](/guides/anilist/pagination). Both
run over the same shared pagination engine; the difference is the adapter:
AniList pages with `page`/`perPage` GraphQL variables and `pageInfo.hasNextPage`,
while MAL pages with `offset`/`limit` query parameters and the `paging.next`
URL (with the short-page heuristic when the `paging` node is absent). The
options mirror each other, so switching providers reads as a diff of the
closure only.
