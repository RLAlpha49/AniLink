---
title: MAL authentication
layout: .vitepress/theme/DocsLayout.vue
---

# MAL authentication

MAL uses OAuth2 with PKCE. Register an application at the [MAL API panel](https://myanimelist.net/apiconfig) to get a client ID.

<Mermaid
    :code="`sequenceDiagram\n    autonumber\n    participant U as User\n    participant A as Your App\n    participant MAL as MAL auth server\n    participant API as MAL API\n\n    U->>A: Start login\n    A->>A: codeVerifier = random(43-128 chars)\n    A->>A: codeChallenge = SHA256(codeVerifier)\n    A->>A: buildMalAuthorizationUrl(clientId, codeChallenge, state)\n    A->>U: Redirect to MAL authorize URL\n    U->>MAL: Authorize app\n    MAL->>U: Redirect to callback?code=...&state=...\n    U->>A: Arrive at callback\n    A->>A: Validate state matches\n    A->>MAL: getMalAccessToken(clientId, code, codeVerifier)\n    MAL->>MAL: Verify codeChallenge = SHA256(codeVerifier)\n    MAL->>A: access_token + refresh_token\n    A->>API: new AniLink({ mal: { accessToken, refreshToken, clientId } })\n    API->>A: Authenticated data\n\n    Note over A,MAL: Token expires (expires_in seconds)\n    A->>A: getMalTokenExpiry(token) < now - 60s?\n    A->>MAL: refreshMalAccessToken(clientId, refreshToken)\n    MAL->>A: New access_token (+ optional refresh_token)\n    A->>API: Continue with fresh token`"
/>

## 1. Build the authorization URL

The library provides `buildMalAuthorizationUrl` but no PKCE generator — you
create the verifier and challenge yourself. In Node.js, `node:crypto` produces
both values; the S256 challenge is the SHA-256 hash of the verifier, base64url
encoded:

```typescript
import { createHash, randomBytes } from "node:crypto";
import { buildMalAuthorizationUrl } from "anilink-api-wrapper";

// Random 32 bytes -> 43-char base64url string (MAL allows 43-128 chars).
const codeVerifier = randomBytes(32).toString("base64url");

// S256 challenge: SHA-256 of the verifier, base64url encoded.
const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

const authorizeUrl = buildMalAuthorizationUrl("mal-client-id", codeChallenge, "csrf-state");
// Redirect the user to `authorizeUrl`.
```

Keep the `codeVerifier` for step 2 — only the challenge is sent to MAL in the
authorization URL. The verifier itself is sent later, when exchanging the code
for a token. In a browser environment, use the Web Crypto API instead:
`crypto.getRandomValues` for the verifier bytes and `crypto.subtle.digest`
for the SHA-256 step (then base64url-encode the digest yourself).

`buildMalAuthorizationUrl(clientId, codeChallenge, state?)` takes the S256 code challenge derived from your verifier. The optional `state` is CSRF protection — validate it on the redirect before exchanging the code.

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
    mal: { accessToken: token.access_token, refreshToken: token.refresh_token, clientId: "mal-client-id" },
});
```

Token requests use a default timeout of **10 seconds**. Pass `options` on the request to override transport settings for the call.

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

`getMalTokenExpiry(response, now?)` computes the absolute expiry from `expires_in`. The refresh response may omit `refresh_token`. Keep the stored one when it does (rotation semantics).

## Constants and types

| Export | Value / shape |
| --- | --- |
| `MAL_API_BASE_URL` | `https://api.myanimelist.net/v2` |
| `MAL_AUTHORIZE_URL` | `https://myanimelist.net/v1/oauth2/authorize` |
| `MAL_TOKEN_URL` | The MAL OAuth2 token endpoint |
| `MAL_API_REFERENCE` | Link to the MAL API v2 reference |
| `MalTokenResponse` | `{ access_token, token_type, expires_in, refresh_token?, scope? }` |
| `MalAuthorizationCodeRequest` | `{ clientId, code, codeVerifier, clientSecret?, options? }` |
| `MalRefreshTokenRequest` | `{ clientId, refreshToken, clientSecret?, options? }` |

## Safe state validation

Generate a fresh random `state` per login attempt, store it server-side bound to the session, and compare with a timing-safe equality check before calling `getMalAccessToken`. Reject mismatches immediately.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [MAL client configuration](/guides/mal/configuration) — storing the tokens.
- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) — what the token unlocks.
