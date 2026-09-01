---
title: AniList client configuration
layout: .vitepress/theme/DocsLayout.vue
---

# AniList client configuration

## Complete options table

| Option | Type | Default | Behavior | When to change it |
| --- | --- | --- | --- | --- |
| `timeout` | `number` | `30000` | Milliseconds before a request is aborted. `0` disables. Timeout errors carry `timeoutMs` | Slow endpoints or strict latency budgets |
| `signal` | `AbortSignal` | — | Cancels in-flight requests | User-driven cancellation |
| `retry` | `boolean \| Partial<RetryPolicy>` | built-in policy | Automatic retries. `false` opts out. Partial policy merges over defaults | Non-idempotent workflows, custom backoff |
| `paceWithRateLimit` | `boolean` | `false` | Waits for window reset when remaining quota drops below `rateLimitFloor` | High-volume schedulers |
| `rateLimitFloor` | `number` | `1` | Remaining-quota threshold that triggers pacing (minimum 1) | Start pacing earlier than the last request |
| `circuitBreaker` | `{ threshold, cooldownMs }` | off | Fail fast with `CIRCUIT_OPEN_ERROR` after `threshold` consecutive failures until `cooldownMs` elapses | Protect against sustained outages |
| `onError` | `OnErrorHandler` | — | Fires per failed attempt and when retries are exhausted | Logging, metrics |
| `onRetry` | `OnErrorHandler` | — | Fires when a failed attempt will be retried | Retry telemetry |
| `onRequestStart` | `OnRequestStartHandler` | — | Fires immediately before each attempt | Request counting |
| `onResponse` | `OnResponseHandler` | — | Fires after each attempt with `durationMs` | Latency metrics |
| `exposeRawAxiosError` | `boolean` | `false` | Attaches the raw Axios error as `rawAxiosError`/`cause` | Local debugging only |

<Callout kind="caution">

`exposeRawAxiosError: true` attaches request configuration that includes bearer-token headers. Never enable it in production or log `rawAxiosError`.

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

Details per mechanism: [Retries & resilience](/retries-and-resilience), [Observability](/observability), [Cancellation & timeouts](/cancellation-and-timeouts).

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Querying data](/guides/anilist/querying) — what the configured client can call.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — overriding options per call.
