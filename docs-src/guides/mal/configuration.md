---
title: MAL client configuration
description: "The mal slot fields for the access token and shared transport options, and how they map onto the REST operations."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL client configuration

## `MalCredentials`

| Field            | Type                                   | Purpose                                                                                                                                                                                |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessToken`    | `string`                               | The MAL OAuth2 access token used by REST operations                                                                                                                                    |
| `refreshToken`   | `string`                               | Stored refresh token. With `clientId`, it enables automatic refresh on `401` and lets a client without `accessToken` bootstrap on its first auth-required call.                        |
| `clientId`       | `string`                               | The MAL application client ID used by OAuth helpers                                                                                                                                    |
| `clientSecret`   | `string`                               | Optional. Only for applications that require one                                                                                                                                       |
| `onTokenRefresh` | `(response: MalTokenResponse) => void` | Optional. Fires exactly once per refresh grant so you can persist the new token pair. If the callback throws, AniLink reports the error through `onHookError` and replays the request. |

You can set any shared transport option (`timeout`, `retry`, `signal`, hooks, pacing, circuit breaker) in the same slot. It is scoped to MAL only.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    mal: {
        accessToken: "mal-token",
        refreshToken: "mal-refresh-token",
        clientId: "mal-client-id",
        timeout: 10_000,
        onTokenRefresh: (response) => saveTokens(response), // persist the refreshed token pair
    },
});
```

With both `refreshToken` and `clientId` set, a `401` triggers an automatic refresh and one replay. See [MAL authentication](/guides/mal/authentication#_4-automatic-refresh). A client without `accessToken` refreshes on its first auth-required call when you set those two fields.

## `buildMyAnimeListApi(credentials?)`

The standalone facade builder, exported for when you want MAL without the composed client:

```typescript
import { buildMyAnimeListApi } from "anilink-api-wrapper";

const api = buildMyAnimeListApi({ accessToken: "mal-token" });
const anime = await api.anime.get({ id: 21 });
```

`buildMyAnimeListApi` resolves MAL credentials and builds a standalone `MyAnimeListApi`. The `AniLink` client uses the same builder for its `mal` property. Use it when you need only the MAL client.

## Two ways to construct

```typescript
// Composed client (recommended when using both providers)
new AniLink({ mal: { accessToken: "mal-token" } });

// Standalone MAL facade
buildMyAnimeListApi({ accessToken: "mal-token" });
```

Both provide the same MAL behavior. The composed client also includes the AniList operations.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) documents every operation.
- <Icon name="ArrowRight" :size="14" /> [MAL authentication](/guides/mal/authentication) explains how to obtain the tokens.
