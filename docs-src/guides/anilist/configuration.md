---
title: AniList client configuration
description: "Every AniList slot option, including timeout, retries, pacing, hooks, and exposeRawAxiosError, with types, defaults, and when to change each."
layout: .vitepress/theme/DocsLayout.vue
---

# AniList client configuration

## Complete options table

| Option                | Type                              | Default         | Behavior                                                                                                                                                                                             | When to change it                                   |
| --------------------- | --------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `timeout`             | `number`                          | `30000`         | Milliseconds before the client aborts a request. `0` disables. Timeout errors carry `timeoutMs`                                                                                                      | Slow endpoints or strict latency budgets            |
| `signal`              | `AbortSignal`                     | none            | Cancels in-flight requests                                                                                                                                                                           | User-driven cancellation                            |
| `retry`               | `boolean \| Partial<RetryPolicy>` | built-in policy | Automatic retries. `false` opts out. Partial policy merges over defaults                                                                                                                             | Non-idempotent workflows, custom backoff            |
| `paceWithRateLimit`   | `boolean`                         | `true`          | Waits for window reset when remaining quota drops below `rateLimitFloor`                                                                                                                             | High-volume schedulers                              |
| `rateLimitFloor`      | `number`                          | `1`             | Remaining-quota threshold that triggers pacing. Must be a finite, non-negative integer; `0` disables floor-based pacing. A defined-but-invalid value throws                                          | Start pacing earlier than the last request          |
| `ignorePaceDeadline`  | `boolean`                         | `false`         | Bypass the shared pacing deadline for this call                                                                                                                                                      | Urgent single requests during a rate-limited window |
| `circuitBreaker`      | `{ threshold, cooldownMs }`       | off             | Fail fast with `CIRCUIT_OPEN_ERROR` after `threshold` consecutive failures until `cooldownMs` elapses; each consecutive failed probe doubles the next cooldown, capped at 8×                         | Protect against sustained outages                   |
| `responseCache`       | `ResponseCache`                   | off             | Opt-in TTL cache for reads: `GET` requests and GraphQL query documents                                                                                                                               | Read-heavy traversals with repeated identical reads |
| `onError`             | `OnErrorHandler`                  | none            | Fires per failed attempt and when retries run out                                                                                                                                                    | Logging, metrics                                    |
| `onRetry`             | `OnErrorHandler`                  | none            | Fires when the client retries a failed attempt                                                                                                                                                       | Retry telemetry                                     |
| `onRequestStart`      | `OnRequestStartHandler`           | none            | Fires immediately before each attempt                                                                                                                                                                | Request counting                                    |
| `onResponse`          | `OnResponseHandler`               | none            | Fires after each attempt with `durationMs` and `cacheHit?`                                                                                                                                           | Latency metrics, cache hit/miss tracking            |
| `onPace`              | `OnPaceHandler`                   | none            | Fires after a rate-limit pacing wait completes, before the client sends the request. An aborted wait emits nothing; observe it via `onError` with `abortedDuringPacing: true`                        | Pacing telemetry                                    |
| `onHookError`         | `OnHookErrorHandler`              | none            | Fires when a lifecycle hook throws. **Wire this to your logger in production.** Without it, hook failures fall back to `console.warn`, which is unqueryable in serverless/structured-logging setups  | Route hook failures to a logger                     |
| `onCircuitOpen`       | `OnCircuitOpenHandler`            | none            | Fires when the circuit breaker trips                                                                                                                                                                 | Breaker trip alerts                                 |
| `onCircuitClose`      | `OnCircuitCloseHandler`           | none            | Fires when the circuit breaker closes after a probe                                                                                                                                                  | Breaker recovery tracking                           |
| `refreshToken`        | `string`                          | none            | Stored refresh token; with `clientId` and `clientSecret`, enables automatic refresh on `401` and bootstraps a client that has no `authToken`                                                         | Automatic token refresh                             |
| `clientId`            | `string`                          | none            | AniList application client ID; with `refreshToken` and `clientSecret`, enables automatic refresh                                                                                                     | Automatic token refresh                             |
| `clientSecret`        | `string`                          | none            | AniList application secret; AniList's refresh grant requires it, so the lifecycle stays off until you set it                                                                                         | Automatic token refresh                             |
| `onTokenRefresh`      | `AniListTokenRefreshCallback`     | none            | Fires after every successful automatic refresh with the effective token response; persist it synchronously                                                                                           | Persisting refreshed tokens                         |
| `exposeRawAxiosError` | `boolean`                         | `false`         | Attaches the raw Axios error as `rawAxiosError`/`cause` and redacts sensitive headers                                                                                                                | Local debugging only                                |

<Callout kind="tip">

`exposeRawAxiosError: true` redacts the `Authorization`, `Cookie`, and `Proxy-Authorization` headers to `[REDACTED]` in the attached raw error, so opting in for diagnostics does not leak bearer tokens into your logs.

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

Each mechanism gets its own page: [Retries & resilience](/retries-and-resilience), [Observability](/observability), [Cancellation & timeouts](/cancellation-and-timeouts), [Response cache](/response-cache). With `refreshToken`, `clientId`, and `clientSecret` all set, a `401` triggers an automatic refresh and a single replay. See [AniList authentication](/guides/anilist/authentication#_5-automatic-refresh).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Querying data](/guides/anilist/querying) covers what the configured client can call.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) to override instance defaults for a single call.
