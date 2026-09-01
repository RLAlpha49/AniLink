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
| `AniLinkError` | varies | Base class for all normalized failures |
| `AniLinkApiError` | `API_ERROR` | Non-success HTTP response. Exposes `status`, `data`, `rateLimit` |
| `AniLinkGraphQLError` | `GRAPHQL_ERROR` | AniList returned HTTP 200 with GraphQL errors. Exposes `graphqlErrors` and any partial `data` |
| `AniLinkRestError` | `API_ERROR` | REST-specific API failure (MAL surface) |
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

## Raw error debugging

Pass `exposeRawAxiosError: true` to attach the original Axios error as `rawAxiosError` (and `cause`) on thrown errors.

<Callout kind="caution">

Raw Axios errors contain request configuration including bearer-token headers. Enable this only for local debugging. Never log `rawAxiosError` in production.

</Callout>

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — which failures retry automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — per-operation error lists.
