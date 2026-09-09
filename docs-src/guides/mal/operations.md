---
title: MAL operations
layout: .vitepress/theme/DocsLayout.vue
---

# MAL operations

## `mal.anime.get(id, options?)`

Gets one anime by its MyAnimeList ID. Calls `GET /anime/{id}` on the MAL API v2 — the bread-and-butter lookup.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | The MyAnimeList anime ID |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public anime data. Pass an access token for list-related fields — the public data is free, the personal data is not.

**Returns:** `MalAnime` — `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Extra fields are exposed through an index signature without narrowing, so nothing you ask for is hidden from you.

```typescript
const anime = await aniLink.mal.anime.get(21, {
    fields: ["id", "title", "main_picture", "synopsis"],
});
console.log(anime.title, anime.main_picture?.large);
```

**Errors:** `AniLinkApiError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get) · [TypeDoc](/typedoc/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.user.me(options?)`

Gets the currently authenticated user. Calls `GET /users/@me` — the "who am I?" call.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent. No token, no trip.

**Returns:** `MalUser` — `id` and `name` are always present. `location`, `joined_at`, and other requested fields appear when selected.

```typescript
const user = await aniLink.mal.user.me({
    fields: ["id", "name", "location", "joined_at"],
});
console.log(user.name);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkApiError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL user endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get) · [TypeDoc](/typedoc/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `mal.manga.get(id, options?)`

Gets one manga by its MyAnimeList ID. Calls `GET /manga/{id}` on the MAL API v2 — the manga twin of `anime.get`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | The MyAnimeList manga ID |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public manga data. Pass an access token for list-related fields — same deal as `anime.get`.

**Returns:** `MalManga` — `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Manga-specific fields such as `num_chapters` and `num_volumes` are available through the same `fields` selector. Extra fields are exposed through an index signature without narrowing.

```typescript
const manga = await aniLink.mal.manga.get(1, {
    fields: ["id", "title", "main_picture", "num_chapters", "num_volumes"],
});
console.log(manga.title, manga.main_picture?.large);
```

**Errors:** `AniLinkApiError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL manga details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get) · [TypeDoc](/typedoc/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.updateMyListStatus(id, payload, options?)`

Updates the authenticated user's manga list status. Calls `PATCH /manga/{id}/my_list_status` with a form-urlencoded body — MAL rejects JSON on this endpoint, so do not try to be clever.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | The MyAnimeList manga ID |
| `payload` | `MalMangaListStatusUpdate` | yes | The list-status fields to update; only the fields to change, form-encoded for MAL |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings, merged over the instance defaults |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalMangaListStatus` — the updated list status. MAL reports the chapter count as `num_chapters_read` and returns `tags` as a single comma-separated string. Quirks of the API, faithfully passed through.

```typescript
const status = await aniLink.mal.manga.updateMyListStatus(1, {
    status: "reading",
    num_chapters_read: 10,
    score: 9,
});
console.log(status.num_chapters_read);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkApiError` (e.g. `400` invalid fields), `AniLinkNetworkError`.

**Reference:** [MAL manga list-status endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put) · [TypeDoc](/typedoc/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `mal.manga.deleteFromList(id, options?)`

Removes a manga from the authenticated user's list. Calls `DELETE /manga/{id}/my_list_status` — gone means gone.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | The MyAnimeList manga ID |
| `options` | `MalRequestOptions` | no | Transport settings, merged over the instance defaults |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `void` — the response carries no body.

```typescript
await aniLink.mal.manga.deleteFromList(1);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkApiError` (e.g. `404` unknown ID), `AniLinkNetworkError`.

**Reference:** [MAL manga list-status delete endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete) · [TypeDoc](/typedoc/apis_rest_mal_facade.MyAnimeListMangaApi.html)

## `fields` selection

`fields` accepts a comma-separated string or an array — both produce the same query parameter, so pick whichever reads better:

```typescript
// Equivalent:
await aniLink.mal.anime.get(21, { fields: "id,title,main_picture" });
await aniLink.mal.anime.get(21, { fields: ["id", "title", "main_picture"] });
```

Field names are MAL's own, and AniLink passes them through verbatim. See the [MAL API v2 field reference](https://myanimelist.net/apiconfig/references/api/v2) for the full list.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — transport overrides per call.
