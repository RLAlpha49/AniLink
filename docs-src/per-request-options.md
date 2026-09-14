---
title: Per-request options
description: "Override timeouts, retries, and other instance defaults for a single call with the trailing per-request options argument every operation accepts."
layout: .vitepress/theme/DocsLayout.vue
---

# Per-request options

Every operation accepts a trailing options argument that overrides the instance defaults for that single call — no new client required.

## AniList operations

AniList operations take `options?: RequestOptions` as their last parameter. Field-aware operations — those whose signature lists `fields` alongside the transport options — also accept it in the same object: the response-shaping option that composes the document from only the selections you name, at any nesting depth, and narrows the return type to `DeepPick<...>`. Not every operation is field-aware (for example `query.markdown` and `query.viewer` return fixed shapes); check the operation's signature, or see the full list in [Field selection](/guides/anilist/field-selection):

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
// — the always-selected idMal joins the pick; the document always sends it.
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

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `fields` | `string \| readonly string[]` | provider default fields | Comma-separated MAL field selector, or the same selector as an array. Shapes the response. |
| `timeout` | `number` | instance value (30000) | Milliseconds before the request is aborted. `0` disables. |
| `signal` | `AbortSignal` | instance value | Signal used to cancel the in-flight request. |
| `retry` | `boolean \| Partial<RetryPolicy>` | instance policy | Retry policy for this call. `false` opts out. |
| `exposeRawAxiosError` | `boolean` | `false` | Attach the raw Axios error for debugging. |

## Available options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timeout` | `number` | instance value (30000) | Milliseconds before the request is aborted. `0` disables. |
| `signal` | `AbortSignal` | instance value | Signal used to cancel the in-flight request. |
| `retry` | `boolean \| Partial<RetryPolicy>` | instance policy | Retry policy for this call. `false` opts out. |
| `exposeRawAxiosError` | `boolean` | `false` | Attach the raw Axios error for debugging. Sensitive headers are redacted. |
| `paceWithRateLimit` | `boolean` | instance value | Proactive rate-limit pacing. |
| `rateLimitFloor` | `number` | instance value | Remaining-quota threshold that triggers pacing. |
| `circuitBreaker` | `{ threshold, cooldownMs }` | instance value | Circuit breaker configuration. |
| `retryBudget` | `{ maxRetriesPerWindow, windowMs }` | instance value | Per-window cap on total retries across requests. Exhausted budgets surface failures without retries until the window elapses. |
| `ignorePaceDeadline` | `boolean` | `false` | Bypass the shared rate-limit pacing deadline for this call. |
| `responseCache` | `ResponseCache` | instance value | Opt-in response cache for `GET` requests. |
| `onError` | `OnErrorHandler` | instance value | Fires per failed attempt and when retries are exhausted. |
| `onRetry` | `OnErrorHandler` | instance value | Fires when a failed attempt will be retried. |
| `onRequestStart` | `OnRequestStartHandler` | instance value | Fires immediately before each attempt. |
| `onResponse` | `OnResponseHandler` | instance value | Fires after each attempt with `durationMs` and `cacheHit?`. |
| `onPace` | `OnPaceHandler` | instance value | Fires after a rate-limit pacing wait completes; an aborted wait emits nothing (observe via `onError`). |
| `onHookError` | `OnHookErrorHandler` | instance value | Fires when a lifecycle hook throws. |
| `onCircuitOpen` | `OnCircuitOpenHandler` | instance value | Fires when the circuit breaker trips. |
| `onCircuitClose` | `OnCircuitCloseHandler` | instance value | Fires when the circuit breaker closes after a probe. |

## Merge behavior

Per-request options are merged **shallowly** over the instance defaults. A partial override replaces the whole nested value for that key. Pass `retry: { maxRetries: 1 }`, for example, and the entire retry policy for that call is replaced — the other policy knobs fall back to the built-in defaults, not to your instance-level policy. Worth knowing before it surprises you.

## Provider scoping

Options never cross providers. A per-request `timeout` on an AniList call leaves MAL calls untouched. Both providers have a `fields` option, but they differ: AniList `fields` narrows the return type (`DeepPick<...>`, including nested paths like `title.romaji`), while MAL `fields` selects the response shape without type narrowing.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [AniList client configuration](/guides/anilist/configuration) — instance-level options.
- <Icon name="ArrowRight" :size="14" /> [MAL operations](/guides/mal/operations) — `fields` selection in depth.
