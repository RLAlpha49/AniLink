---
title: MAL operations
description: "The MyAnimeList REST operations: anime and manga lookups and search, seasonal, rankings, suggestions, user lists, and the forum reads with parameter tables per operation."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL operations

## `mal.anime.get(params, options?)`

Gets an anime by its MyAnimeList ID with `GET /anime/{id}` on the MAL API v2.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `params`  | `MalAnimeGetParams` | yes      | `{ id }`, the MyAnimeList anime ID                                         |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public anime data. Pass an access token for list-related fields.

**Returns:** `MalAnime`. `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. An index signature exposes extra fields without narrowing.

```typescript
const anime = await aniLink.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture", "synopsis"] }
);
console.log(anime.title, anime.main_picture?.large);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.anime.search(params, options?)`

Searches MyAnimeList anime by keyword with `GET /anime` and a `q` query parameter.

| Parameter | Type                   | Required | Description                                                                                      |
| --------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `params`  | `MalAnimeSearchParams` | yes      | `{ q, limit?, offset? }`, the keyword and optional paging filters. `limit` has a maximum of 100. |
| `options` | `MalRequestOptions`    | no       | Field selection plus transport settings, merged over the instance defaults                       |

**Auth:** not required.

**Returns:** `MalAnimeSearchResponse`. Each result in `data` is a `MalAnimeSearchEntry` with a `node` shaped by `fields`. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker. Space out manual requests on long lists.

```typescript
const results = await aniLink.mal.anime.search(
    { q: "one piece" },
    { fields: ["id", "title", "main_picture"] }
);
console.log(results.data[0]?.node.title);
```

**Errors:** `AniLinkValidationError` when `q` is empty or only whitespace, thrown before any request is sent. `AniLinkRestError` for non-success responses. `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime search endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.user.me(options?)`

Gets the currently authenticated user with `GET /users/@me`.

| Parameter | Type                | Required | Description                             |
| --------- | ------------------- | -------- | --------------------------------------- |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalUser`. `id` and `name` are always present. `location`, `joined_at`, and other requested fields appear when selected.

```typescript
const user = await aniLink.mal.user.me({
    fields: ["id", "name", "location", "joined_at"],
});
console.log(user.name);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL user endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.user.get(params, options?)`

Gets a MyAnimeList user profile with `GET /users/{user_name}`. MyAnimeList documents only `@me` for this endpoint. The library accepts `@me` regardless of case or surrounding whitespace and requires an access token to resolve it. It passes other usernames through, but MyAnimeList currently returns `404`.

| Parameter | Type                | Required | Description                                                                   |
| --------- | ------------------- | -------- | ----------------------------------------------------------------------------- |
| `params`  | `MalUserGetParams`  | yes      | `{ username }`, the MyAnimeList username. This endpoint documents only `@me`. |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults    |

**Auth:** Resolving `@me` requires a MAL access token. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalUser`. `id` and `name` are always present. `location`, `joined_at`, and other requested fields appear when selected via `fields`.

```typescript
const user = await aniLink.mal.user.get(
    { username: "@me" },
    { fields: ["id", "name", "location", "joined_at"] }
);
console.log(user.name);
```

**Errors:** `AniLinkAuthError` when `username` is `@me` and no access token is configured. `AniLinkValidationError` when `username` is empty or only whitespace. `AniLinkRestError` for non-success responses. `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL user endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.user.animeList(params, options?)`

Gets one page of a user's anime list with `GET /users/{username}/animelist`.

| Parameter | Type                     | Required | Description                                                                                   |
| --------- | ------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| `params`  | `MalUserAnimeListParams` | yes      | `{ username, status?, sort?, limit?, offset? }`, the user name or `@me` plus the list filters |
| `options` | `MalRequestOptions`      | no       | Field selection plus transport settings, merged over the instance defaults                    |

**Auth:** not required for public user lists. `@me` and private lists require an access token. A client ID alone cannot resolve `@me`. Without a token, `@me` fails fast with `AniLinkAuthError` before any request is sent.

**Returns:** `MalUserAnimeListResponse`. Each entry in `data` contains a `node` shaped by `fields` and a `list_status` wrapper when requested, for example `list_status{priority,comments}`. When available, `paging.next` and `paging.previous` contain URLs for the next and previous pages. The endpoint uses offsets, so the next URL includes the incremented `offset`. Follow the URLs manually. Manual requests bypass the library's pacing, retry, and circuit breaker. Space out manual requests on long lists. With `responseCache` enabled, list reads can remain stale for `ttlMs` after `updateMyListStatus`. The cache uses a TTL and does not invalidate entries after writes.

```typescript
const list = await aniLink.mal.user.animeList(
    { username: "@me", status: "watching", sort: "list_score", limit: 100 },
    { fields: ["id", "title", "list_status"] }
);
console.log(list.data[0]?.node.title, list.data[0]?.list_status?.score);
```

**Errors:** `AniLinkAuthError` (`@me` without a token, thrown before any request is sent), `AniLinkValidationError` (empty or whitespace-only `username`, thrown before any request is sent), `AniLinkRestError` for non-success responses (e.g. `400` invalid status or sort, `401` expired token). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL user anime list endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.user.mangaList(params, options?)`

