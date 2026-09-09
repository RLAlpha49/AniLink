---
title: AniList authentication
layout: .vitepress/theme/DocsLayout.vue
---

# AniList authentication

## Constructor token

Pass the token positionally or in the `anilist` credential slot — whichever reads better in your code:

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("anilist-token");
// or
const aniLink2 = new AniLink({ anilist: { authToken: "anilist-token" } });
```

Multiple instances can hold different tokens, and each exposes its own `anilist` surface. One per user, one per bot — your call.

## Public versus authenticated operations

Read-only operations (public media, character, staff queries) work without any token:

```typescript
const aniLink = new AniLink();
const anime = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
```

Mutations and viewer-scoped queries (`viewer`, `notification`, list mutations) want a token. Call them without one and `AniLinkAuthError` is thrown.

## OAuth2 authorization-code flow

AniLink ships helpers for the full flow. First, register an application on the [AniList developer settings](https://anilist.co/settings/developer) page to get a client ID and secret.

<Mermaid
    :code="`sequenceDiagram\n    autonumber\n    participant U as User\n    participant A as Your App\n    participant AL as AniList auth server\n    participant API as AniList API\n\n    U->>A: Start login\n    A->>A: buildAuthorizationUrl(clientId, redirect, state)\n    A->>U: Redirect to AniList authorize URL\n    U->>AL: Authorize app\n    AL->>U: Redirect to callback?code=...&state=...\n    U->>A: Arrive at callback\n    A->>A: Validate state matches\n    A->>AL: getAccessToken(clientId, secret, code, redirect)\n    AL->>A: access_token + refresh_token\n    A->>API: new AniLink(access_token)\n    API->>A: Authenticated data\n\n    Note over A,AL: Token expires (expires_in seconds)\n    A->>A: getTokenExpiry(token) < now - 60s?\n    A->>AL: refreshAccessToken(clientId, secret, refresh_token)\n    AL->>A: New access_token (+ optional refresh_token)\n    A->>API: Continue with fresh token`"
/>

### 1. Send the user to the authorization URL

```typescript
import { buildAuthorizationUrl } from "anilink-api-wrapper";

const state = crypto.randomUUID(); // a fresh random value per login attempt
const authorizeUrl = buildAuthorizationUrl(
    "your-client-id",
    "https://example.com/callback",
    state
);
// Redirect the user to `authorizeUrl`.
```

The third `state` parameter is optional but strongly recommended — it is your CSRF protection. Bind it to the user's session, and validate that the `state` on the redirect matches before exchanging the code.

### 2. Exchange the code for a token

```typescript
import { getAccessToken, AniLink } from "anilink-api-wrapper";

const { access_token, refresh_token } = await getAccessToken(
    "your-client-id",
    "your-client-secret",
    code, // the `code` query parameter from the redirect
    "https://example.com/callback"
);

const aniLink = new AniLink(access_token);
```

### 3. Refresh when the token expires

The refresh response may not include a new `refresh_token`. When it does not, keep using the one you stored:

```typescript
import { refreshAccessToken } from "anilink-api-wrapper";

const { access_token, refresh_token: rotated } = await refreshAccessToken(
    "your-client-id",
    "your-client-secret",
    refresh_token
);

const nextRefreshToken = rotated ?? refresh_token;
```

### 4. Refresh proactively

AniList reports the token lifetime as `expires_in` seconds. Use `getTokenExpiry` to refresh before expiry — no need to wait for a `401` to learn the token is dead:

```typescript
import { getTokenExpiry, refreshAccessToken } from "anilink-api-wrapper";

if (Date.now() >= getTokenExpiry(tokenResponse).getTime() - 60_000) {
    tokenResponse = await refreshAccessToken(
        "your-client-id",
        "your-client-secret",
        nextRefreshToken
    );
}
```

## Constants and types

`ANILIST_AUTHORIZE_URL` and `ANILIST_TOKEN_URL` expose the OAuth endpoints. `AniListTokenResponse` types the token payload (`access_token`, `token_type`, `expires_in`, `refresh_token`) — handy for your own storage layer.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) — transport settings for the authenticated client.
- <Icon name="ArrowRight" :size="14" /> [Mutations](/guides/anilist/mutations) — the operations that require this token.
