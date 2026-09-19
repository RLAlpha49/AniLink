---
title: AniList authentication
description: "Create an AniList GraphQL client token and pass it positionally or in the anilist credential slot."
layout: .vitepress/theme/DocsLayout.vue
---

# AniList authentication

## Constructor token

Pass the token positionally or in the `anilist` credential slot, whichever reads better in your code:

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("anilist-token");
// or
const aniLink2 = new AniLink({ anilist: { authToken: "anilist-token" } });
```

Multiple instances can hold different tokens, and each exposes its own `anilist` API. Use one instance per user or one per bot, whichever you prefer.

## Public versus authenticated operations

Read-only operations (public media, character, staff queries) work without any token:

```typescript
const aniLink = new AniLink();
const anime = await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
```

Mutations and viewer-scoped queries (`viewer`, `notification`, list mutations) require a token. Calling them without one throws `AniLinkAuthError`.

## OAuth2 authorization-code flow

AniLink ships helpers for the full flow. First, register an application on the [AniList developer settings](https://anilist.co/settings/developer) page to get a client ID and secret.

<Mermaid
    :code="`sequenceDiagram\n    autonumber\n    participant U as User\n    participant A as Your App\n    participant AL as AniList auth server\n    participant API as AniList API\n\n    U->>A: Start login\n    A->>A: buildAuthorizationUrl(clientId, redirect, state)\n    A->>U: Redirect to AniList authorize URL\n    U->>AL: Authorize app\n    AL->>U: Redirect to callback?code=...&state=...\n    U->>A: Arrive at callback\n    A->>A: Validate state matches\n    A->>AL: getAccessToken(clientId, secret, code, redirect)\n    AL->>A: access_token + refresh_token\n    A->>API: new AniLink(access_token)\n    API->>A: Authenticated data\n\n    Note over A,AL: Token expires (expires_in seconds)\n    A->>A: getTokenExpiry(token) < now - 60s?\n    A->>AL: refreshAccessToken(clientId, secret, refresh_token)\n    AL->>A: New access_token (+ optional refresh_token)\n    A->>API: Continue with fresh token`"
/>

### 1. Send the user to the authorization URL

```typescript
import { buildAuthorizationUrl } from "anilink-api-wrapper";

const state = crypto.randomUUID(); // a fresh random value per login attempt
const authorizeUrl = buildAuthorizationUrl("your-client-id", "https://example.com/callback", state);
// Redirect the user to `authorizeUrl`.
```

The third `state` parameter is optional but strongly recommended. It is your CSRF protection. Bind it to the user's session, and validate that the `state` on the redirect matches before exchanging the code.

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

AniList reports the token lifetime as `expires_in` seconds. Use `getTokenExpiry` to refresh before expiry, so you do not need to wait for a `401` to learn the token has expired:

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

## 5. Automatic refresh

Steps 1 to 4 leave refreshing to you. Configure `refreshToken`, `clientId`, and `clientSecret`, and the client handles refreshing. When any AniList request fails with a `401` (an HTTP-level 401, or a GraphQL envelope whose errors entry carries `status: 401`), the client automatically exchanges the stored refresh token for a fresh access token. It updates its credentials and replays the original request once.

```typescript
const aniLink = new AniLink({
    anilist: {
        authToken: token.access_token,
        refreshToken: token.refresh_token,
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
        onTokenRefresh: (response) => saveToken(response),
    },
});
```

- **Opt-in.** Without the full set (`refreshToken`, `clientId`, and `clientSecret`), the client never attempts a refresh. The call fails with a `401` immediately, exactly as before. AniList's refresh grant requires the client secret, unlike MAL where it is optional, so automatic refresh stays off until all three fields are configured.
- **Bootstrappable.** A client configured with only the refresh fields (no `authToken`) refreshes on the first auth-required call instead of failing. A persisted refresh token alone is enough to construct a working client.
- **One replay, no loop.** A replay that fails again rejects with that error; there is no retry loop. Concurrent 401s share one refresh grant.
- **Failure event.** `onTokenRefreshError` fires exactly once per failed grant with the sanitized token-request error. The failing call rejects with the same error, so monitoring can distinguish "refresh recovered" from "refresh is broken" without parsing hook diagnostics. If the callback throws, the client reports that through `onHookError`; the throw never replaces the propagated error.
- **Per-call, not per-traversal.** Refresh applies per wrapped operation call. Pages already in flight under `paginate` with `concurrency > 1` fail independently if they dispatched with the expired token. Only the failing call itself triggers the grant and replay.

**Persist synchronously in `onTokenRefresh`.** The client starts using the new token before your callback returns. If the process exits or the callback throws between the refresh and your persistence write, the in-memory client works but your stored credentials are stale. When AniList rotates the refresh token, the stored one becomes permanently invalid. Automatic refresh cannot recover after a restart; manual re-authorization is the only fix. The callback receives the effective token response. When AniList omits `refresh_token`, the stored one stays valid and the response carries it.

## Constants and types

`ANILIST_AUTHORIZE_URL` and `ANILIST_TOKEN_URL` expose the OAuth endpoints. `AniListTokenResponse` types the token payload (`access_token`, `token_type`, `expires_in`, `refresh_token`), handy for your own storage layer.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration), transport settings for the authenticated client.
- <Icon name="ArrowRight" :size="14" /> [Mutations](/guides/anilist/mutations), the operations that require this token.
- <Icon name="ArrowRight" :size="14" /> [MAL authentication](/guides/mal/authentication), the same automatic-refresh lifecycle on the MAL slot, where the client secret is optional.
