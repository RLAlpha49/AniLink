# Multi-provider examples

AniLink keeps each provider behind its own namespace. The same instance can use AniList and MyAnimeList without sharing authentication fields between them.

## Provider-scoped clients

```typescript
import { AniLink } from "anilink-api-wrapper";

const client = new AniLink({
    anilist: {
        authToken: "anilist-access-token",
        timeout: 15_000,
    },
    mal: {
        accessToken: "mal-access-token",
        timeout: 10_000,
    },
});

const viewer = await client.anilist.query.viewer();
const anime = await client.mal.anime.get(21, {
    fields: ["id", "title", "main_picture"],
});
const malUser = await client.mal.user.me();
```

Transport options such as `timeout`, `retry`, and cancellation signals are scoped to the provider where they are declared. A MAL access token is never sent to AniList, and an AniList bearer token is never sent to MAL.

## MAL OAuth2 with PKCE

Create and store a PKCE verifier for the login attempt, then send the user to the MAL authorization URL:

```typescript
import { buildMalAuthorizationUrl } from "anilink-api-wrapper";

const authorizeUrl = buildMalAuthorizationUrl("mal-client-id", "s256-code-challenge", "csrf-state");
// Redirect the user to authorizeUrl.
```

After MAL redirects back with a code, exchange it for tokens using the original verifier:

```typescript
import { getMalAccessToken, AniLink } from "anilink-api-wrapper";

const token = await getMalAccessToken({
    clientId: "mal-client-id",
    code,
    codeVerifier,
});

const client = new AniLink({
    mal: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        clientId: "mal-client-id",
    },
});
```

Refresh the access token before it expires and replace the stored token when MAL rotates it:

```typescript
import { getMalTokenExpiry, refreshMalAccessToken } from "anilink-api-wrapper";

if (Date.now() >= getMalTokenExpiry(token).getTime() - 60_000) {
    const refreshed = await refreshMalAccessToken({
        clientId: "mal-client-id",
        refreshToken: token.refresh_token,
    });
    token = {
        ...refreshed,
        refresh_token: refreshed.refresh_token ?? token.refresh_token,
    };
}
```
