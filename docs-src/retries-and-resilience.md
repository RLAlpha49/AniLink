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

Backoff uses **full jitter**: each wait is a random value between `0` and the computed exponential cap. This spreads concurrent retries over time. Server-directed `Retry-After` waits are not jittered.

<Mermaid
    :code="`flowchart TD\n    A([Send request]) --> B{Response}\n    B -- success --> C([Return result]):::ok\n    B -- failure --> D{Retryable?\nstatus in retryOnStatus\nor network error}\n    D -- no --> E([Throw last error]):::err\n    D -- yes --> F{Attempts left?\nattempt <= maxRetries}\n    F -- no --> E\n    F -- yes --> G{Circuit open?}\n    G -- yes --> H([Throw CIRCUIT_OPEN_ERROR]):::err\n    G -- no --> I[Compute backoff\nfull jitter]\n    I --> J{AbortSignal\naborted?}\n    J -- yes --> K([Throw ABORTED_ERROR]):::err\n    J -- no --> L[Wait nextDelayMs]\n    L --> A\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

<Callout kind="caution">

The default policy **never retries** mutations. Set a retry policy to opt in. Retrying a non-idempotent write can duplicate its effect. For example, sending a like toggle twice removes the like.

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

When a request runs out of retries, the transport throws the last error. Catch it as shown in [Error handling](/error-handling).

## Retry budget

`maxRetries` limits retries for **one** request. During a sustained outage, a workload that issues thousands of requests can still send up to `maxRetries + 1` attempts per request. The optional `retryBudget` caps retries across all requests in a rolling window:

```typescript
const budgeted = new AniLink("token", {
    retryBudget: { maxRetriesPerWindow: 50, windowMs: 60_000 },
});
```

The retry policy limits retries per request. The circuit breaker fast-fails after consecutive failures. The budget caps retries across requests and handles chronic intermittent failures that may not trip the breaker. When a window's budget runs out, failures surface without retries until the window ends. Retries then resume. Server-directed waits, including `Retry-After` and rate-limit reset metadata from `429` responses, also surface immediately if they would extend past the current window. A window's retry allowance cannot stretch across minutes of server-directed waits.

The budget uses **fixed windows, not sliding windows**. A window starts with the first failure after the previous window expires and resets when `windowMs` passes. Failures near adjacent window boundaries can spend up to `2 × maxRetriesPerWindow` retries within one `windowMs` period. Set `maxRetriesPerWindow` for that worst-case burst if you need a strict bound.

Like the circuit breaker, the retry budget is shared by all operations in a provider client and keyed by upstream host. The cap applies across that client's requests, not per operation or call. The budget lives in memory and resets on restart. See [Observability](/observability) for the `stateOwner` diagnostic, which warns when per-request options split cross-request state across different keys.

## Rate-limit pacing

Pacing is on by default. After each successful response, the transport reads the `x-ratelimit-*` headers (AniList) or `X-RateLimit-*` headers (MAL). If the remaining quota falls below `rateLimitFloor` (default `1`), the transport records the reset deadline and delays the next request instead of waiting for a `429`. The response that triggers pacing still returns immediately. With pacing off, a request may receive a `429` and then wait before retrying. `onPace` reports each completed wait so you can distinguish it from a stalled request. An aborted wait does not emit a full-delay event. See [Observability](/observability).

```typescript
// Default behavior: pacing is active with rateLimitFloor: 1.
const paced = new AniLink("token", {
    rateLimitFloor: 5, // start waiting while 5 requests remain
});

// Opt out: discover the limit reactively via 429s.
const unpaced = new AniLink("token", { paceWithRateLimit: false });
```

`rateLimitFloor` must be a finite, non-negative integer. A value of `0` disables floor-based pacing. The transport still honors `Retry-After` on `429` responses. A defined but invalid value throws instead of being silently coerced.

A terminal `429` occurs when retries are exhausted, retries are disabled, or no further attempt is scheduled. The transport records the reset deadline from that response's `x-ratelimit-*` metadata. The next request to that host waits instead of immediately receiving another `429`. Each pacing wait is capped at five minutes. If the reported reset is farther away, the next request waits five minutes, then the transport records another deadline if it still receives a `429`.

<Callout kind="warning">

