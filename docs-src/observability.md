---
title: Observability
description: "The seven AniLink request-lifecycle hooks plus the onHookError failure observer, configured per provider slot so they never fire for another provider's requests."
layout: .vitepress/theme/DocsLayout.vue
---

# Observability

Seven hooks report request-lifecycle events: `onRequestStart`, `onResponse`, `onPace`, `onError`, `onRetry`, `onCircuitOpen`, and `onCircuitClose`. The `onHookError` observer reports exceptions from lifecycle hooks and token-refresh persistence callbacks, not lifecycle events. Token refresh also has two credential-slot callbacks, `onTokenRefresh` and `onTokenRefreshError` (see [Token refresh events](#token-refresh-events)). Request hooks stay within their provider or per-request scope. They never observe another provider's traffic.

## Hook contracts

| Hook             | Fires                                                                                                                                                                                                                                                                    | Payload                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onRequestStart` | Immediately before each attempt is sent                                                                                                                                                                                                                                  | `{ requestId, url, method, attempt }`                                                                                                                                                |
| `onResponse`     | After each attempt completes, success or failure. Carries `cacheHit: true` when the response cache supplies it, `cacheWrite: true` when a cache-miss read's response was actually written back to the cache, and `pacedMs` when the request waited for rate-limit pacing | `{ requestId, url, method, attempt, durationMs, rateLimit?, cacheHit?, cacheWrite?, pacedMs? }`                                                                                      |
| `onPace`         | After a proactive rate-limit pacing wait completes and before the request is dispatched. An aborted wait emits the elapsed portion with `aborted: true`.                                                                                                                 | { requestId, url, method, attempt, delayMs, aborted? }                                                                                                                               |
| `onError`        | When an attempt fails and `onRetry` is not configured (covering retryable failures), when retries are exhausted, and when a circuit-open fast-fail occurs                                                                                                                | `(error: AniLinkError, context)` with `context = { requestId, url, method, attempt, code, status?, nextDelayMs?, rateLimit?, retryWaitMs?, budgetExhausted?, host?, retryAfterMs? }` |
| `onRetry`        | The transport calls it before retrying a failed attempt. When configured, it handles retryable failures instead of `onError` for those attempts.                                                                                                                         | Same shape as `onError` with `nextDelayMs` set                                                                                                                                       |
| `onCircuitOpen`  | When the circuit breaker trips (consecutive failures reach the threshold)                                                                                                                                                                                                | `{ requestId, url, method, attempt, host, failures }`                                                                                                                                |
| `onCircuitClose` | When the circuit breaker closes after a successful post-cooldown probe                                                                                                                                                                                                   | `{ requestId, url, method, attempt, host }`                                                                                                                                          |

`attempt` starts at 1. `durationMs` measures the elapsed wall-clock time for an attempt. Use `onResponse` to record latency. `rateLimit` contains the parsed `x-ratelimit-limit`, `-remaining`, and `-reset` headers when the upstream sends them. Use it in `onResponse` to track remaining quota instead of relying on `429` responses.

Optional error-context fields appear only when they apply. `retryWaitMs` reports the total time spent waiting between attempts, including retry backoff and server-directed delays. It appears only when a wait occurred. Use it to distinguish a request that waited through several server-directed `429` delays from a fast validation failure without joining `onRetry` events by `requestId`.

The terminal report sets `budgetExhausted: true` when a retryable failure surfaces because the per-window retry budget ran out. This lets you observe chronic intermittent failures as they happen instead of polling `getTransportState()`.

On a circuit-open fast-fail, `host` identifies the upstream and `retryAfterMs` reports the remaining cooldown. You can graph fast-fail volume by host and read the retry delay from the payload.

`requestId` is a library-generated opaque correlation ID. It stays the same across every hook emission for one logical request, including retries. Use it to join a request's events in a metrics or logging backend, even when several requests to the same URL run at once. The thrown `AniLinkError` carries the same value as `error.requestId`, so you can match a caught failure to its lifecycle events:

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

For a retryable failure, the transport calls `onRetry` when configured. Otherwise, it calls `onError` for that attempt. The transport always calls `onError` for terminal failures and circuit-open fast-fails. With an open breaker, the request fails before any network call but still emits `onRequestStart` and `onError` with code `CIRCUIT_OPEN_ERROR`. Request-volume counters and error-rate dashboards continue to include these requests.

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

When `paceWithRateLimit` is enabled and a successful response reports quota below `rateLimitFloor`, the next request waits for the window to reset. After a completed wait, `onPace` reports its length in `delayMs`. This keeps metrics from mistaking a deliberate rate-limit wait for a stalled request.

If the caller aborts a wait, the transport emits `onPace` before rejecting the request. The payload sets `aborted: true` and reports the elapsed deadline wait, so a cancelled wait differs from a request that never waited. A completed wait omits `aborted` and reports the full deadline wait. Both values exclude the random stagger, which is capped at 500 ms and prevents queued requests from dispatching together. An aborted wait reports elapsed time, not the remaining deadline, so pacing metrics do not overcount.

You can identify paced requests without configuring `onPace`. When a wait occurs, `onResponse` includes `pacedMs`, the total pacing time across the request's attempts. It uses the same stagger-excluded measure as `onPace`, so metrics from the two hooks are comparable.

For a retried request, `pacedMs` can exceed the final attempt's `durationMs`. The latter measures only that attempt, while `pacedMs` includes waits before earlier failed attempts. Requests that never waited omit `pacedMs`, just as they omit `cacheHit` and `cacheWrite`. Use this field to separate paced from unpaced traffic in latency dashboards:

```typescript
onResponse: ({ durationMs, pacedMs }) => {
    metrics.observe(pacedMs === undefined ? "latency" : "paced-latency", durationMs);
},
```

## Circuit breaker events

When enabled, the circuit breaker emits events at state transitions. Use them to track trip frequency, time open, and recovery without parsing `CIRCUIT_OPEN_ERROR` codes:

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

Hooks in a provider slot observe only that provider's requests. An AniList hook never fires for MAL traffic, and a MAL hook never fires for AniList traffic:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // no hooks: MAL traffic is unobserved
});
```

### Throwing hooks

A throwing hook does not fail the request or change its retry and error classification. The transport catches the exception and reports it without counting it as an attempt. By default, the library writes a `console.warn` that includes `requestId`. Set `onHookError` to route hook failures to your logger or metrics instead:

```typescript
const aniLink = new AniLink("token", {
    onResponse: ({ durationMs }) => metrics.record(durationMs), // may throw
    onHookError: (hookName, error) => {
        logger.error(`lifecycle hook ${hookName} threw`, error);
    },
});
```

### Client-level `onHookError`

When using the per-provider credentials form, set `onHookError` at the top level of the credentials object. It applies to every provider slot without its own observer. This lets you define one hook-failure logger per client instead of repeating it in each slot:

```typescript
const aniLink = new AniLink({
    onHookError: (hookName, error) => logger.error(`hook ${hookName} threw`, error),
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // inherits the client-level onHookError
});
```

### `onHookError` precedence

The full precedence chain, most specific first:

1. **Per-request.** An `onHookError` set on the trailing options object of a single call wins for that call.
2. **Slot-level.** An `onHookError` set inside a provider's credentials wins for that provider's requests and blocks the client-level default. It is a transport `RequestOptions` field, so you set it alongside `onResponse` and the other hooks in the slot.
3. **Client-level.** The top-level `onHookError` on the credentials object applies only to slots that do not define their own.

When unset at every level, hook failures fall back to `console.warn`.

On the MAL and AniList slots, slot-level `onHookError` observes request-hook failures and token-refresh events. A failed refresh grant uses the hook name `malTokenRefresh` (MAL) or `aniListTokenRefresh` (AniList). Its sanitized refresh error is available as `error.cause`, with its `status` and `code` intact. A throwing `onTokenRefresh` persistence callback uses the `onTokenRefresh` hook name. The client-level observer handles both when a slot has no observer of its own.

The `stateOwner` diagnostic (below) follows the same resolution. The transport emits it through the triggering request's resolved observer. That is the per-request observer when one is set, otherwise the slot's, otherwise the client-level default.

### The `stateOwner` diagnostic

`onHookError` also reports one diagnostic that is not a hook failure. If the caller omits `stateOwner`, the transport uses the per-request options object as the key for cross-request state, such as the circuit breaker, retry budget, and rate-limit pacing deadlines. It emits `onHookError("stateOwner", Error)` once, or writes a structured `console.warn` when no observer is configured.

Creating a fresh options object for every call creates a new state key each time. Failure streaks then never accumulate, the breaker cannot trip, and pacing deadlines do not delay later requests. Pass a stable `stateOwner` or reuse one options object across calls. Code that switches on `hookName` should handle the reserved name `"stateOwner"` as well as hook names.

### Structured diagnostics and the `diagnostics` option

The library sends hook-failure fallbacks and the `stateOwner` warning through one structured diagnostic path. Each diagnostic is a machine-readable record:

```json
{
    "source": "anilink",
    "kind": "hook-failure",
    "hookName": "onResponse",
    "requestId": "0d2d91d7-fb66-4e11-9af6-c1d80587163c",
    "message": "The onResponse hook threw and was ignored: metrics down"
}
```

`kind` has three values: `"hook-failure"` for a lifecycle hook exception, `"state-owner"` for the one-time `stateOwner` warning, and `"token-refresh"` for a failed MAL or AniList refresh grant. The last value distinguishes upstream grant failures from hook failures in metrics. Use `kind` to branch on diagnostic type. `hookName` identifies the hook or reserved diagnostic name for display and correlation.

When an observer is configured, the `Error` passed to `onHookError` carries the structured record. For a throwing hook, `error.cause` contains the original thrown value. For a `stateOwner` warning, `error.cause` is the record itself. For a failed refresh grant, it is the sanitized `AniLinkError`, including `status` and `code`.

Without an observer, `console.warn` receives the JSON-serialized record as one argument. Log collectors can filter on `source`, `kind`, `hookName`, and `requestId` without parsing prose. Failed refresh grants do not reach this fallback. The library rethrows each failure, so the caller receives it once as the request rejection.

The `diagnostics` option accepts `"warn"`, `"hook"`, or `"silent"` at the per-request, per-slot, or client level. It defaults to `"warn"`. A client-level value applies to every provider slot without its own setting, like client-level `onHookError`:

| Mode       | Behavior                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `"warn"`   | Route through `onHookError` when configured. Otherwise, emit the serialized record via `console.warn`.             |
| `"hook"`   | Route through `onHookError` only. Do not write to the console, so captured-console environments receive no output. |
| `"silent"` | Suppress both diagnostics.                                                                                         |

These modes control fallback output, not failures sent to a configured `onHookError`. The observer still receives throwing-hook failures and failed MAL or AniList refresh grants in `"silent"` and `"hook"` modes. The `paginate` and `paginateChunks` helpers and both token-refresh lifecycles also accept `diagnostics` for callback-failure reports.

The transport consumes the one-time `stateOwner` warning only after it emits it. If the first trigger uses `"silent"`, or `"hook"` without an observer, the transport suppresses the warning and leaves it unspent. A later `"warn"` request can still emit it.

## Token refresh events

The automatic token-refresh lifecycle (both providers) reports through two dedicated callbacks on the provider's credential slot, independent of the request hooks:

| Callback              | Fires                                | Payload                                                                                          |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `onTokenRefresh`      | After every successful refresh grant | The effective token response (`MalTokenResponse` / `AniListTokenResponse`)                       |
| `onTokenRefreshError` | When a refresh grant fails           | The sanitized refresh error the awaiting caller catches (an `AniLinkError` with `status`/`code`) |

Each callback fires once per grant. Concurrent `401` responses share one in-flight grant, so they produce one event rather than duplicate alerts. `onTokenRefreshError` receives the same sanitized error that the failing call rejects with. The observer and the caller's `catch` therefore see the same error:

```typescript
const aniLink = new AniLink({
    mal: {
        refreshToken: stored.refresh_token,
        clientId: "mal-client-id",
        onTokenRefresh: (response) => saveToken(response),
        onTokenRefreshError: (error) => {
            // error.status and error.code are inspectable
            alerting.record("token-refresh-failed", error);
        },
    },
});
```

The lifecycle also reports failed grants through `onHookError`, using `malTokenRefresh` for MAL and `aniListTokenRefresh` for AniList, with diagnostic kind `"token-refresh"`. Use `onTokenRefreshError` for typed refresh-failure alerts instead of parsing hook diagnostics. A successful refresh emits `onTokenRefresh`. A failed grant emits one `onTokenRefreshError` event, then each waiting call receives the rejection. If `onTokenRefreshError` throws, `onHookError` reports that exception or the library writes a console warning. The callback never replaces the refresh error returned to the caller.

## Transport state snapshot

Hooks report events as they happen. Call `getTransportState()` to inspect the current breaker state, retry-budget usage, or pacing deadlines without configuring a hook:

```typescript
const state = aniLink.getTransportState();

// Per-host circuit-breaker records for the AniList client:
for (const breaker of state.anilist.circuit) {
    console.log(
        breaker.host,
        breaker.openedAt === null
            ? "closed"
            : `open since ${new Date(breaker.openedAt).toISOString()}`,
        `failures: ${breaker.consecutiveFailures}`
    );
}

// The client's retry-budget window, present once a budget-configured
// client has dispatched at least one request:
if (state.anilist.retryBudget) {
    console.log("budget retries spent:", state.anilist.retryBudget.retriesUsed);
}

// Recorded rate-limit pacing deadlines, one per host:
for (const deadline of state.anilist.paceDeadlines) {
    console.log("pacing until", new Date(deadline.deadlineMs).toISOString(), "for", deadline.host);
}

// The response-cache counters, present when the provider's transport
// options enable a response cache:
if (state.anilist.responseCache) {
    console.log("cache entries:", state.anilist.responseCache.entries);
    console.log(
        "hits/misses:",
        state.anilist.responseCache.hits,
        state.anilist.responseCache.misses
    );
}
```

The snapshot is read-only. The library deep-freezes every nested object and array, so mutation throws in strict mode. It also copies live state, so changing the snapshot cannot affect transport behavior. Building a snapshot does not mutate the state: it creates no circuit entry for an unseen host, does not roll an elapsed retry-budget window forward, and leaves stale pacing deadlines in place. You can poll `getTransportState()` while requests run.

Each call returns a new point-in-time copy. Its fields reflect the values observed when the snapshot was built, and `capturedAt` records that time in epoch milliseconds. The builder sets `capturedAt` once.

`circuit` and `paceDeadlines` contain one entry for each host with recorded state. `retryBudget` appears only when the client has a recorded budget window. `responseCache` appears only when the provider's transport options enable a [`ResponseCache`](/response-cache). It includes the live entry count and lifetime hit, miss, expiration, and eviction counters, matching the snapshot from `ResponseCache#stats()`. The facade exposes these counters even when the cache is configured in a provider credentials slot and the client is constructed for you. The `mal` key has the same shape for MyAnimeList. AniList and MAL state remain isolated.

### Composing your own clients

`getTransportState()` is a facade shortcut for the exported `snapshotTransportState` builder. If you build clients with `buildProviderClients(...)` instead of `AniLink`, use the corresponding `stateOwners` entry with `snapshotTransportState`. The registry creates one state owner per provider and wires that provider's circuit-breaker, retry-budget, and pacing state through it. Pass the owner to `snapshotTransportState`.

```typescript
import { buildProviderClients, snapshotTransportState } from "anilink-api-wrapper";

const clients = buildProviderClients({ anilist: { authToken: "anilist-token" } });

// The AniList client keys its shared transport state through this owner:
const anilistState = snapshotTransportState(
    clients.stateOwners.anilist,
    clients.responseCaches?.anilist // optional: adds the responseCache counters
);
console.log(anilistState.capturedAt, anilistState.circuit.length);
```

Inside `getTransportState()`, the facade calls `snapshotTransportState(stateOwners.<provider>, responseCaches?.<provider>)` for each provider. Both paths return the same frozen `TransportStateSnapshot` shape.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers the retry loop these hooks observe.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) scopes options to a single call.
- <Icon name="ArrowRight" :size="14" /> [Response cache](/response-cache) documents the `cacheHit` flag on `onResponse`.