Gets one page of a user's manga list with `GET /users/{username}/mangalist`. It follows the same pattern as `user.animeList`.

| Parameter | Type                     | Required | Description                                                                                   |
| --------- | ------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| `params`  | `MalUserMangaListParams` | yes      | `{ username, status?, sort?, limit?, offset? }`, the user name or `@me` plus the list filters |
| `options` | `MalRequestOptions`      | no       | Field selection plus transport settings, merged over the instance defaults                    |

**Auth:** not required for public user lists. `@me` and private lists require an access token. A client ID alone cannot resolve `@me`. Without a token, `@me` fails fast with `AniLinkAuthError` before any request is sent.

**Returns:** `MalUserMangaListResponse`. Each entry in `data` contains a `node` shaped by `fields` and a `list_status` wrapper when requested. When available, `paging.next` and `paging.previous` contain URLs for the next and previous pages. The endpoint uses offsets, so the next URL includes the incremented `offset`. Follow the URLs manually. Manual requests bypass the library's pacing, retry, and circuit breaker. With `responseCache` enabled, list reads can remain stale for `ttlMs` after `updateMyListStatus`. The cache uses a TTL and does not invalidate entries after writes.

```typescript
const list = await aniLink.mal.user.mangaList(
    { username: "@me", status: "reading", sort: "list_updated_at" },
    { fields: ["id", "title", "list_status"] }
);
console.log(list.data[0]?.node.title, list.data[0]?.list_status?.score);
```

**Errors:** `AniLinkAuthError` (`@me` without a token, thrown before any request is sent), `AniLinkValidationError` (empty or whitespace-only `username`, thrown before any request is sent), `AniLinkRestError` for non-success responses (e.g. `400` invalid status or sort, `401` expired token). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL user manga list endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.manga.get(params, options?)`

Gets a manga by its MyAnimeList ID with `GET /manga/{id}` on the MAL API v2. It follows the same pattern as `anime.get`.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `params`  | `MalMangaGetParams` | yes      | `{ id }`, the MyAnimeList manga ID                                         |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public manga data. Pass an access token for list-related fields.

**Returns:** `MalManga`. `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Manga-specific fields such as `num_chapters` and `num_volumes` are available through the same `fields` selector. An index signature exposes extra fields without narrowing.

```typescript
const manga = await aniLink.mal.manga.get(
    { id: 1 },
    { fields: ["id", "title", "main_picture", "num_chapters", "num_volumes"] }
);
console.log(manga.title, manga.main_picture?.large);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL manga details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.updateMyListStatus(params, options?)`

Updates the authenticated user's manga list status. Calls `PATCH /manga/{id}/my_list_status` with a form-urlencoded body. MAL rejects JSON on this endpoint.

| Parameter | Type                             | Required | Description                                                                                        |
| --------- | -------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `params`  | `MalMangaListStatusUpdateParams` | yes      | `{ id, ...fields }`, the manga ID plus only the list-status fields to change, form-encoded for MAL |
| `options` | `MalRequestOptions`              | no       | Field selection plus transport settings, merged over the instance defaults                         |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalMangaListStatus`, the updated list status. MAL reports the chapter count as `num_chapters_read` and returns `tags` as an array of strings. The library preserves those response fields.

```typescript
const status = await aniLink.mal.manga.updateMyListStatus({
    id: 1,
    status: "reading",
    num_chapters_read: 10,
    score: 9,
});
console.log(status.num_chapters_read);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `400` invalid fields), `AniLinkNetworkError`. Before sending the request, the library drops unknown properties from `params`. For example, it drops `num_chapter_read` instead of form-encoding it for MAL.

