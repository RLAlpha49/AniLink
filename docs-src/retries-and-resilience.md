---
title: Retries & resilience
layout: .vitepress/theme/DocsLayout.vue
---

# Retries & resilience

AniLink's shared transport layer provides three resilience mechanisms. All are configured per provider slot and behave identically on AniList and MAL.

## Default retry policy

Retries for transient failures are automatic. The default policy:

| Knob | Default | Meaning |
| --- | --- | --- |
| `maxRetries` | `3` | Retries after the initial attempt |
| `baseDelayMs` | `250` | First backoff delay |
| `maxDelayMs` | `5000` | Backoff cap |
| `retryOnStatus` | `[429, 500, 502, 503, 504]` | HTTP statuses that trigger a retry |
| `retryOnNetworkError` | `true` | Network and timeout failures retry |
| `jitter` | `true` | Randomize each wait within `[0, computed delay]` |

Backoff uses **full jitter**: each wait is a random value between `0` and the computed exponential cap, so concurrent clients do not synchronize retries. Server-dictated `Retry-After` waits are never jittered.

<Mermaid
    :code="`flowchart TD\n    A([Send request]) --> B{Response}\n    B -- success --> C([Return result]):::ok\n    B -- failure --> D{Retryable?\nstatus in retryOnStatus\nor network error}\n    D -- no --> E([Throw last error]):::err\n    D -- yes --> F{Attempts left?\nattempt <= maxRetries}\n    F -- no --> E\n    F -- yes --> G{Circuit open?}\n    G -- yes --> H([Throw CIRCUIT_OPEN_ERROR]):::err\n    G -- no --> I[Compute backoff\nfull jitter]\n    I --> J{AbortSignal\naborted?}\n    J -- yes --> K([Throw ABORTED_ERROR]):::err\n    J -- no --> L[Wait nextDelayMs]\n    L --> A\n\n    classDef ok fill:#d5e8d4,stroke:#82b366,color:#2d5016;\n    classDef err fill:#f8cecc,stroke:#b85450,color:#5c1a1a;`"
/>

<Callout kind="caution">

Mutations are **never retried** by the default policy unless you opt in. Retrying a non-idempotent write can duplicate effects.

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

When a request exhausts its retries, the last error is thrown — catch it as shown in [Error handling](/error-handling).

## Rate-limit pacing

Off by default. With `paceWithRateLimit: true`, the transport reads the `x-ratelimit-*` headers (AniList) or `X-RateLimit-*` headers (MAL) of every successful response. When the reported remaining quota drops below `rateLimitFloor` (default `1`), the next attempt waits until the window resets instead of discovering the limit via a `429`.

```typescript
const paced = new AniLink("token", {
    paceWithRateLimit: true,
    rateLimitFloor: 5, // start waiting while 5 requests remain
});
```

## Circuit breaker

Off by default. With `circuitBreaker: { threshold, cooldownMs }`, after `threshold` consecutive failed attempts further requests fail fast with a `CIRCUIT_OPEN_ERROR` network error until `cooldownMs` has elapsed since the last failure. After that, the next request is allowed through as a probe.

```typescript
const guarded = new AniLink("token", {
    circuitBreaker: { threshold: 5, cooldownMs: 30_000 },
});
```

When unset, no failure accounting happens across requests.

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
- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) — hooking retries and failures.
