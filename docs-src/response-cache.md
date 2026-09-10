---
title: Response cache
layout: .vitepress/theme/DocsLayout.vue
---

# Response cache

AniLink ships an opt-in in-memory TTL response cache for read-heavy traversals. When enabled, `GET` responses are cached by `(method, url, serialized body)` for a configurable TTL window, so repeated identical reads skip the network round-trip entirely. Mutations (`POST`/`PUT`/`DELETE`) are never cached — no stale writes, ever.

## Creating a cache

```typescript
import { AniLink, ResponseCache } from "anilink-api-wrapper";

const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256 });

const aniLink = new AniLink("token", { responseCache: cache });
```

The cache is per-instance: one `ResponseCache` belongs to the `AniLink` client it is attached to and never leaks across clients. Pass the same `ResponseCache` instance to multiple clients only if you genuinely want them to share a cache.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `ttlMs` | `number` | `60_000` (1 minute) | Time-to-live for cached entries, in milliseconds |
| `maxEntries` | `number` | `128` | Maximum number of entries. Least-recently-used entries are evicted when the cap is reached |

```typescript
// Short TTL for near-fresh data, small footprint.
const shortCache = new ResponseCache({ ttlMs: 5_000, maxEntries: 32 });

// Long TTL for immutable reference data.
const longCache = new ResponseCache({ ttlMs: 3_600_000, maxEntries: 1_000 });
```

## What gets cached

Only `GET` responses are cached. AniList queries are `POST` requests and are **not** cached by default — the cache earns its keep on MAL `GET` reads and any custom `GET` requests you dispatch through the transport.

To cache AniList reads, use `custom()` with a `GET` method, or cache at the application layer.

Values are deep-copied on write and on read: the cache never shares a reference with the caller, so mutating an object after `set` (or after receiving it from `get`) cannot poison later hits. Cache keys hash the request body, so a credential-bearing `GET` body is never duplicated into the key in plaintext.

## Cache hits and observability

Cache hits are observable through the existing `onResponse` hook. When a response is served from cache, the hook fires with `cacheHit: true` and `durationMs: 0` — hard to miss in a dashboard:

```typescript
const aniLink = new AniLink("token", {
    responseCache: cache,
    onResponse: ({ url, durationMs, cacheHit }) => {
        if (cacheHit) {
            metrics.increment("cache.hit", { url });
        } else {
            metrics.increment("cache.miss", { url });
            metrics.observe("latency", durationMs, { url });
        }
    },
});
```

The `onRequestStart` hook also fires for cache hits so request-volume counters stay accurate.

## Manual cache management

```typescript
// Clear all cached entries (for example after a schema change).
cache.clear();
```

Expired entries are evicted lazily on read — a `get` call for an expired entry removes it and returns `undefined`. No background sweeper required.

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) — the `onResponse` hook that reports cache hits.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — scoping the cache to a single call.
