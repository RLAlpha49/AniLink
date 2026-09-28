---
title: MAL authentication
description: "Register a MyAnimeList application, exchange an OAuth2 authorization code with PKCE, and use the access token."
layout: .vitepress/theme/DocsLayout.vue
---

# MAL authentication

MAL uses OAuth2 with PKCE. First, register an application at the [MAL API panel](https://myanimelist.net/apiconfig) to get a client ID.

<Mermaid
    :code="`sequenceDiagram\n    autonumber\n    participant U as User\n    participant A as Your App\n    participant MAL as MAL auth server\n    participant API as MAL API\n\n    U->>A: Start login\n    A->>A: codeVerifier = random(43-128 chars)\n    A->>A: codeChallenge = codeVerifier (plain PKCE)\n    A->>A: buildMalAuthorizationUrl(clientId, codeChallenge, state)\n    A->>U: Redirect to MAL authorize URL\n    U->>MAL: Authorize app\n    MAL->>U: Redirect to callback?code=...&state=...\n    U->>A: Arrive at callback\n    A->>A: Validate state matches\n    A->>MAL: getMalAccessToken(clientId, code, codeVerifier)\n    MAL->>MAL: Verify codeChallenge = codeVerifier\n    MAL->>A: access_token + refresh_token\n    A->>API: new AniLink({ mal: { accessToken, refreshToken, clientId } })\n    API->>A: Authenticated data\n\n    Note over A,MAL: Token expires (expires_in seconds)\n    A->>A: getMalTokenExpiry(token) < now - 60s?\n    A->>MAL: refreshMalAccessToken(clientId, refreshToken)\n    MAL->>A: New access_token (+ optional refresh_token)\n    A->>API: Continue with fresh token`"
/>

## 1. Build the authorization URL

The library provides `buildMalAuthorizationUrl` but no PKCE generator. The
verifier and challenge are yours to create. MAL's authorization server
supports only the `plain` PKCE method, so the challenge is the verifier
itself:

```typescript
import { randomBytes } from "node:crypto";
import { buildMalAuthorizationUrl } from "anilink-api-wrapper";

// 32 random bytes produce a 43-char base64url string. MAL allows 43-128 chars.
const codeVerifier = randomBytes(32).toString("base64url");

// Plain challenge: identical to the verifier.
const codeChallenge = codeVerifier;

const authorizeUrl = buildMalAuthorizationUrl("mal-client-id", codeChallenge, "csrf-state");
// Redirect the user to `authorizeUrl`.
```

Keep the `codeVerifier` for step 2. Under the `plain` method the challenge is
the verifier itself, so the verifier appears in the authorization URL.
Treat the URL as sensitive and do not log or share it. The token exchange
sends the verifier again. In a browser environment, use
`crypto.getRandomValues` for the verifier bytes and base64url-encode them
yourself.

`buildMalAuthorizationUrl(clientId, codeChallenge, state?)` takes the plain PKCE challenge, which is the verifier itself under MAL's `plain` method. The optional `state` protects against CSRF. Validate it on the redirect before you exchange the code.

## 2. Exchange the code

```typescript
import { getMalAccessToken, AniLink } from "anilink-api-wrapper";

const token = await getMalAccessToken({
    clientId: "mal-client-id",
    code, // the `code` query parameter from the redirect
    codeVerifier, // the original verifier
    // clientSecret: "optional", // only for applications that use one
});

const aniLink = new AniLink({
    mal: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        clientId: "mal-client-id",
    },
});
```

Token requests run on a default timeout of **10 seconds**. Pass `options` on the request to override transport settings for the call.

## 3. Refresh before expiry

```typescript
import { getMalTokenExpiry, refreshMalAccessToken } from "anilink-api-wrapper";

if (Date.now() >= getMalTokenExpiry(token).getTime() - 60_000) {
    const refreshed = await refreshMalAccessToken({
        clientId: "mal-client-id",
        refreshToken: token.refresh_token,
    });
    token = { ...refreshed, refresh_token: refreshed.refresh_token ?? token.refresh_token };
}
```

`getMalTokenExpiry(response, now?)` computes the absolute expiry from `expires_in`. The refresh response may omit `refresh_token`. Keep the stored one when it does, per rotation semantics.

## 4. Automatic refresh

Steps 1 to 3 leave the refresh work to you. Configure `refreshToken` and `clientId`, and the client handles the refresh. When any MAL request fails with a `401`, the client exchanges the stored refresh token for a fresh access token, stores the new pair, and replays the original request once.

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink({
    mal: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        clientId: "mal-client-id",
        // clientSecret: "optional", // only for applications that use one
        onTokenRefresh: (response) => {
            // Persist the new pair synchronously. See the warning below.
            token = { ...response, refresh_token: response.refresh_token ?? token.refresh_token };
        },
    },
});
```

The behavior:

- **Opt-in.** Without both `refreshToken` and `clientId`, the client does not refresh. The request fails with a `401` immediately, as before.
- **Refresh on first use.** If `refreshToken` and `clientId` are set but `accessToken` is missing, the client refreshes on the first auth-required call. A stored refresh token and client ID are enough to construct the client.
- **One replay.** The client retries the original request once with the new token. If that replay returns another `401`, your call rejects with that error.
- **One refresh for concurrent requests.** Concurrent `401`s trigger a single refresh call. Each replay waits for the same new token.
- **Rotation-safe.** If a refresh response omits `refresh_token`, the client keeps the stored token.
- **Refresh callback.** `onTokenRefresh` fires exactly once per refresh grant with the effective `MalTokenResponse`. Use it to persist the new token pair. Concurrent `401`s share one grant and one callback. If the callback throws, AniLink reports the failure through its diagnostics policy. When AniLink emits a diagnostic, a configured `onHookError` receives it. Without an observer, only `diagnostics: "warn"` logs a warning to the console. The `"hook"` and `"silent"` modes suppress console fallback. A callback failure does not stop the replay.
- **Refresh failure callback.** `onTokenRefreshError` fires exactly once per failed grant and receives the sanitized token-request error that the failing call rejects with. Monitoring can record failed grants without parsing hook diagnostics. If this callback throws, AniLink reports the failure through its diagnostics policy. When AniLink emits a diagnostic, a configured `onHookError` receives it. Without an observer, only `diagnostics: "warn"` logs a warning. The `"hook"` and `"silent"` modes suppress console fallback, and the token-request error still propagates.
- **No stale-token replay.** If refresh fails, the call rejects with the sanitized token-request error. The client does not replay the request with the stale token.

The refresh grant runs on the same 10-second token-request timeout as `refreshMalAccessToken`. Your MAL transport settings do not control it. Your `timeout`, hooks, pacing, and retry policy do not apply to the token request. In particular, do not add `401` to `retryOnStatus`. Automatic refresh handles `401` responses, and a retry-configured `401` would multiply requests before the refresh runs.

**Persist synchronously in `onTokenRefresh`.** The client starts using the new token before your callback returns. Save the new pair before the process exits. If the callback throws before saving, the client continues using the new token in memory, but your stored credentials remain stale. If MAL rotated the refresh token, the stored token is permanently invalid. The client cannot refresh after a restart, so you must authorize again.

## Constants and types

| Export                        | Value / shape                                                      |
| ----------------------------- | ------------------------------------------------------------------ |
| `MAL_API_BASE_URL`            | `https://api.myanimelist.net/v2`                                   |
| `MAL_AUTHORIZE_URL`           | `https://myanimelist.net/v1/oauth2/authorize`                      |
| `MAL_TOKEN_URL`               | The MAL OAuth2 token endpoint                                      |
| `MAL_API_REFERENCE`           | Link to the MAL API v2 reference                                   |
| `MalTokenResponse`            | `{ access_token, token_type, expires_in, refresh_token?, scope? }` |
| `MalAuthorizationCodeRequest` | `{ clientId, code, codeVerifier, clientSecret?, options? }`        |
| `MalRefreshTokenRequest`      | `{ clientId, refreshToken, clientSecret?, options? }`              |

## Safe state validation

Generate a fresh random `state` for each login attempt. Store it on the server and bind it to the session. Before calling `getMalAccessToken`, compare the returned `state` with the stored value using a timing-safe equality check. Reject mismatches immediately.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL client configuration](/guides/mal/configuration) covers storing the tokens.
- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) shows the API calls the token enables.