**Bulk traversals.** A single response below the quota floor pauses every later request to that host until the window resets. Each wait is capped at five minutes. This serializes work in bulk jobs, including `paginate` and `paginateChunks` with default concurrency `3`. Prefer disabling pacing and setting an explicit retry policy for bulk jobs. Keep pacing on for latency-sensitive, user-facing calls. The response that triggered the wait still returns immediately. Only later requests wait.

</Callout>

## Keep-alive agents and teardown

The transport reuses shared keep-alive agents across requests. Calls that customize `maxSockets` or `maxFreeSockets` use dedicated agents. Calls with identical settings share a cached pair. The cache holds at most eight pairs and evicts the least recently used pair.

An evicted pair is **parked, not destroyed**. Its idle sockets stay open until the server closes them or you call `destroyCachedAgents()`. The transport does not destroy an evicted pair because it may still carry in-flight requests, and closing those sockets could fail the requests. If a long-lived process cycles through many socket configurations, release the retained sockets on shutdown:

```typescript
import { destroyCachedAgents } from "anilink-api-wrapper";

// After every in-flight request has settled (for example in a shutdown hook).
destroyCachedAgents();
```

Calling it while requests using those agents are still in flight can fail them, so only tear down after the last request has settled.

## Circuit breaker

The circuit breaker is off by default. When disabled, the transport does no cross-request failure accounting. With `circuitBreaker: { threshold, cooldownMs }`, the transport fast-fails after `threshold` consecutive **availability failures**. It throws a `CIRCUIT_OPEN_ERROR` network error until `cooldownMs` has passed since the last failure. Then the breaker lets the next request through as a probe.

Only availability failures count toward the streak: network errors, timeouts, `429`s, and `5xx` responses. Caller-side errors (`4xx`) and caller-initiated aborts do not trip the breaker. A `4xx` response proves the upstream answered, so it **resets** the streak as a success would. An abort during an in-flight request also resets the streak. An abort during a pacing wait leaves a closed breaker's existing streak unchanged, but closes a reserved half-open probe. An abort during retry backoff leaves the failure state recorded for the previous attempt unchanged. A consumer-side bug that produces `404`s between occasional `500`s cannot make the breaker fast-fail healthy traffic based on a stale streak. Status-less GraphQL envelope errors neither trip nor reset the breaker because they provide no upstream-health signal (see _GraphQL envelope failures_ below).

<Callout kind="tip">

The circuit breaker is the only mechanism that fast-fails during a sustained upstream outage. Enable it in production to limit retry traffic while the provider is down.

</Callout>

```typescript
const guarded = new AniLink("token", {
    circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
});
```

When unset, the transport does no failure accounting across requests.

### GraphQL envelope failures

AniList can report failures in an HTTP `200` response with a GraphQL `errors` array. The breaker treats GraphQL errors with a `429` or `5xx` status as availability failures, just like HTTP errors. A sustained run can trip the breaker.

GraphQL validation errors with no upstream error status are streak-neutral. They do not trip or reset the breaker. An error without a status could hide a server fault, so it must not erase earlier availability failures. But without an availability status, it must not trip the breaker for a consumer-side query bug.

[`allowPartialData`](/error-handling#partial-data) uses the same classification for partial-success envelopes. If error entries carry an availability-class status, the breaker counts the attempt and advances the streak, just as strict mode does when it throws. Persistent upstream failures can therefore trip the breaker even when partial data is allowed. If entries carry a caller-side status, the breaker resets the streak as it would after a success. Entries without an upstream status leave the streak unchanged, as they do in strict mode.

### Probe outcomes

After the cooldown, the breaker lets one request through as a probe. A successful probe closes the breaker. An availability failure reopens it for another cooldown. A caller-side error, a status-less GraphQL envelope error, or a caller abort **closes** the breaker instead of leaving it half-open. None of these outcomes counts as an availability failure.

Each failed availability probe doubles the next cooldown, up to eight times the configured `cooldownMs`. A successful probe resets the multiplier. The widening schedule gives a recovering upstream more time between probes. Without it, an upstream that needs slightly longer than `cooldownMs` to recover can keep failing one probe per cooldown. The breaker closes as soon as a probe succeeds.

### Breaker lifecycle events

The breaker emits `onCircuitOpen` and `onCircuitClose` hooks when its state changes. Use them to track trip frequency, time open, and recovery without parsing `CIRCUIT_OPEN_ERROR` codes. See [Observability](/observability) for the event payloads.

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
