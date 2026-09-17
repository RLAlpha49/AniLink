---
title: Observability
description: "The seven AniLink request-lifecycle hooks plus the onHookError failure observer, configured per provider slot so they never leak between providers."
layout: .vitepress/theme/DocsLayout.vue
---

# Observability

Seven lifecycle hooks report request lifecycle events — `onRequestStart`, `onResponse`, `onPace`, `onError`, `onRetry`, `onCircuitOpen`, and `onCircuitClose` — plus the `onHookError` observer, which reports failures of any of those hooks (and of the MAL token-refresh callbacks) instead of lifecycle events itself. Configure them per provider slot — they never leak between providers.

## Hook contracts

| Hook             | Fires                                                                                                                                                                            | Payload                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `onRequestStart` | Immediately before each attempt is sent                                                                                                                                          | `{ requestId, url, method, attempt }`                                                                                          |
| `onResponse`     | After each attempt completes, success or failure. Carries `cacheHit: true` when served from the response cache, and `pacedMs` when the request waited for rate-limit pacing      | `{ requestId, url, method, attempt, durationMs, rateLimit?, cacheHit?, pacedMs? }`                                             |
| `onPace`         | After a proactive rate-limit pacing wait completes, before the request is dispatched (an aborted wait emits nothing — observe it via `onError` with `abortedDuringPacing: true`) | { requestId, url, method, attempt, delayMs }                                                                                   |
| `onError`        | When an attempt fails and `onRetry` is not configured (covering retryable failures), when retries are exhausted, and when a circuit-open fast-fail occurs                        | `(error: AniLinkError, context)` with `context = { requestId, url, method, attempt, code, status?, nextDelayMs?, rateLimit? }` |
| `onRetry`        | When a failed attempt is going to be retried; handles retryable failures when configured, in place of `onError` for those attempts                                               | Same shape as `onError` with `nextDelayMs` set                                                                                 |
| `onCircuitOpen`  | When the circuit breaker trips (consecutive failures reach the threshold)                                                                                                        | `{ requestId, url, method, attempt, host, failures }`                                                                          |
| `onCircuitClose` | When the circuit breaker closes after a successful post-cooldown probe                                                                                                           | `{ requestId, url, method, attempt, host }`                                                                                    |

`attempt` is 1-based. `durationMs` is the elapsed wall-clock time of the attempt, which makes `onResponse` the natural home for latency metrics. `rateLimit` carries the parsed `x-ratelimit-limit`/`-remaining`/`-reset` headers whenever the upstream includes them — use it in `onResponse` to build proactive quota dashboards instead of waiting for a `429` to spoil the mood.

`requestId` is a library-generated opaque correlation ID, identical across every hook emission for one logical request — retries included. Use it to join the events of a single request in a metrics or logging backend, even when several requests to the same URL are in flight at once. The same `requestId` is stamped on the thrown `AniLinkError` (as `error.requestId`), so a caught failure can be matched to its full lifecycle event stream:

```typescript
onRequestStart: ({ requestId, attempt, url }) => log.info({ requestId, attempt, url }, "start"),
onResponse: ({ requestId, durationMs }) => metrics.observe("latency", durationMs, { requestId }),
```

When a request fails, the caught error carries the same `requestId`:

```typescript
try {
    await aniLink.anilist.query.media({ id: 1 });
} catch (error) {
    // error.requestId matches the requestId emitted to the hooks above
    logger.error({ requestId: error.requestId, code: error.code }, "request failed");
}
```

## Firing order

<Mermaid
    :code="`flowchart TD\nA[onRequestStart attempt 1] --> B{attempt result}\nB -- success --> C[onResponse]\nB -- failure --> D[onError]\nD --> E{retrying}\nE -- yes --> F[onRetry then wait] --> G[onRequestStart attempt 2]\nG --> B\nE -- no / exhausted --> H[onError final]\nA -. circuit open .-> FF[onRequestStart + onError CIRCUIT_OPEN_ERROR]:::err\n\n    classDef err stroke:#b85450;`"
/>

For a retryable failure, `onRetry` fires (when configured) in place of `onError` for that attempt; when `onRetry` is not configured, `onError` covers the retryable failure instead. `onError` always fires for terminal failures (retries exhausted) and circuit-open fast-fails. And when the breaker is open, the request fast-fails before any network call but still emits the `onRequestStart`/`onError` pair (with code `CIRCUIT_OPEN_ERROR`) — request-volume counters and error-rate dashboards keep counting honestly while the breaker is open.

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

When `paceWithRateLimit` is enabled and a successful response reports the quota below `rateLimitFloor`, the next request waits for the window to reset. The `onPace` hook fires with the wait length (`delayMs`) after the wait completes, so a deliberate rate-limit wait never gets mistaken for a hung request in hook-based metrics — and an aborted wait never emits a full-delay event that would over-count pacing time. See [Retries & resilience](/retries-and-resilience) for the pacing configuration.

