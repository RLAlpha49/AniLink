---
title: MAL operations
description: "The MyAnimeList REST operation surface: anime and manga lookups, seasonal, rankings, suggestions, and user lists with parameter tables per operation."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL operations

## `mal.anime.get(params, options?)`

Gets one anime by its MyAnimeList ID. Calls `GET /anime/{id}` on the MAL API v2 — the bread-and-butter lookup.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `params`  | `MalAnimeGetParams` | yes      | `{ id }` — the MyAnimeList anime ID                                        |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public anime data. Pass an access token for list-related fields — the public data is free, the personal data is not.

**Returns:** `MalAnime` — `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Extra fields are exposed through an index signature without narrowing, so nothing you ask for is hidden from you.

```typescript
const anime = await aniLink.mal.anime.get(
    { id: 21 },
    { fields: ["id", "title", "main_picture", "synopsis"] }
);
console.log(anime.title, anime.main_picture?.large);
```

**Errors:** `AniLinkRestError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.user.me(options?)`

Gets the currently authenticated user. Calls `GET /users/@me` — the "who am I?" call.

| Parameter | Type                | Required | Description                             |
| --------- | ------------------- | -------- | --------------------------------------- |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent. No token, no trip.

**Returns:** `MalUser` — `id` and `name` are always present. `location`, `joined_at`, and other requested fields appear when selected.

```typescript
const user = await aniLink.mal.user.me({
    fields: ["id", "name", "location", "joined_at"],
});
console.log(user.name);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL user endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.user.animeList(params, options?)`

Gets a user's anime list, one page at a time. Calls `GET /users/{username}/animelist` — the paginated read that was missing while AniList users had first-class pagination helpers all along.

| Parameter | Type                     | Required | Description                                                                                    |
| --------- | ------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `params`  | `MalUserAnimeListParams` | yes      | `{ username, status?, sort?, limit?, offset? }` — the user name or `@me` plus the list filters |
| `options` | `MalRequestOptions`      | no       | Field selection plus transport settings, merged over the instance defaults                     |

**Auth:** not required for public user lists — `@me` and private lists require an access token; a client ID alone cannot resolve `@me`. Without a token, `@me` fails fast with `AniLinkAuthError` before any request is sent.

**Returns:** `MalUserAnimeListResponse` — `data` holds one `MalUserAnimeListEntry` per entry: a `node` shaped by `fields` plus a `list_status` wrapper that appears when requested (for example `list_status{priority,comments}`). `paging.next` and `paging.previous` carry the next/previous page URLs when the list continues in that direction; the paging is offset-based, so the next URL carries the incremented `offset`. Follow pages manually — manual requests bypass the library's pacing, retry, and circuit breaker, so space them out on long lists. With `responseCache` enabled, list reads may be stale for `ttlMs` after `updateMyListStatus` — the cache is TTL-only and does not invalidate on writes.

```typescript
const list = await aniLink.mal.user.animeList(
    { username: "@me", status: "watching", sort: "list_score", limit: 100 },
    { fields: ["id", "title", "list_status"] }
);
console.log(list.data[0]?.node.title, list.data[0]?.list_status?.score);
```

**Errors:** `AniLinkAuthError` (`@me` without a token — thrown before any request is sent), `AniLinkValidationError` (empty or whitespace-only `username` — thrown before any request is sent), `AniLinkRestError` for non-success responses (e.g. `400` invalid status or sort, `401` expired token). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL user anime list endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.user.mangaList(params, options?)`

Gets a user's manga list, one page at a time. Calls `GET /users/{username}/mangalist` — the manga twin of `user.animeList`.

| Parameter | Type                     | Required | Description                                                                                    |
| --------- | ------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `params`  | `MalUserMangaListParams` | yes      | `{ username, status?, sort?, limit?, offset? }` — the user name or `@me` plus the list filters |
| `options` | `MalRequestOptions`      | no       | Field selection plus transport settings, merged over the instance defaults                     |

**Auth:** not required for public user lists — `@me` and private lists require an access token; a client ID alone cannot resolve `@me`. Without a token, `@me` fails fast with `AniLinkAuthError` before any request is sent.

