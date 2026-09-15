---
title: AniList client configuration
description: "Every AniList slot option — timeout, retries, pacing, hooks, exposeRawAxiosError — with types, defaults, and when to change each."
layout: .vitepress/theme/DocsLayout.vue
---

# AniList client configuration

## Complete options table

| Option                | Type                              | Default         | Behavior                                                                                                                                                                                             | When to change it                                   |
| --------------------- | --------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `timeout`             | `number`                          | `30000`         | Milliseconds before a request is aborted. `0` disables. Timeout errors carry `timeoutMs`                                                                                                             | Slow endpoints or strict latency budgets            |
| `signal`              | `AbortSignal`                     | —               | Cancels in-flight requests                                                                                                                                                                           | User-driven cancellation                            |
| `retry`               | `boolean \| Partial<RetryPolicy>` | built-in policy | Automatic retries. `false` opts out. Partial policy merges over defaults                                                                                                                             | Non-idempotent workflows, custom backoff            |
| `paceWithRateLimit`   | `boolean`                         | `true`          | Waits for window reset when remaining quota drops below `rateLimitFloor`                                                                                                                             | High-volume schedulers                              |
| `rateLimitFloor`      | `number`                          | `1`             | Remaining-quota threshold that triggers pacing. Must be a finite, non-negative integer; `0` disables floor-based pacing. A defined-but-invalid value throws                                          | Start pacing earlier than the last request          |
| `ignorePaceDeadline`  | `boolean`                         | `false`         | Bypass the shared pacing deadline for this call                                                                                                                                                      | Urgent single requests during a rate-limited window |
| `circuitBreaker`      | `{ threshold, cooldownMs }`       | off             | Fail fast with `CIRCUIT_OPEN_ERROR` after `threshold` consecutive failures until `cooldownMs` elapses                                                                                                | Protect against sustained outages                   |
| `responseCache`       | `ResponseCache`                   | off             | Opt-in TTL cache for reads (`GET` requests and GraphQL query documents)                                                                                                                              | Read-heavy traversals with repeated identical reads |
| `onError`             | `OnErrorHandler`                  | —               | Fires per failed attempt and when retries are exhausted                                                                                                                                              | Logging, metrics                                    |
| `onRetry`             | `OnErrorHandler`                  | —               | Fires when a failed attempt will be retried                                                                                                                                                          | Retry telemetry                                     |
| `onRequestStart`      | `OnRequestStartHandler`           | —               | Fires immediately before each attempt                                                                                                                                                                | Request counting                                    |
| `onResponse`          | `OnResponseHandler`               | —               | Fires after each attempt with `durationMs` and `cacheHit?`                                                                                                                                           | Latency metrics, cache hit/miss tracking            |
| `onPace`              | `OnPaceHandler`                   | —               | Fires after a rate-limit pacing wait completes (an aborted wait emits nothing — observe it via `onError` with `abortedDuringPacing: true`)                                                           | Pacing telemetry                                    |
| `onHookError`         | `OnHookErrorHandler`              | —               | Fires when a lifecycle hook throws. **Wire this to your logger in production** — without it, hook failures fall back to `console.warn`, which is unqueryable in serverless/structured-logging setups | Route hook failures to a logger                     |
| `onCircuitOpen`       | `OnCircuitOpenHandler`            | —               | Fires when the circuit breaker trips                                                                                                                                                                 | Breaker trip alerts                                 |
| `onCircuitClose`      | `OnCircuitCloseHandler`           | —               | Fires when the circuit breaker closes after a probe                                                                                                                                                  | Breaker recovery tracking                           |
| `exposeRawAxiosError` | `boolean`                         | `false`         | Attaches the raw Axios error as `rawAxiosError`/`cause`. Sensitive headers are redacted                                                                                                              | Local debugging only                                |

<Callout kind="tip">

`exposeRawAxiosError: true` redacts sensitive headers (`Authorization`, `Cookie`, `Proxy-Authorization`) to `[REDACTED]` in the attached raw error, so opting in for diagnostics does not leak bearer tokens into your logs. Debug with confidence.

</Callout>

## Usage

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("anilist-token", {
    timeout: 10_000,
    retry: { maxRetries: 3, baseDelayMs: 250 },
    paceWithRateLimit: true,
    onResponse: ({ url, durationMs }) => console.log(url, durationMs),
});
```

Each mechanism gets its own page: [Retries & resilience](/retries-and-resilience), [Observability](/observability), [Cancellation & timeouts](/cancellation-and-timeouts), [Response cache](/response-cache).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Querying data](/guides/anilist/querying) — what the configured client can call.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — overriding options per call.
