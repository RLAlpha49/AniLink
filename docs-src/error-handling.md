---
title: Error handling
description: "The AniLinkError class hierarchy gives every transport failure a stable code. Classify failures by instanceof or code, never by parsing messages."
layout: .vitepress/theme/DocsLayout.vue
---

# Error handling

AniLink throws every transport failure as an `AniLinkError` subclass with a stable `code`. Classify failures by `instanceof` or by `code`, never by parsing messages. Messages change; codes do not.

## Error hierarchy

<Mermaid
    :code="`flowchart TB\n    base([AniLinkError\ncode: varies]):::base\n\n    api[AniLinkApiError\ncode: API_ERROR]:::leaf\n    gql[AniLinkGraphQLError\ncode: GRAPHQL_ERROR]:::leaf\n    rest[AniLinkRestError\ncode: REST_ERROR]:::leaf\n    net[AniLinkNetworkError\ncode: NETWORK_ERROR / TIMEOUT_ERROR / ABORTED_ERROR / CIRCUIT_OPEN_ERROR]:::leaf\n    auth[AniLinkAuthError\ncode: AUTH_ERROR]:::leaf\n    val[AniLinkValidationError\ncode: VALIDATION_ERROR]:::leaf\n\n    base --> api\n    base --> gql\n    base --> rest\n    base --> net\n    base --> auth\n    base --> val\n\n    classDef base fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c,font-weight:bold;\n    classDef leaf fill:#f5f5f5,stroke:#666666,color:#333333;`"
/>

| Class                    | Code                                                                    | When it is thrown                                                                             |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `AniLinkError`           | varies                                                                  | Base class for all normalized failures. Carries `requestId`                                   |
| `AniLinkApiError`        | `API_ERROR`                                                             | Non-success HTTP response. Exposes `status`, `data`, `rateLimit`, `contentType`               |
| `AniLinkGraphQLError`    | `GRAPHQL_ERROR`                                                         | AniList returned HTTP 200 with GraphQL errors. Exposes `graphqlErrors` and any partial `data` |
| `AniLinkRestError`       | `REST_ERROR`                                                            | REST-specific API failure (the MAL API). Exposes `contentType`                                |
| `AniLinkNetworkError`    | `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORTED_ERROR`, `CIRCUIT_OPEN_ERROR` | Transport failures. Timeout errors carry `timeoutMs`                                          |
| `AniLinkAuthError`       | `AUTH_ERROR`                                                            | Calling an authenticated operation without a token, or the provider rejecting the token       |
| `AniLinkValidationError` | `VALIDATION_ERROR`                                                      | Invalid variables or options before a request is sent                                         |

## Stable codes

`AniLinkErrorCodes` maps every code: `API_ERROR`, `GRAPHQL_ERROR`, `REST_ERROR`, `NETWORK_ERROR`, `TIMEOUT_ERROR`, `ABORTED_ERROR`, `CIRCUIT_OPEN_ERROR`, `AUTH_ERROR`, `VALIDATION_ERROR`, `UNKNOWN_ERROR`.

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
- **MAL** uses the `X-RateLimit-*` and `Retry-After` headers. AniLink populates the same `rateLimit` object when those headers are present.

</Callout>

In practice, AniList answers `400` (invalid query or variables), `401` (invalid token), `403` (forbidden), `429` (rate limited), and `500`/`502`/`503`/`504` (server-side). MAL answers `400` (invalid fields), `401` (expired or invalid token), `404` (unknown ID), and `429` (rate limited).

## Correlation ID

Every error thrown by the transport pipeline carries a `requestId` string, the same one the lifecycle hooks received for that request. Use it to join a caught failure to its full event stream (attempts, retries, pacing, rate-limit state) in your logging or metrics backend:

```typescript
try {
    await aniLink.anilist.query.media({ id: 1 });
} catch (error) {
    logger.error({ requestId: error.requestId, code: error.code }, "request failed");
}
```

