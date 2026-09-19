---
title: Per-request options
description: "Override timeouts, retries, and other instance defaults for a single call. Every operation accepts the trailing per-request options argument."
layout: .vitepress/theme/DocsLayout.vue
---

# Per-request options

Every operation accepts a trailing options argument that overrides the instance defaults for that single call. You don't need a new client.

## AniList operations

AniList operations take `options?: RequestOptions` as their last parameter. Field-aware operations, those whose signature lists `fields` alongside the transport options, also accept `fields` in the same object. It composes the document from only the selections you name, at any nesting depth, and narrows the return type to `DeepPick<...>`. Not every operation is field-aware (for example `query.markdown` and `query.viewer` return fixed shapes); check the operation's signature, or see the full list in [Field selection](/guides/anilist/field-selection):

```typescript
const media = await aniLink.anilist.query.media(
    { id: 1, type: "ANIME" },
    { timeout: 5_000, signal: controller.signal }
);

const slim = await aniLink.anilist.query.media(
    { id: 1, type: "ANIME" },
    { fields: ["id", "title.romaji", "averageScore"] }
);
// slim: DeepPick<MediaResponse, "id" | "title.romaji" | "averageScore" | "idMal">
// The always-selected idMal joins the pick; the document always sends it.
```

See [Field selection](/guides/anilist/field-selection) for the nested path rules, the always-selected `id`, and which operations accept `fields`.

## MAL operations

MAL operations take `MalRequestOptions`, which extends `RequestOptions` with the MAL `fields` selector:

```typescript
const anime = await aniLink.mal.anime.get(
    { id: 21 },
    {
        fields: ["id", "title", "main_picture"],
        timeout: 8_000,
    }
);
```

| Option                | Type                              | Default                 | Description                                                                                |
| --------------------- | --------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `fields`              | `string \| readonly string[]`     | provider default fields | Comma-separated MAL field selector, or the same selector as an array. Shapes the response. |
| `timeout`             | `number`                          | instance value (30000)  | Milliseconds before the request times out. `0` disables.                                   |
| `signal`              | `AbortSignal`                     | instance value          | Signal used to cancel the in-flight request.                                               |
| `retry`               | `boolean \| Partial<RetryPolicy>` | instance policy         | Retry policy for this call. `false` opts out.                                              |
| `exposeRawAxiosError` | `boolean`                         | `false`                 | Attach the raw Axios error for debugging.                                                  |

## Available options

| Option                | Type                                | Default                | Description                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeout`             | `number`                            | instance value (30000) | Milliseconds before the request times out. `0` disables.                                                                                                                                                                                                                                                                                           |
| `signal`              | `AbortSignal`                       | instance value         | Signal used to cancel the in-flight request.                                                                                                                                                                                                                                                                                                       |
| `retry`               | `boolean \| Partial<RetryPolicy>`   | instance policy        | Retry policy for this call. `false` opts out.                                                                                                                                                                                                                                                                                                      |
| `exposeRawAxiosError` | `boolean`                           | `false`                | Attach the raw Axios error for debugging. The library redacts sensitive headers.                                                                                                                                                                                                                                                                   |
| `paceWithRateLimit`   | `boolean`                           | instance value         | Waits for the rate-limit window to reset when remaining quota drops below `rateLimitFloor`.                                                                                                                                                                                                                                                        |
| `rateLimitFloor`      | `number`                            | instance value         | Remaining-quota threshold that triggers pacing.                                                                                                                                                                                                                                                                                                    |
| `circuitBreaker`      | `{ threshold, cooldownMs }`         | instance value         | Circuit breaker configuration.                                                                                                                                                                                                                                                                                                                     |
| `retryBudget`         | `{ maxRetriesPerWindow, windowMs }` | instance value         | Per-window cap on total retries across requests. When the budget runs out, failures surface without retries until the window elapses.                                                                                                                                                                                                              |
| `ignorePaceDeadline`  | `boolean`                           | `false`                | Bypass the shared rate-limit pacing deadline for this call.                                                                                                                                                                                                                                                                                        |
| `allowPartialData`    | `boolean`                           | `false`                | Resolve a GraphQL envelope carrying both data and errors with the data instead of throwing; the error entries surface through `onError`. Needs one resolved (non-null) root field. `data: {}` and a lone `null` root field still throw; AniLink never retries the call or caches the result. See [Error handling](/error-handling#partial-data).   |
| `responseCache`       | `ResponseCache`                     | instance value         | Opt-in response cache for reads (`GET` requests and GraphQL query documents).                                                                                                                                                                                                                                                                      |
| `onError`             | `OnErrorHandler`                    | instance value         | Fires per failed attempt and when retries are exhausted.                                                                                                                                                                                                                                                                                           |
| `onRetry`             | `OnErrorHandler`                    | instance value         | Fires when the client decides to retry a failed attempt.                                                                                                                                                                                                                                                                                           |
| `onRequestStart`      | `OnRequestStartHandler`             | instance value         | Fires immediately before each attempt.                                                                                                                                                                                                                                                                                                             |
| `onResponse`          | `OnResponseHandler`                 | instance value         | Fires after each attempt with `durationMs` and `cacheHit?`.                                                                                                                                                                                                                                                                                        |
| `onPace`              | `OnPaceHandler`                     | instance value         | Fires after a rate-limit pacing wait completes, before the client dispatches the request; an aborted wait emits nothing (see `onError`).                                                                                                                                                                                                           |
| `onHookError`         | `OnHookErrorHandler`                | instance value         | Fires when a lifecycle hook throws.                                                                                                                                                                                                                                                                                                                |
| `diagnostics`         | `"warn" \| "hook" \| "silent"`      | `"warn"`               | Controls the library's unsolicited diagnostics (hook-failure fallback and the one-time `stateOwner` warning): `warn` emits a structured record via `onHookError` or `console.warn`, `hook` uses the observer only, `silent` suppresses both. Also settable client-wide on the credentials object. See [Observability](/observability).             |
| `onCircuitOpen`       | `OnCircuitOpenHandler`              | instance value         | Fires when the circuit breaker trips.                                                                                                                                                                                                                                                                                                              |
| `onCircuitClose`      | `OnCircuitCloseHandler`             | instance value         | Fires when the circuit breaker closes after a probe.                                                                                                                                                                                                                                                                                               |

## Merge behavior

The library merges per-request options **shallowly** over the instance defaults. A partial override replaces the whole nested value for that key. Pass `retry: { maxRetries: 1 }`, for example, and the override replaces the entire retry policy for that call. The other policy settings fall back to the built-in defaults, not to your instance-level policy.

## Provider scoping

Options never cross providers. A per-request `timeout` on an AniList call leaves MAL calls untouched. Both providers have a `fields` option, but they differ. AniList `fields` narrows the return type (`DeepPick<...>`, including nested paths like `title.romaji`), while MAL `fields` selects the response shape without type narrowing.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) covers instance-level options.
- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) covers `fields` selection in depth.
