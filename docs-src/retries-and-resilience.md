---
title: Retries & resilience
description: "The three shared-transport resilience mechanisms are transient-failure retries, rate-limit pacing, and the circuit breaker, with their per-provider defaults."
layout: .vitepress/theme/DocsLayout.vue
---

# Retries & resilience

AniLink's shared transport layer has three resilience mechanisms. You configure all of them per provider slot, and all behave identically on AniList and MAL.

## Default retry policy

The transport retries transient failures with no code from you. The default policy:

| Knob                  | Default                     | Meaning                                          |
| --------------------- | --------------------------- | ------------------------------------------------ |
| `maxRetries`          | `3`                         | Retries after the initial attempt                |
| `baseDelayMs`         | `250`                       | First backoff delay                              |
| `maxDelayMs`          | `5000`                      | Backoff cap                                      |
| `retryOnStatus`       | `[429, 500, 502, 503, 504]` | HTTP statuses that trigger a retry               |
| `retryOnNetworkError` | `true`                      | Network and timeout failures retry               |
| `jitter`              | `true`                      | Randomize each wait within `[0, computed delay]` |

Backoff uses **full jitter**: every wait is a random value between `0` and the computed exponential cap, so concurrent clients never synchronize their retries. Server-dictated `Retry-After` waits are never jittered.

<Mermaid
    :code="`flowchart TD\n    A([Send request]) --> B{Response}\n    B -- success --> C([Return result]):::ok\n    B -- failure --> D{Retryable?\nstatus in retryOnStatus\nor network error}\n    D -- no --> E([Throw last error]):::err\n    D -- yes --> F{Attempts left?\nattempt <= maxRetries}\n    F -- no --> E\n    F -- yes --> G{Circuit open?}\n    G -- yes --> H([Throw CIRCUIT_OPEN_ERROR]):::err\n    G -- no --> I[Compute backoff\nfull jitter]\n    I --> J{AbortSignal\naborted?}\n    J -- yes --> K([Throw ABORTED_ERROR]):::err\n    J -- no --> L[Wait nextDelayMs]\n    L --> A\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

<Callout kind="caution">

The default policy **never retries** mutations unless you opt in. Retrying a non-idempotent write can duplicate its effects: a like toggled twice is a like removed.

</Callout>

## Tuning or opting out

```typescript
import { AniLink } from "anilink-api-wrapper";

// Opt out entirely: every request is sent exactly once.
const noRetry = new AniLink("token", { retry: false });

// Tune individual knobs on top of the defaults.
const tuned = new AniLink("token", {
    retry: {
        maxRetries: 5,
        baseDelayMs: 100,
        retryOnStatus: [429, 503],
        jitter: false, // deterministic delays
    },
});
```

When a request runs out of retries, the transport throws the last error; catch it as shown in [Error handling](/error-handling).

## Retry budget

The per-call `maxRetries` bounds retries for **one** request. A workload issuing thousands of requests during a sustained outage would still multiply API call volume by up to `maxRetries + 1` indefinitely, because every failing call spends its own full retry allotment. The opt-in `retryBudget` bounds the **total** retry spend per rolling window across the client's requests:

```typescript
const budgeted = new AniLink("token", {
    retryBudget: { maxRetriesPerWindow: 50, windowMs: 60_000 },
});
```

The budget complements the other two mechanisms: the retry policy bounds one request's retries, the circuit breaker fast-fails after consecutive failures, and the budget caps the aggregate retry spend. That cap handles chronic intermittent failures even when the breaker never trips. When the budget for the current window is exhausted, failures surface without retries until the window elapses; the window then resets and retries resume. Server-dictated delays, such as a `Retry-After` header or the rate-limit reset metadata carried by 429 responses, also surface immediately if they would still be in progress when the window ends. One window's retry spend therefore cannot be stretched across many minutes of wall-clock waits.

The window is **fixed, not sliding**: it starts at the first failure after the previous window elapsed and resets completely when `windowMs` passes. A burst of failures at adjacent window edges can therefore spend up to `2 × maxRetriesPerWindow` retries within one `windowMs` of wall-clock time. Size `maxRetriesPerWindow` for that worst-case edge burst if you need a strict bound.