**Reference:** [MAL manga list-status endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.deleteFromList(params, options?)`

Removes a manga from the authenticated user's list. Calls `DELETE /manga/{id}/my_list_status`. The removal is permanent.

| Parameter | Type                   | Required | Description                                           |
| --------- | ---------------------- | -------- | ----------------------------------------------------- |
| `params`  | `MalMangaDeleteParams` | yes      | `{ id }`, the MyAnimeList manga ID                    |
| `options` | `MalRequestOptions`    | no       | Transport settings, merged over the instance defaults |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `void`. The response carries no body.

```typescript
await aniLink.mal.manga.deleteFromList({ id: 1 });
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `404` unknown ID), `AniLinkNetworkError`.

**Reference:** [MAL manga list-status delete endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.search(params, options?)`

Searches MyAnimeList manga by keyword with `GET /manga` and a `q` query parameter. It follows the same pattern as `anime.search`.

| Parameter | Type                   | Required | Description                                                                                      |
| --------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `params`  | `MalMangaSearchParams` | yes      | `{ q, limit?, offset? }`, the keyword and optional paging filters. `limit` has a maximum of 100. |
| `options` | `MalRequestOptions`    | no       | Field selection plus transport settings, merged over the instance defaults                       |

**Auth:** not required.

**Returns:** `MalMangaSearchResponse`. Each result in `data` is a `MalMangaSearchEntry` with a `node` shaped by `fields`. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker.

```typescript
const results = await aniLink.mal.manga.search(
    { q: "berserk" },
    { fields: ["id", "title", "main_picture"] }
);
console.log(results.data[0]?.node.title);
```

**Errors:** `AniLinkValidationError` when `q` is empty or only whitespace, thrown before any request is sent. `AniLinkRestError` for non-success responses. `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL manga search endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.ranking(params, options?)`

Gets one of MyAnimeList's manga ranking lists with `GET /manga/ranking` and a `ranking_type` query parameter. It follows the same pattern as `anime.ranking`.

| Parameter | Type                    | Required | Description                                                                                                                            |
| --------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `MalMangaRankingParams` | yes      | `{ rankingType }`, the ranking list: `all`, `manga`, `novels`, `oneshots`, `doujin`, `manhwa`, `manhua`, `bypopularity`, or `favorite` |
| `options` | `MalRequestOptions`     | no       | Field selection plus transport settings, merged over the instance defaults                                                             |

**Auth:** not required.

**Returns:** `MalMangaRankingResponse`. Each position in `data` has a `MalMangaRankingEntry` with a `node` shaped by `fields` and a `ranking.rank` value. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker.

```typescript
const top = await aniLink.mal.manga.ranking(
    { rankingType: "manga" },
    { fields: ["id", "title", "mean"] }
);
console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `400` invalid ranking type). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL manga ranking endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_ranking_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.anime.updateMyListStatus(params, options?)`

Updates the authenticated user's anime list status with a form-urlencoded `PATCH /anime/{id}/my_list_status` request. MAL rejects JSON on this endpoint. The request follows the same pattern as `mal.manga.updateMyListStatus`.

| Parameter | Type                             | Required | Description                                                                                        |
| --------- | -------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `params`  | `MalAnimeListStatusUpdateParams` | yes      | `{ id, ...fields }`, the anime ID plus only the list-status fields to change, form-encoded for MAL |
| `options` | `MalRequestOptions`              | no       | Field selection plus transport settings, merged over the instance defaults                         |

Every payload field is optional. Send only the ones you want to change. The `MalAnimeListStatusUpdate` fields:

| Field                  | Type       | Description                                                                                      |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `status`               | `string`   | The watch status. Values are `watching`, `completed`, `on_hold`, `dropped`, and `plan_to_watch`. |
| `num_watched_episodes` | `number`   | The number of episodes the user has watched                                                      |
| `score`                | `number`   | The user's score out of 10                                                                       |
| `comments`             | `string`   | Free-form notes attached to the entry                                                            |
| `is_rewatching`        | `boolean`  | Whether the user is currently rewatching the anime                                               |
| `num_times_rewatched`  | `number`   | The number of times the user has rewatched the anime                                             |
| `rewatch_value`        | `number`   | The rewatch value rating (0-5)                                                                   |
| `priority`             | `number`   | The priority rating (0-2)                                                                        |
| `tags`                 | `string[]` | User-defined tags. AniLink sends them to MAL as a comma-separated string.                        |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalAnimeListStatus`, the updated list status. MAL returns the episode count as `num_episodes_watched`, while the request field is `num_watched_episodes`. MAL also returns `tags` as an array of strings. The library preserves these response fields.

