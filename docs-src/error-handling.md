---
title: Error handling
description: "The AniLinkError class hierarchy gives every transport failure a stable code. Classify failures by instanceof or code, never by parsing messages."
layout: .vitepress/theme/DocsLayout.vue
---

# Error handling

AniLink reports normalized failures as `AniLinkError` subclasses with stable `code` values. Classify errors by `instanceof` or `code`, not by message text, which can change.

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

AniList can return `400` (invalid query or variables), `401` (invalid token), `403` (forbidden), `429` (rate limited), and `500`/`502`/`503`/`504` (server-side errors). MAL can return `400` (invalid fields), `401` (expired or invalid token), `404` (unknown ID), and `429` (rate limited).

## Correlation ID

Every error from the transport pipeline carries a string `requestId`. Lifecycle hooks receive the same ID for that request. Use it to match a caught error with its lifecycle events, including attempts, retries, pacing, and rate-limit state, in your logs or metrics:

```typescript
try {
    await aniLink.anilist.query.media({ id: 1 });
} catch (error) {
    logger.error({ requestId: error.requestId, code: error.code }, "request failed");
}
```

Errors that occur before AniLink sends a request, such as an `AniLinkValidationError` or an `AniLinkAuthError` for a missing token, have no `requestId`.

## Response Content-Type

`AniLinkApiError` and `AniLinkRestError` expose `contentType`, the `Content-Type` header of the failing response. MyAnimeList can return HTML or plain text for rate-limit and gateway errors instead of JSON. Use `contentType` to distinguish a JSON response, where `data.message` is meaningful, from a non-JSON response:

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

GraphQL responses can contain partial data when a document selects multiple root fields. By default, AniLink treats any response with an `errors` entry as a failure and throws `AniLinkGraphQLError`. The error exposes resolved data through `partialData` and `data`, so you can recover it in the catch block:

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

For a multi-field document, pass `allowPartialData: true` as a per-request option to return resolved fields instead of throwing. AniLink reports the GraphQL errors through the `onError` hook. The hook receives the same `AniLinkGraphQLError` that strict mode would throw, so you can still observe failures without a `try/catch`:

```typescript
const result = await aniLink.anilist.custom(
    `query { User(id: 1) { name } Page { mediaList { id } } }`,
    { allowPartialData: true, onError: (error) => logger.warn(error.graphqlErrors) }
);
```

Even with `allowPartialData: true`, AniLink throws if an envelope has errors but no usable `data`. Usable data contains at least one resolved, non-null root field. An empty `data: {}` means every root field failed. The same is true of `data: { Media: null }`, the GraphQL shape for a failed nullable root field. Both responses throw as they do in strict mode. Typed single-root-field operations behave the same. Each document resolves one root field, so a partial envelope contains either `data: null` or a single null root field. AniLink throws in both cases.

AniLink does not store partial responses in the [response cache](/response-cache). A cache hit would return degraded data without the original `onError` report, hiding the errors. AniLink fetches every partial response from the network and reports its errors through `onError` again.

The circuit breaker still tracks upstream health. If a partial response's error entries contain an availability status (`429` or `5xx`), the breaker counts the attempt as a failure, just as it does in strict mode, rather than resetting the failure streak. Repeated availability failures can still trip the breaker with `allowPartialData: true`. If the error entries have caller-side statuses, the breaker resets the failure streak as it would after a success. If the error entries have no upstream status, the breaker leaves the streak unchanged, matching strict mode's handling of the same errors.

Returning partial data ends the request even when strict mode would retry the failure. AniLink never retries a partial response because it already has the data. For a `429` partial error, `onError` runs once. Strict mode may re-dispatch the request if the retry policy allows it. Under sustained rate limiting, enabling `allowPartialData` reduces retries and can trip the breaker sooner for the same upstream failures. The breaker accounting stays the same, but the retry count changes.

## Raw error debugging

Set `exposeRawAxiosError: true` to attach the original Axios error to thrown errors as `rawAxiosError` and `cause`.

<Callout kind="tip">

AniLink redacts sensitive request headers (`Authorization`, `Cookie`, `Proxy-Authorization`) to `[REDACTED]` in the attached raw error before it reaches you, so opting in for diagnostics does not leak bearer tokens or cookies into your logs.

</Callout>

<Callout kind="caution">

Raw Axios errors still carry request URLs, headers, and response bodies. Keep this switch for local debugging only. Never log `rawAxiosError` in production.

</Callout>

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers which failures retry automatically.
- <Icon name="ArrowRight" :size="14" /> [Operation reference](/operations/index) lists per-operation errors.
