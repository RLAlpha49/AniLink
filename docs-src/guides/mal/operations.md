---
title: MAL operations
layout: .vitepress/theme/DocsLayout.vue
---

# MAL operations

## `mal.anime.get(id, options?)`

Gets one anime by its MyAnimeList ID. Calls `GET /anime/{id}` on the MAL API v2.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | The MyAnimeList anime ID |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings, merged over the instance defaults |

**Auth:** not required for public anime data. Pass an access token for list-related fields.

**Returns:** `MalAnime` — `id` and `title` are always present. `main_picture` and any other requested fields appear when selected via `fields`. Extra fields are exposed through an index signature without narrowing.

```typescript
const anime = await aniLink.mal.anime.get(21, {
    fields: ["id", "title", "main_picture", "synopsis"],
});
console.log(anime.title, anime.main_picture?.large);
```

**Errors:** `AniLinkApiError` for non-success responses (e.g. `404` unknown ID, `400` invalid fields). `AniLinkNetworkError` covers timeout, cancellation, or transport failures.

**Reference:** [MAL anime details endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html)

## `mal.user.me(options?)`

Gets the currently authenticated user. Calls `GET /users/@me`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | `MalRequestOptions` | no | Field selection plus transport settings |

**Auth:** required — a MAL access token from `MalCredentials.accessToken`. Without one, `AniLinkAuthError` is thrown before any request is sent.

**Returns:** `MalUser` — `id` and `name` are always present. `location`, `joined_at`, and other requested fields appear when selected.

```typescript
const user = await aniLink.mal.user.me({
    fields: ["id", "name", "location", "joined_at"],
});
console.log(user.name);
```

**Errors:** `AniLinkAuthError` (no token configured), `AniLinkApiError` (e.g. `401` expired token), `AniLinkNetworkError`.

**Reference:** [MAL user endpoint](https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get) · [TypeDoc](/typedoc/interfaces/apis_rest_mal_facade.MyAnimeListUserApi.html)

## `fields` selection

`fields` accepts a comma-separated string or an array — both produce the same query parameter:

```typescript
// Equivalent:
await aniLink.mal.anime.get(21, { fields: "id,title,main_picture" });
await aniLink.mal.anime.get(21, { fields: ["id", "title", "main_picture"] });
```

Field names are MAL's own. AniLink passes them through verbatim. See the [MAL API v2 field reference](https://myanimelist.net/apiconfig/references/api/v2).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — transport overrides per call.
