---
title: Mutations
layout: .vitepress/theme/DocsLayout.vue
---

# Mutations

Every `aniLink.anilist.mutation.*` method requires authentication. Calling one without a token throws `AniLinkAuthError`. Mutations are **never retried** by the default retry policy unless you opt in.

## Lists

| Operation | Purpose |
| --- | --- |
| [`saveMediaListEntry`](/operations/anilist/mutation#lists) | Create or update a list entry |
| [`updateMediaListEntries`](/operations/anilist/mutation#lists) | Update many entries at once |
| [`deleteMediaListEntry`](/operations/anilist/mutation#lists) | Delete an entry |
| [`deleteCustomList`](/operations/anilist/mutation#lists) | Delete a custom list |

## Users

| Operation | Purpose |
| --- | --- |
| [`updateUser`](/operations/anilist/mutation#users) | Update viewer preferences and profile |

## Activity

| Operation | Purpose |
| --- | --- |
| [`saveTextActivity`](/operations/anilist/mutation#activity) | Create or update a text activity |
| [`saveMessageActivity`](/operations/anilist/mutation#activity) | Create or update a message activity |
| [`saveListActivity`](/operations/anilist/mutation#activity) | Update a list activity (mod only) |
| [`deleteActivity`](/operations/anilist/mutation#activity) | Delete an activity |
| [`toggleActivityPin`](/operations/anilist/mutation#activity) | Pin or unpin an activity |
| [`toggleActivitySubscription`](/operations/anilist/mutation#activity) | Subscribe or unsubscribe |
| [`saveActivityReply`](/operations/anilist/mutation#activity) | Create or update a reply |
| [`deleteActivityReply`](/operations/anilist/mutation#activity) | Delete a reply |
| [`toggleLike`](/operations/anilist/mutation#activity) | Toggle a like |
| [`toggleLikeV2`](/operations/anilist/mutation#activity) | Toggle a like (v2 likeable types) |

## Community

| Operation | Purpose |
| --- | --- |
| [`saveThread`](/operations/anilist/mutation#community) | Create or update a thread |
| [`deleteThread`](/operations/anilist/mutation#community) | Delete a thread |
| [`toggleThreadSubscription`](/operations/anilist/mutation#community) | Subscribe or unsubscribe |
| [`saveThreadComment`](/operations/anilist/mutation#community) | Create or update a comment |
| [`deleteThreadComment`](/operations/anilist/mutation#community) | Delete a comment |

## Reviews & recommendations

| Operation | Purpose |
| --- | --- |
| [`saveReview`](/operations/anilist/mutation#reviews) | Create or update a review |
| [`deleteReview`](/operations/anilist/mutation#reviews) | Delete a review |
| [`rateReview`](/operations/anilist/mutation#reviews) | Rate a review |
| [`saveRecommendation`](/operations/anilist/mutation#reviews) | Save a recommendation rating |

## Social & favourites

| Operation | Purpose |
| --- | --- |
| [`toggleFollow`](/operations/anilist/mutation#users) | Follow or unfollow a user |
| [`toggleFavourite`](/operations/anilist/mutation#users) | Toggle a favourite |
| [`updateFavouriteOrder`](/operations/anilist/mutation#users) | Reorder favourites |

## AniChart

| Operation | Purpose |
| --- | --- |
| [`updateAniChartSettings`](/operations/anilist/mutation#misc) | Update AniChart settings |
| [`updateAniChartHighlights`](/operations/anilist/mutation#misc) | Update AniChart highlights |

## Example

```typescript
const aniLink = new AniLink("anilist-token");

const entry = await aniLink.anilist.mutation.saveMediaListEntry({
    mediaId: 143271,
    status: "CURRENT",
    score: 8.5,
    progress: 3,
});
```

## Errors

Mutations throw `AniLinkAuthError` (no token), `AniLinkGraphQLError` (validation failures inside HTTP 200), `AniLinkApiError` (HTTP-level failures), and `AniLinkNetworkError` (transport). See [Error handling](/error-handling).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Mutation operation reference](/operations/anilist/mutation#lists) — variables per mutation.
- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — opting into mutation retries.