Errors raised before any request is sent (for example, `AniLinkValidationError`, or `AniLinkAuthError` from a missing token) carry no `requestId`.

## Response Content-Type

`AniLinkApiError` and `AniLinkRestError` expose `contentType`, the `Content-Type` header of the failing response. REST providers such as MyAnimeList answer rate limits and gateway errors with HTML or plain text, not JSON. This field tells a structured JSON failure payload (where `data.message` is meaningful) from a non-JSON one, so you do not have to guess:

```typescript
if (error instanceof AniLinkRestError) {
    if (error.contentType?.includes("application/json")) {
        console.error(error.data?.message);
    } else {
        console.error("Non-JSON error body:", error.data);
    }
}
```

## Partial data

GraphQL permits partial success. A document selecting several root fields can resolve most of them while one fails. By default AniLink is strict. An envelope carrying any `errors` entry throws `AniLinkGraphQLError`. The resolved portion is available on the error's `partialData` (and `data`) field, so you can recover it from the catch path:

```typescript
try {
    const result = await aniLink.anilist.custom(
        `query { User(id: 1) { name } Page { mediaList { id } } }`
    );
} catch (error: unknown) {
    if (error instanceof AniLinkGraphQLError) {
        console.error(error.graphqlErrors.map((e) => e.message));
        console.error(error.partialData); // the fields that did resolve
    }
}
```

For multi-field documents where you want the resolved fields inline, pass `allowPartialData: true` as a per-request option. The transport then resolves with the data instead of throwing, and reports the error entries through the `onError` hook. The error it passes to the hook is the same `AniLinkGraphQLError` the strict mode would have thrown. You still see failures without a try/catch:

```typescript
const result = await aniLink.anilist.custom(
    `query { User(id: 1) { name } Page { mediaList { id } } }`,
    { allowPartialData: true, onError: (error) => logger.warn(error.graphqlErrors) }
);
```

Envelopes with errors and no usable `data` still throw regardless of the flag. There is nothing to return. "Usable" means a `data` object with at least one resolved (non-null) root field. An empty `data: {}` means every root field failed. So does `data: { Media: null }`, the GraphQL shape for a failed nullable root field. Both throw as the strict mode would. Typed single-root-field operations are unaffected in practice. Their documents resolve one root field, so a partial envelope for them carries either `data: null` or a lone `null` root field, and throws as before.

AniLink never stores partial-success results in the [response cache](/response-cache). A later cache hit would replay the degraded data without the `onError` reporting that accompanied the original fetch, and hide the failures. Every read of a partial envelope goes back to the network (and reports its errors through `onError` again).

The circuit breaker still tracks upstream health. When a partial envelope's error entries carry an availability-class status (429 or 5xx), the breaker counts the attempt exactly as the strict mode's throw would, instead of resetting the failure streak. A persistently degraded upstream trips the breaker under `allowPartialData` too. Partial envelopes whose errors are caller-side (validation failures with no upstream status) reset the streak like a success, which matches the strict mode's classification.

The resolution is terminal where the strict mode's throw is retryable. A partial envelope is never retried (the data is already in hand), so a 429-class partial error is reported once through `onError` while the strict mode would have re-dispatched the request under the retry policy. Under sustained rate limiting, a client that switches to `allowPartialData` therefore retries less and trips the breaker sooner for identical upstream conditions. The breaker accounting is identical. The retry accounting is not.

## Raw error debugging

Pass `exposeRawAxiosError: true` and thrown errors carry the original Axios error as `rawAxiosError` (and `cause`).

<Callout kind="tip">

AniLink redacts sensitive request headers (`Authorization`, `Cookie`, `Proxy-Authorization`) to `[REDACTED]` in the attached raw error before it reaches you, so opting in for diagnostics does not leak bearer tokens or cookies into your logs.

</Callout>

<Callout kind="caution">

Raw Axios errors still carry request URLs, headers, and response bodies. Keep this switch for local debugging only. Never log `rawAxiosError` in production.

</Callout>

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers which failures retry automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) lists per-operation errors.
