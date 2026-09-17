---
title: Error handling
description: "The AniLinkError taxonomy with stable code values: classify transport failures by instanceof or code, never by parsing messages."
layout: .vitepress/theme/DocsLayout.vue
---

# Error handling

Every transport failure comes out of AniLink as an `AniLinkError` subclass with a stable `code`. Classify failures by `instanceof` or by `code` — never by parsing messages. Messages change; codes do not.

## Error hierarchy

<Mermaid
    :code="`flowchart TB\n    base([AniLinkError\ncode: varies]):::base\n\n    api[AniLinkApiError\ncode: API_ERROR]:::leaf\n    gql[AniLinkGraphQLError\ncode: GRAPHQL_ERROR]:::leaf\n    rest[AniLinkRestError\ncode: REST_ERROR]:::leaf\n    net[AniLinkNetworkError\ncode: NETWORK_ERROR / TIMEOUT_ERROR / ABORTED_ERROR / CIRCUIT_OPEN_ERROR]:::leaf\n    auth[AniLinkAuthError\ncode: AUTH_ERROR]:::leaf\n    val[AniLinkValidationError\ncode: VALIDATION_ERROR]:::leaf\n\n    base --> api\n    base --> gql\n    base --> rest\n    base --> net\n    base --> auth\n    base --> val\n\n    classDef base fill:#dae8fc,stroke:#6c8ebf,color:#1a3a5c,font-weight:bold;\n    classDef leaf fill:#f5f5f5,stroke:#666666,color:#333333;`"
/>

| Class                    | Code                                                                    | When it is thrown                                                                             |
| ------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `AniLinkError`           | varies                                                                  | Base class for all normalized failures. Carries `requestId`                                   |
| `AniLinkApiError`        | `API_ERROR`                                                             | Non-success HTTP response. Exposes `status`, `data`, `rateLimit`, `contentType`               |
| `AniLinkGraphQLError`    | `GRAPHQL_ERROR`                                                         | AniList returned HTTP 200 with GraphQL errors. Exposes `graphqlErrors` and any partial `data` |
| `AniLinkRestError`       | `REST_ERROR`                                                            | REST-specific API failure (MAL surface). Exposes `contentType`                                |
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
- **MAL** uses the `X-RateLimit-*` / `Retry-After` header family. The same `rateLimit` object is populated when those headers are present.

</Callout>

The statuses you will actually meet: AniList answers `400` (invalid query or variables), `401` (invalid token), `403` (forbidden), `429` (rate limited), and `500`/`502`/`503`/`504` (server-side). MAL answers `400` (invalid fields), `401` (expired or invalid token), `404` (unknown ID), and `429` (rate limited).

## Correlation ID

Every error thrown by the transport pipeline carries a `requestId` string — the same one the lifecycle hooks saw for that request. Use it to join a caught failure to its full event stream (attempts, retries, pacing, rate-limit state) in your logging or metrics backend:

```typescript
try {
    await aniLink.anilist.query.media({ id: 1 });
} catch (error) {
    logger.error({ requestId: error.requestId, code: error.code }, "request failed");
}
```

Errors raised before any request leaves the door (say, `AniLinkValidationError`, or `AniLinkAuthError` from a missing token) carry no `requestId`.

## Response Content-Type

`AniLinkApiError` and `AniLinkRestError` expose `contentType` — the `Content-Type` header of the failing response. Why care? REST providers such as MyAnimeList answer rate limits and gateway errors with HTML or plain text, not JSON. This field tells a structured JSON failure payload (where `data.message` is meaningful) from a non-JSON one, no guessing required:

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

GraphQL permits partial success: a document selecting several root fields can resolve most of them while one fails. By default AniLink is strict — an envelope carrying any `errors` entry throws `AniLinkGraphQLError`, and the resolved portion survives on the error's `partialData` (and `data`) field so you can recover it from the catch path:

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

For multi-field documents where you want the resolved fields inline, pass `allowPartialData: true` as a per-request option. The transport then resolves with the data instead of throwing, and reports the error entries through the `onError` hook with the same `AniLinkGraphQLError` the strict mode would have thrown — so failures stay observable without a try/catch:

```typescript
const result = await aniLink.anilist.custom(
    `query { User(id: 1) { name } Page { mediaList { id } } }`,
    { allowPartialData: true, onError: (error) => logger.warn(error.graphqlErrors) }
);
```

Envelopes with errors and no usable `data` still throw regardless of the flag — there is nothing to return. "Usable" means a `data` object with at least one resolved (non-null) root field: an empty `data: {}` means every root field failed, and so does `data: { Media: null }` — the GraphQL shape for a failed nullable root field — so both throw like the strict mode. Typed single-root-field operations are unaffected in practice: their documents resolve one root field, so a partial envelope for them carries either `data: null` or a lone `null` root field, and throws as before.

Partial-success results are never stored in the [response cache](/response-cache): a later cache hit would replay the degraded data without the `onError` reporting that accompanied the original fetch, silently hiding the failures. Every read of a partial envelope goes back to the network (and reports its errors through `onError` again).

The circuit breaker still sees the upstream-health signal: when a partial envelope's error entries carry an availability-class status (429 or 5xx), the breaker counts the attempt exactly as the strict mode's throw would, instead of resetting the failure streak — so a persistently degraded upstream trips the breaker under `allowPartialData` too. Partial envelopes whose errors are caller-side (validation failures with no upstream status) reset the streak like a success, matching the strict mode's classification.

The resolution is terminal where the strict mode's throw is retryable: a partial envelope is never retried (the data is already in hand), so a 429-class partial error surfaces once through `onError` while the strict mode would have re-dispatched the request under the retry policy. Under sustained rate limiting, a client switched to `allowPartialData` therefore retries less and trips the breaker sooner for identical upstream conditions — the breaker accounting is identical, the retry accounting is not.

## Raw error debugging

Pass `exposeRawAxiosError: true` and the original Axios error rides along as `rawAxiosError` (and `cause`) on thrown errors.

<Callout kind="tip">

Sensitive request headers (`Authorization`, `Cookie`, `Proxy-Authorization`) are redacted to `[REDACTED]` in the attached raw error before it reaches you, so opting in for diagnostics does not leak bearer tokens or cookies into your logs.

</Callout>

<Callout kind="caution">

Raw Axios errors still carry request URLs, headers, and response bodies. Keep this switch for local debugging only — never log `rawAxiosError` in production.

</Callout>

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — which failures retry automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) — per-operation error lists.