```typescript
const status = await aniLink.mal.anime.updateMyListStatus({
    id: 21,
    status: "watching",
    num_watched_episodes: 10,
    score: 9,
});
console.log(status.num_episodes_watched);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkValidationError` (params carries no list-status field to change, thrown before any request is sent), `AniLinkRestError` (e.g. `400` invalid fields), `AniLinkNetworkError`. Before sending the request, the library drops unknown properties from `params`. For example, it drops `num_watched_episode` instead of form-encoding it for MAL.

**Reference:** [MAL anime list-status endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.anime.deleteFromList(params, options?)`

Removes an anime from the authenticated user's list. Calls `DELETE /anime/{id}/my_list_status`. The removal is permanent.

| Parameter | Type                   | Required | Description                                           |
| --------- | ---------------------- | -------- | ----------------------------------------------------- |
| `params`  | `MalAnimeDeleteParams` | yes      | `{ id }`, the MyAnimeList anime ID                    |
| `options` | `MalRequestOptions`    | no       | Transport settings, merged over the instance defaults |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `void`. The response carries no body.

```typescript
await aniLink.mal.anime.deleteFromList({ id: 21 });
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `404` unknown ID), `AniLinkNetworkError`.

**Reference:** [MAL anime list-status delete endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.anime.seasonal(params, options?)`

Gets the anime list for one broadcast season with `GET /anime/season/{year}/{season}`.

| Parameter | Type                | Required | Description                                                                                    |
| --------- | ------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `params`  | `MalSeasonalParams` | yes      | `{ year, season }`, the year and the broadcast window: `winter`, `spring`, `summer`, or `fall` |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults                     |

**Auth:** not required.

**Returns:** `MalSeasonalAnimeResponse`. Each entry in `data` is a `MalSeasonalAnime` with a `node` shaped by `fields`. If requested, the node's `rank` field gives its rank in the season. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker. Space out manual requests on long lists.

```typescript
const season = await aniLink.mal.anime.seasonal(
    { year: 2024, season: "winter" },
    { fields: ["id", "title", "main_picture", "rank"] }
);
console.log(season.data[0]?.node.title, season.data[0]?.node.rank);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `404` unknown season). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL seasonal anime endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.anime.ranking(params, options?)`

Gets one of MyAnimeList's anime ranking lists with `GET /anime/ranking` and a `ranking_type` query parameter.

| Parameter | Type                | Required | Description                                                                                                                      |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `MalRankingParams`  | yes      | `{ rankingType }`, the ranking list: `all`, `airing`, `upcoming`, `tv`, `ova`, `movie`, `special`, `bypopularity`, or `favorite` |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults                                                       |

**Auth:** not required.

**Returns:** `MalAnimeRankingResponse`. Each position in `data` has a `MalRankingEntry` with a `node` shaped by `fields` and a `ranking.rank` value. When more results remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker.

```typescript
const top = await aniLink.mal.anime.ranking(
    { rankingType: "airing" },
    { fields: ["id", "title", "mean"] }
);
console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `400` invalid ranking type). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime ranking endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.anime.suggestions(options?)`

Gets MyAnimeList's anime suggestions for the authenticated user. Calls `GET /anime/suggestions`.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** requires a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalAnimeSuggestionsResponse`. `data` contains `MalSuggestion` entries, each with a `node` shaped by `fields`. The response has no ranking wrapper. When the list continues, `paging.next` contains the next-page URL. Use the same access token for the next page. Manual requests bypass the library's pacing and retry logic.

```typescript
const suggestions = await aniLink.mal.anime.suggestions({
    fields: ["id", "title", "main_picture"],
});
console.log(suggestions.data[0]?.node.title);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL anime suggestions endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.forum.boards(options?)`

Gets the MyAnimeList forum board tree with `GET /forum/boards`.

| Parameter | Type                | Required | Description                                           |
| --------- | ------------------- | -------- | ----------------------------------------------------- |
| `options` | `MalRequestOptions` | no       | Transport settings, merged over the instance defaults |

**Auth:** not required.

**Returns:** `MalForumBoardsResponse`. `categories` holds one `MalForumCategory` per group, each carrying its `MalForumBoard` entries with their `subboards`.

```typescript
const boards = await aniLink.mal.forum.boards();
console.log(boards.categories[0]?.boards[0]?.title);
```

