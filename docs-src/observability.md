---
title: Observability
layout: .vitepress/theme/DocsLayout.vue
---

# Observability

Four hooks report request lifecycle events. They are configured per provider slot and never leak between providers.

## Hook contracts

| Hook | Fires | Payload |
| --- | --- | --- |
| `onRequestStart` | Immediately before each attempt is sent | `{ url, method, attempt }` |
| `onResponse` | After each attempt completes, success or failure | `{ url, method, attempt, durationMs }` |
| `onError` | When an attempt fails, before each retry wait, and once more when retries are exhausted | `(error: AniLinkError, context)` with `context = { url, method, attempt, code, status?, nextDelayMs? }` |
| `onRetry` | When a failed attempt is going to be retried | Same shape as `onError` with `nextDelayMs` set |

`attempt` is 1-based. `durationMs` is the elapsed wall-clock time of the attempt, making `onResponse` the natural point for latency metrics.

## Firing order

<Mermaid
    code="flowchart TD
    A[onRequestStart attempt 1] --> B{attempt result}
    B -- success --> C[onResponse]
    B -- failure --> D[onError]
    D --> E{retrying}
    E -- yes --> F[onRetry then wait] --> G[onRequestStart attempt 2]
    G --> B
    E -- no / exhausted --> H[onError final]"
/>

`onError` fires for every failed attempt. `onRetry` fires only when another attempt will follow.

## Usage

```typescript
import { AniLink } from "anilink-api-wrapper";

const aniLink = new AniLink("token", {
    onRequestStart: ({ url, attempt }) => {
        console.log("start", attempt, url);
    },
    onResponse: ({ url, durationMs }) => {
        console.log(url, `${durationMs}ms`);
    },
    onError: (error, { attempt, code }) => {
        console.error("attempt", attempt, "failed", code, error.message);
    },
    onRetry: (_error, { attempt, nextDelayMs }) => {
        console.log("retrying after", nextDelayMs, "ms; next attempt", attempt);
    },
});
```

## Hook isolation

Hooks belong to the provider slot where they are declared. A hook registered for AniList never observes MAL traffic and vice versa:

```typescript
const aniLink = new AniLink({
    anilist: { authToken: "t", onResponse: ({ durationMs }) => metrics.record(durationMs) },
    mal: { accessToken: "m" }, // no hooks — MAL traffic is unobserved
});
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Retries & resilience](/retries-and-resilience) — the retry loop these hooks observe.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — scoping options to a single call.
