---
title: Querying data
layout: .vitepress/theme/DocsLayout.vue
---

# Querying data

The query surface is grouped by domain. Every method takes a typed variables object and an optional trailing `RequestOptions`.

## Media

| Operation | Purpose |
| --- | --- |
| [`query.media`](/operations/anilist/query#media) | One anime or manga by `id` or `idMal` |
| [`query.mediaTrend`](/operations/anilist/query#media) | Popularity/progression trends for a media |
| [`query.airingSchedule`](/operations/anilist/query#media) | Airing schedule for a media |

```typescript
const anime = await aniLink.anilist.query.media({ id: 21, type: "ANIME" });
```

## Characters & staff

| Operation | Purpose |
| --- | --- |
| [`query.character`](/operations/anilist/query#characters-staff) | One character with their media |
| [`query.staff`](/operations/anilist/query#characters-staff) | One staff member with their media and characters |

## Studios

| Operation | Purpose |
| --- | --- |
| [`query.studio`](/operations/anilist/query#studios) | One studio with its productions |

## Users

| Operation | Purpose |
| --- | --- |
| [`query.user`](/operations/anilist/query#users) | One user by id or name |
| [`query.viewer`](/operations/anilist/query#users) | The authenticated user (token required) |
| [`query.following`](/operations/anilist/query#users) | Users a user follows |
| [`query.follower`](/operations/anilist/query#users) | Users following a user |

## Lists

| Operation | Purpose |
| --- | --- |
| [`query.mediaList`](/operations/anilist/query#lists) | One list entry for a user and media |
| [`query.mediaListCollection`](/operations/anilist/query#lists) | A user's whole list collection, chunked |

`mediaListCollection` returns lists nested by status and custom list. Flatten it with [`flattenMediaListCollection`](/guides/anilist/helpers) and walk large collections with [`paginateChunks`](/guides/anilist/pagination).

## Taxonomy

| Operation | Purpose |
| --- | --- |
| [`query.genreCollection`](/operations/anilist/query#taxonomy) | All genres |
| [`query.mediaTagCollection`](/operations/anilist/query#taxonomy) | All tags |
| [`query.externalLinkSourceCollection`](/operations/anilist/query#taxonomy) | External link sources |

## Activity

| Operation | Purpose |
| --- | --- |
| [`query.activity`](/operations/anilist/query#activity) | One activity |
| [`query.activityReply`](/operations/anilist/query#activity) | One activity reply |
| [`query.notification`](/operations/anilist/query#activity) | Notifications for the viewer (token required) |

## Community

| Operation | Purpose |
| --- | --- |
| [`query.thread`](/operations/anilist/query#community) | One forum thread |
| [`query.threadComment`](/operations/anilist/query#community) | One thread comment |

## Reviews & recommendations

| Operation | Purpose |
| --- | --- |
| [`query.review`](/operations/anilist/query#reviews) | One review |
| [`query.recommendation`](/operations/anilist/query#reviews) | One recommendation |

## Misc

| Operation | Purpose |
| --- | --- |
| [`query.markdown`](/operations/anilist/query#misc) | Render AniList markdown to HTML |
| [`query.aniChartUser`](/operations/anilist/query#misc) | AniChart settings for the viewer |
| [`query.siteStatistics`](/operations/anilist/query#misc) | Site-wide statistics |

## Example with variables

```typescript
const character = await aniLink.anilist.query.character({
    id: 1,
    asHtml: true,
    mediaSort: ["POPULARITY_DESC"],
    mediaPage: 1,
    mediaPerPage: 10,
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Page queries](/guides/anilist/page-queries) — fetching a single known page.
- <Icon name="ArrowRight" :size="14" /> [Pagination](/guides/anilist/pagination) — collecting many pages automatically.
- <Icon name="ArrowRight" :size="14" /> [Query operation reference](/operations/anilist/query) — variables and response shapes per operation.
