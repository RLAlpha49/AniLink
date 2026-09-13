---
title: MAL client configuration
description: "The mal slot fields — access token and shared transport options — and how they map onto the REST operations."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL client configuration

## `MalCredentials`

| Field | Type | Purpose |
| --- | --- | --- |
| `accessToken` | `string` | The MAL OAuth2 access token used by REST operations |
| `refreshToken` | `string` | Stored refresh token; with `clientId`, enables automatic refresh on `401` (and bootstraps a client that has no `accessToken`) |
| `clientId` | `string` | The MAL application client ID used by OAuth helpers |
| `clientSecret` | `string` | Optional. Only for applications that require one |
| `onTokenRefresh` | `(response: MalTokenResponse) => void` | Optional. Fires exactly once per refresh grant so you can persist the new token pair; a throwing callback is reported to `onHookError` and never aborts the replayed request |

Any shared transport option (`timeout`, `retry`, `signal`, hooks, pacing, circuit breaker) may be set in the same slot. It is scoped to MAL — and stays there.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    mal: {
        accessToken: "mal-token",
        refreshToken: "mal-refresh-token",
        clientId: "mal-client-id",
        timeout: 10_000,
        onTokenRefresh: (response) => saveTokens(response), // persist refreshed pairs
    },
});
```

With `refreshToken` and `clientId` both set, a `401` triggers an automatic refresh and a single replay — see [MAL authentication](/guides/mal/authentication#_4-automatic-refresh). A client configured with only those two fields (no `accessToken`) bootstraps itself on the first auth-required call.

## `buildMyAnimeListApi(credentials?)`

The standalone facade builder, exported for when you want MAL without the composed client:

```typescript
import { buildMyAnimeListApi } from "anilink-api-wrapper";

const api = buildMyAnimeListApi({ accessToken: "mal-token" });
const anime = await api.anime.get({ id: 21 });
```

`buildMyAnimeListApi` resolves credentials and composes the same `MyAnimeListApi` surface the `AniLink` client exposes under `mal` — identical behavior, smaller footprint.

## Two ways to construct

```typescript
// Composed client (recommended when using both providers)
new AniLink({ mal: { accessToken: "mal-token" } });

// Standalone MAL facade
buildMyAnimeListApi({ accessToken: "mal-token" });
```

Both produce identical MAL behavior. The difference? The composed client also carries the AniList surface.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) — the operations themselves.
- <Icon name="ArrowRight" :size="14" /> [MAL authentication](/guides/mal/authentication) — obtaining the tokens.
