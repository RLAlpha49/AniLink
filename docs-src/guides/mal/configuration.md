---
title: MAL client configuration
layout: .vitepress/theme/DocsLayout.vue
---

# MAL client configuration

## `MalCredentials`

| Field | Type | Purpose |
| --- | --- | --- |
| `accessToken` | `string` | The MAL OAuth2 access token used by REST operations |
| `refreshToken` | `string` | Stored refresh token for `refreshMalAccessToken` |
| `clientId` | `string` | The MAL application client ID used by OAuth helpers |
| `clientSecret` | `string` | Optional. Only for applications that require one |

Any shared transport option (`timeout`, `retry`, `signal`, hooks, pacing, circuit breaker) may be set in the same slot. It is scoped to MAL.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    mal: {
        accessToken: "mal-token",
        refreshToken: "mal-refresh-token",
        clientId: "mal-client-id",
        timeout: 10_000,
    },
});
```

## `buildMyAnimeListApi(credentials?)`

The standalone facade builder, exported for use without the composed client:

```typescript
import { buildMyAnimeListApi } from "anilink-api-wrapper";

const api = buildMyAnimeListApi({ accessToken: "mal-token" });
const anime = await api.anime.get(21);
```

`buildMyAnimeListApi` resolves credentials and composes the same `MyAnimeListApi` surface the `AniLink` client exposes under `mal`.

## Two ways to construct

```typescript
// Composed client (recommended when using both providers)
new AniLink({ mal: { accessToken: "mal-token" } });

// Standalone MAL facade
buildMyAnimeListApi({ accessToken: "mal-token" });
```

Both produce identical MAL behavior. The composed client also carries the AniList surface.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) — the operations themselves.
- <Icon name="ArrowRight" :size="14" /> [MAL authentication](/guides/mal/authentication) — obtaining the tokens.