**Returns:** `MalUserMangaListResponse` — `data` holds one `MalUserMangaListEntry` per entry: a `node` shaped by `fields` plus a `list_status` wrapper that appears when requested. `paging.next` and `paging.previous` carry the next/previous page URLs when the list continues in that direction; the paging is offset-based, so the next URL carries the incremented `offset`. Follow pages manually — manual requests bypass the library's pacing, retry, and circuit breaker. With `responseCache` enabled, list reads may be stale for `ttlMs` after `updateMyListStatus` — the cache is TTL-only and does not invalidate on writes.

```typescript
const list = await aniLink.mal.user.mangaList(
    { username: "@me", status: "reading", sort: "list_updated_at" },
    { fields: ["id", "title", "list_status"] }
);
console.log(list.data[0]?.node.title, list.data[0]?.list_status?.score);
```

**Errors:** `AniLinkAuthError` (`@me` without a token — thrown before any request is sent), `AniLinkValidationError` (empty or whitespace-only `username` — thrown before any request is sent), `AniLinkRestError` for non-success responses (e.g. `400` invalid status or sort, `401` expired token). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL user manga list endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.manga.get(params, options?)`

Gets one manga by its MyAnimeList ID. Calls `GET /manga/{id}` on the MAL API v2 — the manga twin of `anime.get`.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `params`  | `MalMangaGetParams` | yes      | `{ id }` — the MyAnimeList manga ID                                        |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public manga data. Pass an access token for list-related fields — same deal as `anime.get`.

**Returns:** `MalManga` — `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Manga-specific fields such as `num_chapters` and `num_volumes` are available through the same `fields` selector. Extra fields are exposed through an index signature without narrowing.

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

Updates the authenticated user's manga list status. Calls `PATCH /manga/{id}/my_list_status` with a form-urlencoded body — MAL rejects JSON on this endpoint, so do not try to be clever.

| Parameter | Type                             | Required | Description                                                                                         |
| --------- | -------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `params`  | `MalMangaListStatusUpdateParams` | yes      | `{ id, ...fields }` — the manga ID plus only the list-status fields to change, form-encoded for MAL |
| `options` | `MalRequestOptions`              | no       | Field selection plus transport settings, merged over the instance defaults                          |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalMangaListStatus` — the updated list status. MAL reports the chapter count as `num_chapters_read` and returns `tags` as an array of strings. Quirks of the API, faithfully passed through.

```typescript
const status = await aniLink.mal.manga.updateMyListStatus({
    id: 1,
    status: "reading",
    num_chapters_read: 10,
    score: 9,
});
console.log(status.num_chapters_read);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `400` invalid fields), `AniLinkNetworkError`. Excess properties on the params object (typos like `num_chapter_read`) are dropped client-side instead of being form-encoded to MAL.

**Reference:** [MAL manga list-status endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.deleteFromList(params, options?)`

Removes a manga from the authenticated user's list. Calls `DELETE /manga/{id}/my_list_status` — gone means gone.

| Parameter | Type                   | Required | Description                                           |
| --------- | ---------------------- | -------- | ----------------------------------------------------- |
| `params`  | `MalMangaDeleteParams` | yes      | `{ id }` — the MyAnimeList manga ID                   |
| `options` | `MalRequestOptions`    | no       | Transport settings, merged over the instance defaults |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `void` — the response carries no body.

```typescript
await aniLink.mal.manga.deleteFromList({ id: 1 });
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `404` unknown ID), `AniLinkNetworkError`.