Like the breaker, the budget shares its state across every operation of one client (per provider client, keyed per upstream host), so the cap applies client-wide, not per operation and not per call. Budget state is in-memory only and resets on restart; see [Observability](/observability) for the `stateOwner` diagnostic that fires when cross-request state would be keyed by a per-request options object.

## Rate-limit pacing

Pacing is on by default. The transport reads the `x-ratelimit-*` headers (AniList) or `X-RateLimit-*` headers (MAL) of every successful response. When the reported remaining quota drops below `rateLimitFloor` (default `1`), the next attempt waits for the window to reset instead of discovering the limit via a `429`. That discovery is expensive: with pacing off, every `429` costs a wasted request plus a retry wait. Pacing avoids both by tracking the window from the response headers. The transport never holds the response that tripped the floor. Its data returns immediately, and the recorded deadline delays the next request instead. The optional `onPace` hook fires after each pacing wait completes with the wait length, so you never mistake an intentional rate-limit wait for a hung request. An aborted wait never emits a full-delay event; see [Observability](/observability).

```typescript
// Default behavior: pacing is active with rateLimitFloor: 1.
const paced = new AniLink("token", {
    rateLimitFloor: 5, // start waiting while 5 requests remain
});

// Opt out: discover the limit reactively via 429s.
const unpaced = new AniLink("token", { paceWithRateLimit: false });
```

`rateLimitFloor` must be a finite, non-negative integer; `0` disables floor-based pacing (the transport still honors `Retry-After` on `429` responses), and a defined-but-invalid value throws instead of being silently coerced.

A terminal `429` — one that exhausted its retries, ran with retries disabled, or surfaced for any other reason without another attempt scheduled — records the same reset deadline from its own `x-ratelimit-*` metadata, so the next request to that host waits for the window it already proved exhausted instead of dispatching immediately, eating another `429`, and repeating until the window resets on its own. The recorded deadline is clamped to the 5-minute maximum like every pacing wait: a `429` reporting a far-future reset paces in 5-minute increments, each post-clamp dispatch eating at most one more `429` before re-recording, until the window actually resets.

<Callout kind="warning">

**Bulk traversals.** A single low-quota response pauses _every_ subsequent request to that host until the window resets, up to 5 minutes per wait. For bulk jobs (`paginate`/`paginateChunks` with default concurrency 3), this serializes throughput. Prefer `paceWithRateLimit: false` plus an explicit retry policy for bulk work, and keep pacing on for latency-sensitive user-facing calls. The tripping response itself still returns immediately; only later requests wait.

</Callout>

## Keep-alive agents and teardown

Every request reuses shared keep-alive agents, so repeated calls use warm sockets. A call that customizes `maxSockets`/`maxFreeSockets` uses dedicated agents; identical configurations share one cached agent pair (bounded at 8 pairs, least-recently-used eviction).

A pair evicted from that cache is **parked, not destroyed**. Its idle sockets linger until the server closes them or you tear down explicitly, because destroying an agent that may still carry in-flight requests would close live sockets. For long-lived processes that cycle through many distinct socket configurations, release the retained sockets on shutdown:

```typescript
import { destroyCachedAgents } from "anilink-api-wrapper";

// After every in-flight request has settled (for example in a shutdown hook).
destroyCachedAgents();
```

Calling it while requests using those agents are still in flight can fail them, so only tear down after the last request has settled.

## Circuit breaker

The circuit breaker is off by default, to keep the zero-accounting fast path free of cross-request state. With `circuitBreaker: { threshold, cooldownMs }`, after `threshold` consecutive **availability failures** further requests fail fast with a `CIRCUIT_OPEN_ERROR` network error until `cooldownMs` has passed since the last failure. Then the breaker lets the next request through as a probe.

