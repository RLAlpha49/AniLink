---
title: Error handling
layout: .vitepress/theme/DocsLayout.vue
---

# Error handling

AniLink normalizes every transport failure into an `AniLinkError` subclass with a stable `code`. You classify failures by `instanceof` or by `code` — never by parsing messages.

## Error hierarchy

<Mermaid
    :code="`flowchart TB\n    base([AniLinkError\ncode: varies]):::base\n\n    api[AniLinkApiError\ncode: API_ERROR]:::leaf\n    gql[AniLinkGraphQLError\ncode: GRAPHQL_ERROR]:::leaf\n    rest[AniLinkRestError\ncode: API_ERROR]:::leaf\n    net[AniLinkNetworkError\ncode: NETWORK_ERROR / TIMEOUT_ERROR / ABORTED_ERROR / CIRCUIT_OPEN_ERROR]:::leaf\n    auth[AniLinkAuthError\ncode: AUTH_ERROR]:::leaf\n    val[AniLinkValidationError\ncode: VALIDATION_ERROR]:::leaf\n\n    base --> api\n    base --> gql\n    base --> rest\n    base --> net\n    base --> auth\n    base --> val\n\n    classDef base fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c,font-weight:bold;\n    classDef leaf fill:#f5f5f5,stroke:#666666,color:#333333;`"
/>

| Class | Code | When it is thrown |
| --- | --- | --- |
| `AniLinkError` | varies | Base class for all normalized failures. Carries `requestId` |
| `AniLinkApiError` | `API_ERROR` | Non-success HTTP response. Exposes `status`, `data`, `rateLimit`, `contentType` |
| `AniLinkGraphQLError` | `GRAPHQL_ERROR` | AniList returned HTTP 200 with GraphQL errors. Exposes `graphqlErrors` and any partial `data` |
| `AniLinkRestError` | `API_ERROR` | REST-specific API failure (MAL surface). Exposes `contentType` |
| `AniLinkNetworkError` | `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORTED_ERROR`, `CIRCUIT_OPEN_ERROR` | Transport failures. Timeout errors carry `timeoutMs` |
| `AniLinkAuthError` | `AUTH_ERROR` | Calling an authenticated operation without a token, or the provider rejecting the token |
| `AniLinkValidationError` | `VALIDATION_ERROR` | Invalid variables or options before a request is sent |

## Stable codes

`AniLinkErrorCodes` maps every code: `API_ERROR`, `GRAPHQL_ERROR`, `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORTED_ERROR`, `CIRCUIT_OPEN_ERROR`, `AUTH_ERROR`, `VALIDATION_ERROR`, `UNKNOWN_ERROR`.

## Canonical catch-and-classify recipe

```typescript
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkGraphQLError,
    AniLinkNetworkError,
} from "anilink-api-wrapper";

try {
    const user = await aniLink.anilist.query.user({ id: 542244 });
} catch (error: unknown) {
    if (error instanceof AniLinkGraphQLError) {
        console.error(error.graphqlErrors.map((e) => e.message));
        console.error(error.data); // partial data, when present
    } else if (error instanceof AniLinkApiError) {
        console.error(error.code, error.status, error.data);
        if (error.status === 429) {
            console.error("Quota reset at:", error.rateLimit?.reset);
        }
    } else if (error instanceof AniLinkAuthError) {
        console.error("Token missing or rejected:", error.code);
    } else if (error instanceof AniLinkNetworkError) {
        console.error(error.code, error.message);
    } else {
        throw error;
    }
}
```

## Provider-specific status behavior

<Callout kind="provider" label="Provider scope">

- **AniList** reports rate limits through `x-ratelimit-*` headers. Every `AniLinkApiError` exposes them as a read-only `rateLimit` object (`limit`, `remaining`, `reset`).
- **MAL** uses the `X-RateLimit-*` / `Retry-After` header family. The same `rateLimit` object is populated when those headers are present.

</Callout>

Common AniList statuses: `400` (invalid query/variables), `401` (invalid token), `403` (forbidden), `429` (rate limited), `500`/`502`/`503`/`504` (server-side). Common MAL statuses: `400` (invalid fields), `401` (expired/invalid token), `404` (unknown ID), `429` (rate limited).

## Correlation ID

Every error thrown by the transport pipeline carries a `requestId` string that matches the `requestId` emitted to the lifecycle hooks for the same request. Use it to join a caught failure to its full event stream (attempts, retries, pacing, rate-limit state) in your logging or metrics backend:

```typescript
try {
    await aniLink.anilist.query.media({ id: 1 });
} catch (error) {
    logger.error({ requestId: error.requestId, code: error.code }, "request failed");
}
```

Errors raised before any request is sent (for example `AniLinkValidationError` or `AniLinkAuthError` from a missing token) do not carry a `requestId`.

## Response Content-Type

`AniLinkApiError` and `AniLinkRestError` expose `contentType` — the `Content-Type` header of the failing response. REST providers such as MyAnimeList return HTML or plain-text bodies on rate-limit and gateway error paths; this field lets you distinguish a structured JSON failure payload (where `data.message` is meaningful) from a non-JSON one without guessing:

```typescript
if (error instanceof AniLinkRestError) {
    if (error.contentType?.includes("application/json")) {
        console.error(error.data?.message);
    } else {
        console.error("Non-JSON error body:", error.data);
    }
}
```

## Raw error debugging

Pass `exposeRawAxiosError: true` to attach the original Axios error as `rawAxiosError` (and `cause`) on thrown errors.

<Callout kind="tip">

Sensitive request headers (`Authorization`, `Cookie`, `Proxy-Authorization`) are automatically redacted to `[REDACTED]` in the attached raw error, so opting in for diagnostics does not leak bearer tokens or cookies into your logs.

</Callout>

<Callout kind="caution">

Raw Axios errors still contain request URLs, headers, and response bodies. Enable this only for local debugging. Never log `rawAxiosError` in production.

</Callout>

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — which failures retry automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — per-operation error lists.
