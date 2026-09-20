---
title: Observability
description: "The seven AniLink request-lifecycle hooks plus the onHookError failure observer, configured per provider slot so they never fire for another provider's requests."
layout: .vitepress/theme/DocsLayout.vue
---

# Observability

Seven hooks report request lifecycle events: `onRequestStart`, `onResponse`, `onPace`, `onError`, `onRetry`, `onCircuitOpen`, and `onCircuitClose`. The `onHookError` observer reports failures of any of those hooks and of the token-refresh persistence callbacks. It does not report lifecycle events itself. The automatic token-refresh lifecycle also reports through its own pair of credential-slot callbacks, `onTokenRefresh` and `onTokenRefreshError` (see [Token refresh events](#token-refresh-events)). Configure them per provider slot; they never fire for another provider's requests.

## Hook contracts

| Hook             | Fires                                                                                                                                                                                                                                                                    | Payload                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onRequestStart` | Immediately before each attempt is sent                                                                                                                                                                                                                                  | `{ requestId, url, method, attempt }`                                                                                                                                                |
| `onResponse`     | After each attempt completes, success or failure. Carries `cacheHit: true` when the response cache supplies it, `cacheWrite: true` when a cache-miss read's response was actually written back to the cache, and `pacedMs` when the request waited for rate-limit pacing | `{ requestId, url, method, attempt, durationMs, rateLimit?, cacheHit?, cacheWrite?, pacedMs? }`                                                                                      |
| `onPace`         | After a proactive rate-limit pacing wait completes, before the request is dispatched; an aborted wait emits the elapsed portion with `aborted: true`                                                                                                                     | { requestId, url, method, attempt, delayMs, aborted? }                                                                                                                               |
| `onError`        | When an attempt fails and `onRetry` is not configured (covering retryable failures), when retries are exhausted, and when a circuit-open fast-fail occurs                                                                                                                | `(error: AniLinkError, context)` with `context = { requestId, url, method, attempt, code, status?, nextDelayMs?, rateLimit?, retryWaitMs?, budgetExhausted?, host?, retryAfterMs? }` |
| `onRetry`        | When the transport is about to retry a failed attempt; handles retryable failures when configured, in place of `onError` for those attempts                                                                                                                              | Same shape as `onError` with `nextDelayMs` set                                                                                                                                       |
| `onCircuitOpen`  | When the circuit breaker trips (consecutive failures reach the threshold)                                                                                                                                                                                                | `{ requestId, url, method, attempt, host, failures }`                                                                                                                                |
| `onCircuitClose` | When the circuit breaker closes after a successful post-cooldown probe                                                                                                                                                                                                   | `{ requestId, url, method, attempt, host }`                                                                                                                                          |

`attempt` is 1-based. `durationMs` is the elapsed wall-clock time of the attempt, so build latency metrics from `onResponse`. `rateLimit` carries the parsed `x-ratelimit-limit`/`-remaining`/`-reset` headers whenever the upstream includes them. Use it in `onResponse` to track remaining quota instead of waiting for a `429`.

The optional error-context fields follow the same optional-presence convention: `retryWaitMs` carries the total time the request spent waiting between attempts (retry backoff and server-dictated delays), present only when a wait occurred, so a request that failed after several server-dictated 429 delays stays distinguishable from a fast validation failure without joining `onRetry` events per `requestId`. `budgetExhausted` is `true` on the terminal report of a failure that was retryable but surfaced because the per-window retry budget was spent — the chronic-intermittent-failure condition the budget exists to detect, observable as it happens instead of via `getTransportState()` polling. On a circuit-open fast-fail, `host` names the upstream the breaker fast-failed for and `retryAfterMs` carries the cooldown remaining, so fast-fail volume is graphable per upstream and "when can I retry?" is answered in the structured payload instead of the message prose.

`requestId` is a library-generated opaque correlation ID, identical across every hook emission for one logical request, including retries. Use it to join the events of a single request in a metrics or logging backend, even when several requests to the same URL are in flight at once. The thrown `AniLinkError` carries the same `requestId` (as `error.requestId`), so you can match a caught failure to its full lifecycle event stream:

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

For a retryable failure, `onRetry` fires (when configured) in place of `onError` for that attempt; when `onRetry` is not configured, `onError` covers the retryable failure instead. `onError` always fires for terminal failures (retries exhausted) and circuit-open fast-fails. When the breaker is open, the request fast-fails before any network call but still emits the `onRequestStart`/`onError` pair (with code `CIRCUIT_OPEN_ERROR`). Request-volume counters and error-rate dashboards therefore keep counting while the breaker is open.

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

When `paceWithRateLimit` is enabled and a successful response reports the quota below `rateLimitFloor`, the next request waits for the window to reset. The `onPace` hook fires with the wait length (`delayMs`) after the wait completes, so hook-based metrics never mistake a deliberate rate-limit wait for a hung request. A wait aborted partway through emits `onPace` with the elapsed portion in `delayMs` and `aborted: true` before the request rejects, so a cancelled pacing wait stays distinguishable from no pacing at all without watching `onError`. Completed waits never carry `aborted`, and their `delayMs` reports the true deadline wait — never the small random stagger (bounded at 500 ms) added to the sleep so requests queued on one window reset do not fire as a synchronized burst. An aborted wait reports the elapsed portion of the deadline wait in `delayMs` (the same stagger-excluded measure), never the full remaining deadline, so pacing time is not over-counted.

You can also identify paced requests without configuring `onPace`. `onResponse` carries `pacedMs`, the total time the request spent waiting for rate-limit pacing across its attempts, whenever a wait occurred. The counter is cumulative and reports the same stagger-excluded deadline wait `onPace` does, so metrics joined across the two hooks stay comparable. On a retried request it can exceed the final attempt's `durationMs`, because `durationMs` measures only that attempt while `pacedMs` still counts a wait that happened before a failed attempt. Requests that never waited carry no `pacedMs` at all, the same optional-presence convention as `cacheHit` and `cacheWrite`, so latency dashboards built on `onResponse` can split paced from unpaced traffic:

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

Hooks belong to the provider slot where you declare them. A hook registered for AniList never fires for MAL traffic, and vice versa:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // no hooks: MAL traffic is unobserved
});
```

### Throwing hooks

A throwing hook never fails the request. The transport catches and reports the exception without crashing the request, counting it as an attempt, or changing retry or error classification. By default the report is a `console.warn` that includes the `requestId` for correlation; set `onHookError` to route hook failures to your own logger or metrics instead:

```typescript
const aniLink = new AniLink("token", {
    onResponse: ({ durationMs }) => metrics.record(durationMs), // may throw
    onHookError: (hookName, error) => {
        logger.error(`lifecycle hook ${hookName} threw`, error);
    },
});
```

### Client-level `onHookError`

When using the per-provider credentials form, set `onHookError` at the top level of the credentials object. It applies to every provider slot that does not define its own. Declare one hook-error logger per client instead of repeating it in each slot:

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

On the MAL and AniList slots, the slot-level `onHookError` observes both request-hook failures and the automatic token-refresh lifecycle. The transport reports a failed refresh grant under the `malTokenRefresh` (MAL) or `aniListTokenRefresh` (AniList) hook name, with the sanitized refresh error as `error.cause` so its `status` and `code` stay inspectable. It reports a throwing `onTokenRefresh` persistence callback under the `onTokenRefresh` hook name. The client-level default covers both when the slot defines no observer of its own.

The `stateOwner` diagnostic (below) follows the same resolution. The transport emits it through the triggering request's resolved observer. That is the per-request observer when one is set, otherwise the slot's, otherwise the client-level default.

### The `stateOwner` diagnostic

`onHookError` also carries one diagnostic that is not a hook failure. When the caller passes no `stateOwner`, a per-request options object becomes the key for cross-request transport state (circuit breaker, retry budget, or rate-limit pacing deadlines). The transport then emits a one-time `onHookError("stateOwner", Error)` event, or falls back to a structured `console.warn` record when no observer is configured. Callers that build a fresh options object per call silently get a fresh state key per call, so failure streaks never accumulate, the breaker never trips, and recorded pacing deadlines never delay later requests. The warning states the fix (pass a stable `stateOwner`, or reuse one options object across calls). Consumers switching on `hookName` for metrics should expect the reserved name `"stateOwner"` alongside real hook names.

### Structured diagnostics and the `diagnostics` option

The library routes its only unsolicited output, the hook-failure fallback and the `stateOwner` warning above, through a single structured emit path. Every diagnostic is a machine-readable record:

```json
{
    "source": "anilink",
    "kind": "hook-failure",
    "hookName": "onResponse",
    "requestId": "0d2d91d7-fb66-4e11-9af6-c1d80587163c",
    "message": "The onResponse hook threw and was ignored: metrics down"
}
```

Three `kind` values exist: `"hook-failure"` (a lifecycle hook threw), `"state-owner"` (the one-time warning about `stateOwner` keying), and `"token-refresh"` (a MAL or AniList refresh grant failed, a real upstream failure rather than a hook failure, so grant-failure metrics do not corrupt hook-health dashboards). `kind` is the sole machine key to switch on; `hookName` names the specific hook (or reserved diagnostic name) for display and correlation, not for branching. When an observer is configured, the `Error` passed to `onHookError` carries the structured record. For a throwing hook, `error.cause` holds the raw thrown value, so the original exception stays inspectable; for the `stateOwner` warning, the record itself is the `cause`; for a failed refresh grant, the sanitized refresh error (an `AniLinkError` with `status`/`code`) is the `cause`. When no observer is configured, the fallback `console.warn` receives the JSON-serialized record as a single argument, so platform log collectors get filterable `source`/`kind`/`hookName`/`requestId` fields instead of prose to parse. The one exception is the failed refresh grant. The library rethrows it to the caller, so it never reaches the console fallback either; the caller receives that failure once, as the rejection they already handle.

The `diagnostics` option (per-request, per-slot, or client-level on the credentials object, `"warn"` | `"hook"` | `"silent"`, default `"warn"`) controls emission. The client-level value applies to every provider slot that does not define its own, exactly like the client-level `onHookError`:

| Mode       | Behavior                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| `"warn"`   | Route through `onHookError` when configured; otherwise emit the serialized record via `console.warn`.         |
| `"hook"`   | Route through `onHookError` only; nothing goes to the console, so captured-console environments get no noise. |
| `"silent"` | Suppress both diagnostics.                                                                                    |

`"silent"` and `"hook"` never silence real failures observed by a configured `onHookError`, whether a throwing hook or a failed MAL or AniList refresh grant; they only control the unsolicited fallback output. The pagination helpers (`paginate`, `paginateChunks`) and both token-refresh lifecycles accept the same `diagnostics` option for their callback-failure reports.

The one-time `stateOwner` warning is spent only when an emission happened. A first trigger under `"silent"` (or `"hook"` with no observer) suppresses its own emission without consuming the warning, and a later `"warn"`-mode request still emits it.

## Token refresh events

The automatic token-refresh lifecycle (both providers) reports through two dedicated callbacks on the provider's credential slot, independent of the request hooks:

| Callback              | Fires                                | Payload                                                                                          |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `onTokenRefresh`      | After every successful refresh grant | The effective token response (`MalTokenResponse` / `AniListTokenResponse`)                       |
| `onTokenRefreshError` | When a refresh grant fails           | The sanitized refresh error the awaiting caller catches (an `AniLinkError` with `status`/`code`) |

Both fire exactly once per grant. Concurrent `401`s share one in-flight grant and therefore one event, so many failing requests cannot multiply alerts. `onTokenRefreshError` receives the same sanitized error the failing call rejects with, so the observer and the caller's `catch` see the same error:

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

The lifecycle also reports a failed grant through `onHookError` under the `malTokenRefresh` (MAL) or `aniListTokenRefresh` (AniList) hook name with the `token-refresh` diagnostic kind (above). `onTokenRefreshError` is the typed, dedicated channel for consumers that want to alert on refresh failures without parsing hook diagnostics. Use it to distinguish "the access token expired and refresh recovered" (one `onTokenRefresh` event) from "refresh is broken and every request is failing" (one `onTokenRefreshError` event per failed grant, followed by the errors surfaced to each caller). The lifecycle also reports a throwing `onTokenRefreshError` callback through `onHookError` (falling back to a console warning); the callback never replaces the propagated refresh error.

## Transport state snapshot

The hooks report events as they happen; `getTransportState()` answers the state questions in between ("is the breaker open right now?", "how many budget retries are spent?", "when does the pacing deadline elapse?") without configuring any hook in advance:

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

The snapshot is read-only in both directions. The library deep-freezes every nested object and array, so mutating one throws in strict mode instead of silently succeeding. The copies never alias the live mutable state, so a consumer cannot change transport behavior through the snapshot. Building it never mutates the state it observes either. It creates no circuit entry for an unseen host, reports an elapsed retry-budget window as spent instead of rolling it forward, and leaves a stale pacing deadline in place. Polling `getTransportState()` on a schedule is therefore safe alongside live traffic.

Each call returns a fresh, point-in-time copy; fields reflect the values observed when the snapshot was taken. `circuit` and `paceDeadlines` list one entry per host the client has recorded state for; `retryBudget` is present only when the client has a recorded budget window; `responseCache` is present only when the provider's transport options enable a [`ResponseCache`](/response-cache) — it carries the cache's live entry count and its lifetime hit/miss/expiration/eviction counters (the same snapshot `ResponseCache#stats()` returns), so cache tuning is data-driven through the facade even when the cache was wired through a provider credentials slot and the instance was constructed for you. The `mal` key carries the same shape for the MyAnimeList client, and the two providers' states are always isolated from each other.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) covers the retry loop these hooks observe.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) scopes options to a single call.
- <Icon name="ArrowRight" :size="14" /> [Response cache](/response-cache) documents the `cacheHit` flag on `onResponse`.