Only availability failures count toward the streak: network errors, timeouts, `429`s, and `5xx` responses. Caller-side errors (`4xx`) and caller-initiated aborts say nothing about upstream health, so they never trip the breaker. And because such a failure proves the upstream answered, it **resets** the streak, exactly as a success would. A consumer-side bug producing 404s between scattered 500s cannot fast-fail healthy traffic on a stale streak. Status-less GraphQL envelope errors are the one exception: they reset nothing, because their entries carry no upstream-health signal in either direction (see _GraphQL envelope failures_ below).

<Callout kind="tip">

For production workloads, switch the circuit breaker on. It is the only mechanism that fast-fails a sustained upstream outage, so runaway retry volume and cost stop while the provider is down.

</Callout>

```typescript
const guarded = new AniLink("token", {
    circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
});
```

When unset, the transport does no failure accounting across requests.

### GraphQL envelope failures

AniList often reports failures as HTTP 200 with a GraphQL `errors` array rather than as an HTTP error status. The breaker counts GraphQL-level 429 and 5xx envelopes as availability failures: a sustained run trips it just like HTTP-level failures, so the breaker also covers the common AniList overload signature. GraphQL validation errors (an envelope 200 with no upstream error status) are streak-neutral: they neither trip the breaker nor reset the streak. The status-less entries may hide a server fault that omitted its status, so the error must not erase the streak other failure classes accumulated — but they carry no availability-class status either, so they must not trip the breaker on what may be a consumer-side query bug.

The same classification applies to partial-success envelopes resolved by [`allowPartialData`](/error-handling#partial-data). When the envelope's error entries carry an availability-class status, the breaker counts the attempt exactly as the strict mode's throw would, so the failure streak advances instead of resetting. A persistently degraded upstream therefore trips the breaker under the opt-in too. Partial envelopes whose error entries carry a caller-side status reset the streak like a success; partial envelopes whose entries carry no upstream status are streak-neutral, exactly like the strict mode's throw of the same error.

### Probe outcomes

After the cooldown elapses, the breaker lets one request through as a probe. A successful probe closes the breaker. A probe that fails with an availability failure re-opens it for another cooldown. A probe that fails with a caller-side error or a status-less GraphQL envelope error (or that the caller aborts) **closes** the breaker, because the upstream answered and is therefore reachable, instead of leaving the breaker stuck in the half-open state.

Each consecutive failed probe doubles the next cooldown, capped at eight times the configured `cooldownMs`, and a successful probe resets the scale. Without this backoff, an upstream that recovers just slower than `cooldownMs`, or a probe that happens to hit a still-restarting instance behind a load balancer, locks the breaker into a cycle of opening, probing, and opening again. In that cycle, exactly one request per cooldown ever reaches the upstream. With it, the breaker probes a recovering upstream on a widening schedule, and the upstream starts serving traffic after a bounded number of cooldowns instead of requiring a clean single-probe success.

### Breaker lifecycle events

The breaker emits `onCircuitOpen` and `onCircuitClose` hooks at state transitions so dashboards can plot trip frequency, open duration, and recovery without scraping `CIRCUIT_OPEN_ERROR` codes. See [Observability](/observability) for the event payloads.

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

### Bypassing the pacing deadline

When `paceWithRateLimit` is enabled, a successful response records a rate-limit reset deadline that subsequent requests to the same host wait for. Pass `ignorePaceDeadline: true` per request to bypass that shared deadline for an urgent call, for example a user-facing lookup during a rate-limited window:

```typescript
const aniLink = new AniLink("token", { paceWithRateLimit: true });

// This request bypasses the shared pacing deadline.
const media = await aniLink.anilist.query.media(
    { id: 1, type: "ANIME" },
    { ignorePaceDeadline: true }
);
```

## Provider scoping

Configure each mechanism per provider slot:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", paceWithRateLimit: true },
    mal: { accessToken: "m", retry: false },
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Cancellation & timeouts](/cancellation-and-timeouts) covers aborting requests, including during retry waits.
- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) covers hooking retries, failures, and circuit breaker events.
- <Icon name="ArrowRight" :size="14" /> [Response cache](/response-cache) covers skipping network round-trips for repeated reads.
