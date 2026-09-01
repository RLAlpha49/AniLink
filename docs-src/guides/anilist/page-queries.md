---
title: Page queries
layout: .vitepress/theme/DocsLayout.vue
---

# Page queries

`aniLink.anilist.query.page.*` fetches **one known page** of a collection. Each method mirrors a top-level query but adds `page` and `perPage` controls and returns a `pageInfo` object alongside the items.

## When to fetch a single known page

- You already know the page number (e.g. resuming a sync).
- You want exactly one slice of results (e.g. "top 10 trending").
- You are building your own pagination loop.

For collecting everything, use the [pagination helpers](/guides/anilist/pagination) instead.

## Available page queries

`medias`, `characters`, `staffs`, `studios`, `mediaLists`, `airingSchedules`, `mediaTrends`, `notifications`, `followers`, `following`, `activities`, `activityReplies`, `threads`, `threadComments`, `reviews`, `recommendations`, `users`, `likes`.

## `pageInfo` semantics

Every page response carries `pageInfo`:

| Field | Meaning |
| --- | --- |
| `total` | Total items across all pages |
| `currentPage` | 1-based page number of this response |
| `lastPage` | Last existing page number |
| `hasNextPage` | Whether a following page exists |
| `perPage` | Items per page for this response |

## Example

```typescript
const page = await aniLink.anilist.query.page.medias({
    page: 1,
    perPage: 10,
    type: "ANIME",
    sort: ["POPULARITY_DESC"],
});

console.log(page.pageInfo.hasNextPage, page.media.length);
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) — walking pages automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/anilist/page#page-queries) — per-method variables and responses.