**Reference:** [MAL manga list-status delete endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.anime.seasonal(params, options?)`

Gets the anime of one broadcast season. Calls `GET /anime/season/{year}/{season}` — the seasonal chart, the browsing feature third-party apps are built on.

| Parameter | Type                | Required | Description                                                                                     |
| --------- | ------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `params`  | `MalSeasonalParams` | yes      | `{ year, season }` — the year and the broadcast window: `winter`, `spring`, `summer`, or `fall` |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults                      |

**Auth:** not required — a public read, same deal as `anime.get`.

**Returns:** `MalSeasonalAnimeResponse` — `data` holds one `MalSeasonalAnime` per entry: a `node` shaped by `fields`; the entry's rank within the season, when requested, is a `rank` field on the node itself. `paging.next` carries the next-page URL when the list continues; follow it manually for now — manual requests bypass the library's pacing, retry, and circuit-breaker, so space them out on long lists.

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

Gets one of MyAnimeList's anime ranking lists. Calls `GET /anime/ranking` with a `ranking_type` query parameter — the top lists, from `all` to `favorite`.

| Parameter | Type                | Required | Description                                                                                                                       |
| --------- | ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `MalRankingParams`  | yes      | `{ rankingType }` — the ranking list: `all`, `airing`, `upcoming`, `tv`, `ova`, `movie`, `special`, `bypopularity`, or `favorite` |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults                                                        |

**Auth:** not required — a public read, same deal as `anime.get`.

**Returns:** `MalAnimeRankingResponse` — `data` holds one `MalRankingEntry` per position: a `node` shaped by `fields` plus its `ranking.rank`. `paging.next` carries the next-page URL when the list continues; follow it manually — manual requests bypass the library's pacing, retry, and circuit-breaker.

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

Gets MyAnimeList's anime suggestions for the authenticated user. Calls `GET /anime/suggestions` — MAL's idea of what you should watch next.

| Parameter | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `options` | `MalRequestOptions` | no       | Field selection plus transport settings, merged over the instance defaults |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent. Suggestions are personal, so the token is not optional.

**Returns:** `MalAnimeSuggestionsResponse` — `data` holds `MalSuggestion` entries: a `node` shaped by `fields`, with no ranking wrapper here. `paging.next` carries the next-page URL when the list continues; the next page requires the same access token, and manual requests bypass the library's pacing and retry.

```typescript
const suggestions = await aniLink.mal.anime.suggestions({
    fields: ["id", "title", "main_picture"],
});
console.log(suggestions.data[0]?.node.title);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkRestError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL anime suggestions endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `fields` selection

`fields` accepts a comma-separated string or an array — both produce the same query parameter, so pick whichever reads better:

```typescript
// Equivalent:
await aniLink.mal.anime.get({ id: 21 }, { fields: "id,title,main_picture" });
await aniLink.mal.anime.get({ id: 21 }, { fields: ["id", "title", "main_picture"] });
```

Field names are MAL's own, and AniLink passes them through verbatim. See the [MAL API v2 field reference](https://myanimelist.net/apiconfig/references/api/v2) for the full list.

`anime.get` is the one operation with a default: omit `fields` and it sends `DEFAULT_MAL_ANIME_FIELDS` (`id`, `title`, `main_picture`, `synopsis`, `status`, `mean`, `num_episodes`, `media_type`, `start_date`, `broadcast`, `average_episode_duration`), so `await aniLink.mal.anime.get({ id: 21 })` works out of the box. An explicit `fields` value always replaces the default. The discovery reads (`seasonal`, `ranking`, `suggestions`) keep omitting `fields` when none are given.

## Calling convention changes in v3

Every MAL operation with inputs now takes a single params object followed by
the optional trailing options — the same `(params, options?)` convention as
AniList. The parameterless reads — `mal.user.me(options?)` and
`mal.anime.suggestions(options?)` — take the options object alone:

| v2                                                  | v3                                                            |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `mal.anime.get(21)`                                 | `mal.anime.get({ id: 21 })`                                   |
| `mal.anime.seasonal(2024, "winter")`                | `mal.anime.seasonal({ year: 2024, season: "winter" })`        |
| `mal.anime.updateMyListStatus(21, { ... })`         | `mal.anime.updateMyListStatus({ id: 21, ... })`               |
| `mal.user.animeList("@me", { status: "watching" })` | `mal.user.animeList({ username: "@me", status: "watching" })` |

The list filters (`status`, `sort`, `limit`, `offset`) moved from the options
argument into params — they are the API's own inputs. `fields` and every
transport setting stay in the trailing options.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operation catalog](/operations/mal) — every operation on this page with its full request/response anatomy.
- <Icon name="ArrowRight" :size="14" /> [Operation reference overview](/operations/) — how the generated catalogs stay in sync with the code.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — transport overrides per call.