**Errors:** `AniLinkRestError` for non-success responses. `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL forum boards endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListForumApi.html)

## `mal.forum.topics(params, options?)`

Gets the MyAnimeList forum topic list, one page at a time. Calls `GET /forum/topics`, filterable by board, keyword, and creator.

| Parameter | Type                   | Required | Description                                                                                                                                 |
| --------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `MalForumTopicsParams` | no       | `{ boardId?, subboardId?, q?, topicUserName?, userName?, sort?, limit?, offset? }`, every filter is optional. `limit` has a maximum of 100. |
| `options` | `MalRequestOptions`    | no       | Transport settings, merged over the instance defaults                                                                                       |

**Auth:** not required.

**Returns:** `MalForumTopicsResponse`. Each topic in `data` is a `MalForumTopicSummary` with a title, creator, post count, and last-post info. When more topics remain, `paging.next` contains the next-page URL. Follow that URL manually. Manual requests bypass the library's pacing, retry, and circuit breaker.

```typescript
const topics = await aniLink.mal.forum.topics({ q: "one piece" });
console.log(topics.data[0]?.title);
```

**Errors:** `AniLinkRestError` for non-success responses. `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL forum topics endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListForumApi.html)

## `mal.forum.topic(params, options?)`

Gets one forum topic with its posts and poll. Calls `GET /forum/topic/{topic_id}`.

| Parameter | Type                  | Required | Description                                                                                             |
| --------- | --------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `params`  | `MalForumTopicParams` | yes      | `{ id, limit?, offset? }`, the topic ID and optional post-paging filters. `limit` has a maximum of 100. |
| `options` | `MalRequestOptions`   | no       | Transport settings, merged over the instance defaults                                                   |

**Auth:** not required.

**Returns:** `MalForumTopicResponse`. `data` is the topic's `MalForumTopicDetail`: `title`, `posts` (each with its author and body), and `poll` when one is attached. `paging.next` carries the next post-page URL when the topic continues.

```typescript
const topic = await aniLink.mal.forum.topic({ id: 23744 });
console.log(topic.data.title, topic.data.posts[0]?.body);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `404` unknown topic). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL forum topic endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListForumApi.html)

## `fields` selection

`fields` accepts a comma-separated string or an array. Both forms produce the same query parameter. Use either form:

```typescript
// Equivalent:
await aniLink.mal.anime.get({ id: 21 }, { fields: "id,title,main_picture" });
await aniLink.mal.anime.get({ id: 21 }, { fields: ["id", "title", "main_picture"] });
```

Field names are MAL's own, and AniLink passes them through verbatim. See the [MAL API v2 field reference](https://myanimelist.net/apiconfig/references/api/v2) for the full list.

`anime.get` is the only operation with a default for `fields`. If you omit `fields`, it sends `DEFAULT_MAL_ANIME_FIELDS` (`id`, `title`, `main_picture`, `synopsis`, `status`, `mean`, `num_episodes`, `media_type`, `start_date`, `broadcast`, `average_episode_duration`). That default lets `await aniLink.mal.anime.get({ id: 21 })` work without options. An explicit `fields` value replaces the default. The discovery reads (`seasonal`, `ranking`, `suggestions`) omit `fields` when you do not provide it.

## Calling convention changes in v3

Every MAL operation with inputs now takes a single params object followed by
the optional trailing options, the same `(params, options?)` convention as
AniList. The parameterless reads, `mal.user.me(options?)` and
`mal.anime.suggestions(options?)`, take the options object alone:

| v2                                                  | v3                                                            |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `mal.anime.get(21)`                                 | `mal.anime.get({ id: 21 })`                                   |
| `mal.anime.seasonal(2024, "winter")`                | `mal.anime.seasonal({ year: 2024, season: "winter" })`        |
| `mal.anime.updateMyListStatus(21, { ... })`         | `mal.anime.updateMyListStatus({ id: 21, ... })`               |
| `mal.user.animeList("@me", { status: "watching" })` | `mal.user.animeList({ username: "@me", status: "watching" })` |

The list filters (`status`, `sort`, `limit`, `offset`) moved from the options
argument into params. They are the API's own inputs. `fields` and every
transport setting stay in the trailing options.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operation catalog](/operations/mal/anime) lists every operation on this page with its full request and response details, grouped by [anime](/operations/mal/anime), [manga](/operations/mal/manga), [user](/operations/mal/user), and [forum](/operations/mal/forum).
- <Icon name="ArrowRight" :size="14" /> [Operation reference overview](/operations/) explains how the generated catalogs stay in sync with the code.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) covers transport overrides per call.
