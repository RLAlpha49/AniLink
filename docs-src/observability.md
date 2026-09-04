---
title: Observability
layout: .vitepress/theme/DocsLayout.vue
---

# Observability

Four hooks report request lifecycle events. They are configured per provider slot and never leak between providers.

## Hook contracts

| Hook             | Fires                                                                                                                                                     | Payload                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `onRequestStart` | Immediately before each attempt is sent                                                                                                                   | `{ requestId, url, method, attempt }`                                                                                          |
| `onResponse`     | After each attempt completes, success or failure                                                                                                          | `{ requestId, url, method, attempt, durationMs, rateLimit? }`                                                                  |
| `onPace`         | Just before proactive rate-limit pacing delays the next request after a success                                                                           | `{ requestId, url, method, attempt, delayMs }`                                                                                 |
| `onError`        | When an attempt fails and `onRetry` is not configured (covering retryable failures), when retries are exhausted, and when a circuit-open fast-fail occurs | `(error: AniLinkError, context)` with `context = { requestId, url, method, attempt, code, status?, nextDelayMs?, rateLimit? }` |
| `onRetry`        | When a failed attempt is going to be retried; handles retryable failures when configured, in place of `onError` for those attempts                        | Same shape as `onError` with `nextDelayMs` set                                                                                 |

`attempt` is 1-based. `durationMs` is the elapsed wall-clock time of the attempt, making `onResponse` the natural point for latency metrics. `rateLimit` carries the parsed `x-ratelimit-limit`/`-remaining`/`-reset` headers whenever the upstream includes them — use it in `onResponse` to build proactive quota dashboards instead of waiting for a `429`.

`requestId` is a library-generated opaque correlation ID that is identical across every hook emission for one logical request, including across all of its retry attempts. Use it to join the events of a single request in a metrics or logging backend even when several requests to the same URL are in flight:

```typescript
onRequestStart: ({ requestId, attempt, url }) => log.info({ requestId, attempt, url }, "start"),
onResponse: ({ requestId, durationMs }) => metrics.observe("latency", durationMs, { requestId }),
```

## Firing order

<Mermaid
code="flowchart TD
A[onRequestStart attempt 1] --> B{attempt result}
B -- success --> C[onResponse]
B -- failure --> D[onError]
D --> E{retrying}
E -- yes --> F[onRetry then wait] --> G[onRequestStart attempt 2]
G --> B
E -- no / exhausted --> H[onError final]
A -. circuit open .-> FF[onRequestStart + onError CIRCUIT_OPEN_ERROR]:::err

    classDef err stroke:#b85450;"

/>

For a retryable failure, `onRetry` fires (when configured) in place of `onError` for that attempt; when `onRetry` is not configured, `onError` covers the retryable failure instead. `onError` always fires for terminal failures (retries exhausted) and circuit-open fast-fails. When the circuit breaker is open, the request fast-fails before any network call but still emits the `onRequestStart`/`onError` pair (with code `CIRCUIT_OPEN_ERROR`) so request-volume counters and error-rate dashboards do not undercount while the breaker is open.

## Usage

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("token", {
    onRequestStart: ({ requestId, attempt, url }) => {
        console.log("start", attempt, url, requestId);
    },
    onResponse: ({ requestId, url, durationMs, rateLimit }) => {
        console.log(url, `${durationMs}ms`, requestId);
        if (rateLimit && rateLimit.remaining < 10) {
            console.warn("quota running low:", rateLimit.remaining, "/", rateLimit.limit);
        }
    },
    onError: (error, { requestId, attempt, code }) => {
        console.error("request", requestId, "attempt", attempt, "failed", code, error.message);
    },
    onRetry: (_error, { requestId, attempt, nextDelayMs }) => {
        console.log("retrying after", nextDelayMs, "ms; next attempt", attempt, requestId);
    },
    onPace: ({ requestId, delayMs }) => {
        console.log("pacing", requestId, "waiting", delayMs, "ms for the rate-limit window");
    },
});
```

## Pacing signal

When `paceWithRateLimit` is enabled and a successful response reports the quota below `rateLimitFloor`, the next request waits for the window to reset. The `onPace` hook fires with the wait length (`delayMs`) just before the wait starts, so a deliberate rate-limit wait is distinguishable from a hung request in hook-based metrics. See [Retries & resilience](/retries-and-resilience) for the pacing configuration.

## Hook isolation

Hooks belong to the provider slot where they are declared. A hook registered for AniList never observes MAL traffic and vice versa:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // no hooks — MAL traffic is unobserved
});
```

### Throwing hooks

A throwing hook never affects the request pipeline: the exception is caught and reported without crashing the request, being counted as an attempt, or distorting retry/error classification. By default the report is a `console.warn`; set `onHookError` to route hook failures to your own logger or metrics instead:

```typescript
const aniLink = new AniLink("token", {
    onResponse: ({ durationMs }) => metrics.record(durationMs), // may throw
    onHookError: (hookName, error) => {
        logger.error(`lifecycle hook ${hookName} threw`, error);
    },
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — the retry loop these hooks observe.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — scoping options to a single call.
