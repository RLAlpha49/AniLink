---
title: Retries & resilience
layout: .vitepress/theme/DocsLayout.vue
---

# Retries & resilience

AniLink's shared transport layer carries three resilience mechanisms. All are configured per provider slot, and all behave identically on AniList and MAL.

## Default retry policy

Transient failures retry themselves — no code from you. The default policy:

| Knob | Default | Meaning |
| --- | --- | --- |
| `maxRetries` | `3` | Retries after the initial attempt |
| `baseDelayMs` | `250` | First backoff delay |
| `maxDelayMs` | `5000` | Backoff cap |
| `retryOnStatus` | `[429, 500, 502, 503, 504]` | HTTP statuses that trigger a retry |
| `retryOnNetworkError` | `true` | Network and timeout failures retry |
| `jitter` | `true` | Randomize each wait within `[0, computed delay]` |

Backoff uses **full jitter**: every wait is a random value between `0` and the computed exponential cap, so a herd of concurrent clients never synchronizes its retries into a stampede. Server-dictated `Retry-After` waits are never jittered.

<Mermaid
    :code="`flowchart TD\n    A([Send request]) --> B{Response}\n    B -- success --> C([Return result]):::ok\n    B -- failure --> D{Retryable?\nstatus in retryOnStatus\nor network error}\n    D -- no --> E([Throw last error]):::err\n    D -- yes --> F{Attempts left?\nattempt <= maxRetries}\n    F -- no --> E\n    F -- yes --> G{Circuit open?}\n    G -- yes --> H([Throw CIRCUIT_OPEN_ERROR]):::err\n    G -- no --> I[Compute backoff\nfull jitter]\n    I --> J{AbortSignal\naborted?}\n    J -- yes --> K([Throw ABORTED_ERROR]):::err\n    J -- no --> L[Wait nextDelayMs]\n    L --> A\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

<Callout kind="caution">

Mutations are **never retried** by the default policy unless you opt in. Retrying a non-idempotent write can duplicate its effects — a like toggled twice is a like removed.

</Callout>

## Tuning or opting out

```typescript
import { AniLink } from "anilink-api-wrapper";

// Opt out entirely — every request is sent exactly once.
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

When a request runs out of retries, the last error is thrown — catch it as shown in [Error handling](/error-handling).

## Rate-limit pacing

On by default. The transport reads the `x-ratelimit-*` headers (AniList) or `X-RateLimit-*` headers (MAL) of every successful response. When the reported remaining quota drops below `rateLimitFloor` (default `1`), the next attempt waits for the window to reset instead of discovering the limit the hard way, via a `429`. And that hard way is expensive: with pacing off, every `429` costs a wasted request plus a retry wait. Pacing avoids both by tracking the window from the response headers. The optional `onPace` hook fires just before each pacing wait with the wait length, so an intentional rate-limit wait never gets mistaken for a hung request — see [Observability](/observability).

```typescript
// Default behavior — pacing is active with rateLimitFloor: 1.
const paced = new AniLink("token", {
    rateLimitFloor: 5, // start waiting while 5 requests remain
});

// Opt out — discover the limit reactively via 429s.
const unpaced = new AniLink("token", { paceWithRateLimit: false });
```

## Circuit breaker

Off by default, to keep the zero-accounting fast path free of cross-request state. With `circuitBreaker: { threshold, cooldownMs }`, after `threshold` consecutive failed attempts further requests fail fast with a `CIRCUIT_OPEN_ERROR` network error until `cooldownMs` has passed since the last failure. Then the next request is let through as a probe.

<Callout kind="tip">

For production workloads, switch the circuit breaker on: it is the only mechanism that fast-fails a sustained upstream outage, stopping runaway retry volume (and cost) while the provider is down.

</Callout>

```typescript
const guarded = new AniLink("token", {
    circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
});
```

When unset, no failure accounting happens across requests.

### GraphQL envelope failures

AniList has a habit of reporting failures as HTTP 200 with a GraphQL `errors` array rather than as an HTTP error status. The breaker counts these as failures: a sustained run of GraphQL-level 429 or 5xx envelopes trips it just like HTTP-level failures, so the common AniList overload signature is covered.

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

When `paceWithRateLimit` is enabled, a successful response records a rate-limit reset deadline that subsequent requests to the same host wait for. Pass `ignorePaceDeadline: true` on a per-request basis to bypass that shared deadline for an urgent call — a user-facing lookup during a rate-limited window, say:

```typescript
const aniLink = new AniLink("token", { paceWithRateLimit: true });

// This request bypasses the shared pacing deadline.
const media = await aniLink.anilist.query.media(
    { id: 1, type: "ANIME" },
    { ignorePaceDeadline: true }
);
```

## Provider scoping

Each mechanism is configured per provider slot:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", paceWithRateLimit: true },
    mal: { accessToken: "m", retry: false },
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Cancellation & timeouts](/cancellation-and-timeouts) — aborting requests, including during retry waits.
- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) — hooking retries, failures, and circuit breaker events.
- <Icon name="ArrowRight" :size="14" /> [Response cache](/response-cache) — skipping network round-trips for repeated reads.