Paced requests are also identifiable without `onPace` pre-wired: `onResponse` carries `pacedMs` — the total time the request spent waiting for rate-limit pacing across its attempts — whenever a wait occurred. The counter is cumulative: on a retried request it can exceed the final attempt's `durationMs`, which measures only that attempt (a wait before a failed attempt is still stamped on the retried attempt's emission). Requests that never waited carry no `pacedMs` at all, mirroring the optional-presence convention of `cacheHit`, so latency dashboards built on `onResponse` can split paced from unpaced traffic:

```typescript
onResponse: ({ durationMs, pacedMs }) => {
    metrics.observe(pacedMs === undefined ? "latency" : "paced-latency", durationMs);
},
```

## Circuit breaker events

When the circuit breaker is enabled, it emits lifecycle events at state transitions, so dashboards can plot trip frequency, open duration, and recovery without scraping `CIRCUIT_OPEN_ERROR` codes:

| Hook             | Fires                                                             | Payload                                               |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| `onCircuitOpen`  | When the breaker trips (consecutive failures reach the threshold) | `{ requestId, url, method, attempt, host, failures }` |
| `onCircuitClose` | When the breaker closes after a successful post-cooldown probe    | `{ requestId, url, method, attempt, host }`           |

```typescript
const aniLink = new AniLink("token", {
    circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
    onCircuitOpen: ({ host, failures }) => {
        metrics.increment("circuit.open", { host, failures });
    },
    onCircuitClose: ({ host }) => {
        metrics.increment("circuit.close", { host });
    },
});
```

## Hook isolation

Hooks belong to the provider slot where they are declared. A hook registered for AniList never sees MAL traffic, and vice versa:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // no hooks — MAL traffic is unobserved
});
```

### Throwing hooks

A throwing hook never takes the request pipeline down with it: the exception is caught and reported without crashing the request, being counted as an attempt, or distorting retry/error classification. By default the report is a `console.warn` that includes the `requestId` for correlation; set `onHookError` to route hook failures to your own logger or metrics instead:

```typescript
const aniLink = new AniLink("token", {
    onResponse: ({ durationMs }) => metrics.record(durationMs), // may throw
    onHookError: (hookName, error) => {
        logger.error(`lifecycle hook ${hookName} threw`, error);
    },
});
```

### Client-level `onHookError`

When using the per-provider credentials form, set `onHookError` at the top level of the credentials object and it applies to every provider slot that does not define its own. One hook-error logger, wired once per client — no repetition in each slot:

```typescript
const aniLink = new AniLink({
    onHookError: (hookName, error) => logger.error(`hook ${hookName} threw`, error),
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // inherits the client-level onHookError
});
```

### `onHookError` precedence

The full precedence chain, most specific first:

1. **Per-request** — an `onHookError` set on the trailing options object of a single call wins for that call.
2. **Slot-level** — an `onHookError` set inside a provider's credentials (it is a transport `RequestOptions` field, so it lives next to `onResponse` and friends in the slot) wins for that provider's requests and blocks the client-level default.
3. **Client-level** — the top-level `onHookError` on the credentials object applies only to slots that do not define their own.

When unset at every level, hook failures fall back to `console.warn`.

On the MAL slot, the slot-level `onHookError` does double duty: besides request-hook failures, it also observes the automatic token-refresh lifecycle — a failed refresh grant is reported under the `malTokenRefresh` hook name, and a throwing `onTokenRefresh` persistence callback under the `onTokenRefresh` hook name. The client-level default covers both when the slot defines no observer of its own.

The `stateOwner` diagnostic (below) follows the same resolution: it is emitted through the triggering request's resolved observer — the per-request one when set, otherwise the slot's, otherwise the client-level default.

### The `stateOwner` diagnostic

`onHookError` also carries one diagnostic that is not a hook failure: when cross-request transport state (circuit breaker, retry budget, or rate-limit pacing deadlines) would be keyed by a per-request options object (no `stateOwner` was passed), the transport emits a one-time `onHookError("stateOwner", Error)` event — or falls back to `console.warn` when no observer is configured. Callers that build a fresh options object per call silently get a fresh state key per call, so failure streaks never accumulate, the breaker never engages, and recorded pacing deadlines never gate later requests; the warning points at the fix (pass a stable `stateOwner`, or reuse one options object across calls). Consumers switching on `hookName` for metrics should expect the reserved name `"stateOwner"` alongside real hook names.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — the retry loop these hooks observe.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — scoping options to a single call.
- <Icon name="ArrowRight" :size="14" /> [Response cache](/response-cache) — the `cacheHit` flag on `onResponse`.
