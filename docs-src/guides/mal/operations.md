---
title: MAL operations
description: "The aniLink.mal methods are grouped by domain: anime, manga, user, and forum. Every operation takes a typed params object and an optional trailing MalRequestOptions."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL operations

The `aniLink.mal.*` methods are grouped by domain: `anime`, `manga`, `user`, and `forum`. Every operation takes a typed params object and an optional trailing `MalRequestOptions` with `fields` selection and transport settings, merged over the instance defaults.

Each operation's full request parameters, response shape, auth requirements, and errors live in the [MAL operation catalog](/operations/mal/anime), generated from source metadata so they cannot drift from the code.

## Selecting fields

`fields` accepts a comma-separated string or an array. Both forms produce the same query parameter. Use either form:

```typescript
// Equivalent:
await aniLink.mal.anime.get({ id: 21 }, { fields: "id,title,main_picture" });
await aniLink.mal.anime.get({ id: 21 }, { fields: ["id", "title", "main_picture"] });
```

Field names are MAL's own, and AniLink passes them through verbatim. See the [MAL API v2 field reference](https://myanimelist.net/apiconfig/references/api/v2) for the full list.

`anime.get` is the only operation with a default for `fields`. If you omit `fields`, it sends `DEFAULT_MAL_ANIME_FIELDS` (`id`, `title`, `main_picture`, `synopsis`, `status`, `mean`, `num_episodes`, `media_type`, `start_date`, `broadcast`, `average_episode_duration`). That default lets `await aniLink.mal.anime.get({ id: 21 })` work without options. An explicit `fields` value replaces the default. The discovery reads (`seasonal`, `ranking`, `suggestions`) omit `fields` when you do not provide it.

## Anime

|                                    Operation                                     |                      Purpose                      |
| :------------------------------------------------------------------------------: | :-----------------------------------------------: |
|                [`anime.get`](/operations/mal/anime#mal-anime-get)                |          One anime by its MyAnimeList ID          |
|             [`anime.search`](/operations/mal/anime#mal-anime-search)             |              Anime search by keyword              |
|           [`anime.seasonal`](/operations/mal/anime#mal-anime-seasonal)           |         The anime of one broadcast season         |
|            [`anime.ranking`](/operations/mal/anime#mal-anime-ranking)            |         One of MAL's anime ranking lists          |
|        [`anime.suggestions`](/operations/mal/anime#mal-anime-suggestions)        |   MAL's suggestions for the authenticated user    |
| [`anime.updateMyListStatus`](/operations/mal/anime#mal-anime-updatemyliststatus) | Update the authenticated user's anime list status |
|     [`anime.deleteFromList`](/operations/mal/anime#mal-anime-deletefromlist)     |       Remove an anime from the user's list        |

```typescript
const anime = await aniLink.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture", "synopsis"] }
);
console.log(anime.title, anime.main_picture?.large);
```

The list writes (`updateMyListStatus`, `deleteFromList`) require a MAL access token. `deleteFromList` is permanent.

## Manga

|                                    Operation                                     |                      Purpose                      |
| :------------------------------------------------------------------------------: | :-----------------------------------------------: |
|                [`manga.get`](/operations/mal/manga#mal-manga-get)                |          One manga by its MyAnimeList ID          |
|             [`manga.search`](/operations/mal/manga#mal-manga-search)             |              Manga search by keyword              |
|            [`manga.ranking`](/operations/mal/manga#mal-manga-ranking)            |         One of MAL's manga ranking lists          |
| [`manga.updateMyListStatus`](/operations/mal/manga#mal-manga-updatemyliststatus) | Update the authenticated user's manga list status |
|     [`manga.deleteFromList`](/operations/mal/manga#mal-manga-deletefromlist)     |        Remove a manga from the user's list        |

```typescript
const status = await aniLink.mal.manga.updateMyListStatus({
    id: 1,
    status: "reading",
    num_chapters_read: 10,
    score: 9,
});
console.log(status.num_chapters_read);
```

## Users

|                          Operation                          |                  Purpose                   |
| :---------------------------------------------------------: | :----------------------------------------: |
|        [`user.me`](/operations/mal/user#mal-user-me)        |   The authenticated user, token required   |
|       [`user.get`](/operations/mal/user#mal-user-get)       | One user profile; MAL documents only `@me` |
| [`user.animeList`](/operations/mal/user#mal-user-animelist) |      One page of a user's anime list       |
| [`user.mangaList`](/operations/mal/user#mal-user-mangalist) |      One page of a user's manga list       |

```typescript
const list = await aniLink.mal.user.animeList(
    { username: "@me", status: "watching", sort: "list_score", limit: 100 },
    { fields: ["id", "title", "list_status"] }
);
console.log(list.data[0]?.node.title, list.data[0]?.list_status?.score);
```

`@me` and private lists require an access token; a client ID alone cannot resolve `@me`. Without a token, `@me` fails fast with `AniLinkAuthError` before any request is sent.

## Forum

|                        Operation                         |              Purpose              |
| :------------------------------------------------------: | :-------------------------------: |
| [`forum.boards`](/operations/mal/forum#mal-forum-boards) |       The forum board tree        |
| [`forum.topics`](/operations/mal/forum#mal-forum-topics) | The forum topic list, filterable  |
|  [`forum.topic`](/operations/mal/forum#mal-forum-topic)  | One topic with its posts and poll |

```typescript
const topic = await aniLink.mal.forum.topic({ id: 23744 });
console.log(topic.data.title, topic.data.posts[0]?.body);
```

## Paging and caching notes

The list endpoints (`search`, `ranking`, `seasonal`, `suggestions`, `user.animeList`, `user.mangaList`, `forum.topics`) return a `paging` node. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually only with care: manual requests bypass the library's pacing, retry, and circuit breaker. Prefer the [`mal.paginate` helpers](/guides/mal/pagination), which walk these endpoints with the guards applied.

With `responseCache` enabled, list reads can remain stale for `ttlMs` after `updateMyListStatus`. The cache uses a TTL and does not invalidate entries after writes.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operation catalog](/operations/mal/anime) lists every operation with its full request and response details, grouped by [anime](/operations/mal/anime), [manga](/operations/mal/manga), [user](/operations/mal/user), and [forum](/operations/mal/forum).
- <Icon name="ArrowRight" :size="14" /> [MAL pagination](/guides/mal/pagination) walks the list endpoints automatically.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) covers transport overrides per call.
