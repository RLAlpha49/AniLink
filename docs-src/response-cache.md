---
title: Response cache
description: "The opt-in in-memory TTL response cache keyed by method, url, and body. Repeated identical reads, whether GETs or GraphQL queries, skip the network, and the cache never stores mutations."
layout: .vitepress/theme/DocsLayout.vue
---

# Response cache

AniLink ships an opt-in in-memory TTL response cache for read-heavy traversals. When enabled, the cache keys cacheable reads by `(method, url, serialized body)` for a configurable TTL window, so repeated identical reads skip the network round-trip. Cacheable reads are `GET` requests and GraphQL query documents, including AniList queries, which the transport dispatches as `POST`. The cache never stores mutations (GraphQL `mutation` documents and REST `POST`/`PUT`/`DELETE` calls), so it never serves stale writes.

## Creating a cache

```typescript
import { AniLink, ResponseCache } from "anilink-api-wrapper";

const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256 });

const aniLink = new AniLink("token", { responseCache: cache });
```

The cache is per-instance. One `ResponseCache` belongs to the `AniLink` client it is attached to and never leaks across clients. Pass the same `ResponseCache` instance to multiple clients only if you want them to share a cache.

## Configuration

| Option        | Type      | Default             | Description                                                                                                                                                                     |
| ------------- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ttlMs`       | `number`  | `60_000` (1 minute) | Time-to-live for cached entries, in milliseconds                                                                                                                                |
| `maxEntries`  | `number`  | `128`               | Maximum number of entries. When full, the cache evicts the least-recently-used entries                                                                                          |
| `cloneOnRead` | `boolean` | `true`              | Whether `get()` deep-clones the cached entry before returning it. Set to `false` only when you treat cached responses as immutable; see [Read-side cloning](#read-side-cloning) |

```typescript
// Short TTL for near-fresh data, small footprint.
const shortCache = new ResponseCache({ ttlMs: 5_000, maxEntries: 32 });

// Long TTL for immutable reference data.
const longCache = new ResponseCache({ ttlMs: 3_600_000, maxEntries: 1_000 });
```

## What gets cached

The cache stores two kinds of reads:

- `GET` responses: MAL reads and any custom `GET` requests you dispatch through the transport.
- GraphQL query documents dispatched as `POST`: every AniList read. The GraphQL transport always POSTs, because that is how the AniList HTTP endpoint works. The cache recognizes a `{ query, variables }` body whose document declares a `query` operation, including anonymous shorthand selections like `{ Viewer { id } }`, and caches it like a read. The document and variables are part of the cache key, so two queries selecting different fields or passing different variables get separate entries.

The cache never stores mutations. It excludes a GraphQL document opening with `mutation` and REST `POST`/`PUT`/`DELETE` calls. There is no `GET` path through the GraphQL layer, because `custom()` POSTs like every other GraphQL operation. Query-document caching is the way to cache AniList reads.

The cache deep-copies values on write and, by default, on read. It never shares a reference with the caller, so mutating an object after `set`, or after receiving it from `get`, cannot poison later hits. Cache keys hash the request body, so a credential-bearing `GET` body never appears in the key in plaintext. The cache canonicalizes the URL's query string by sorting its parameters before keying, so the same resource requested with a different parameter order (`?a=1&b=2` vs `?b=2&a=1`) hits the same entry.

### Read-side cloning

Every cache hit triggers a full deep clone of the cached payload, so a caller that mutates the returned object cannot poison later hits. For large cached bodies, such as a 50-item MAL page or a big fields-narrowed response, that clone can consume a meaningful fraction of the network round-trip the cache saves, and it repeats on every hit.

Consumers that treat cached responses as immutable can disable the read-side clone with `cloneOnRead: false`:

```typescript
// Read-heavy workload with large payloads, where you treat responses as immutable.
const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256, cloneOnRead: false });
```

With `cloneOnRead: false`, `get()` returns the cached object itself instead of a copy, so every hit skips the clone. Mutating the returned value mutates the cached entry, so every later hit returns the mutated entry. Disable it only when your code and every consumer of the returned value treat responses as immutable. The write-side copy is unaffected either way. The cache never aliases the object you passed to `set()`, so mutating the original after storing it cannot poison the cache.

## Cache hits and observability

You can observe cache hits and misses through the existing `onResponse` hook. When the transport serves a response from cache, the hook fires with `cacheHit: true` and `durationMs: 0`. When a cacheable read goes to the network after a cache miss, the hook fires with `cacheHit: false`, which is easy to spot in a dashboard:

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

Responses unrelated to the cache carry no `cacheHit` at all: mutations, reads of cache-less clients, and partial-success envelopes resolved by `allowPartialData`, whose degraded data is never cached. So `cacheHit === false` means precisely "cacheable read that missed". The `onRequestStart` hook also fires for cache hits, so request-volume counters stay accurate.

## Manual cache management

```typescript
// Clear all cached entries (for example after a schema change).
cache.clear();
```

The cache evicts expired entries lazily on read and opportunistically on write, so never-re-read entries do not linger past their TTL. A `get` call for an expired entry removes it and returns `undefined`. No background sweeper is required.

### Cache statistics

`stats()` returns a frozen snapshot of the cache's current size and its lifetime counters, so you can tune `ttlMs` and `maxEntries` from the counters instead of guessing:

```typescript
const { entries, hits, misses, expirations, evictions } = cache.stats();

// If the cache is full and keeps evicting, raise maxEntries.
if (entries === 256 && evictions > hits) {
    /* the cache is too small for the workload */
}

// If entries expire before they are read again, raise ttlMs.
if (expirations > hits) {
    /* the TTL is too short for the read pattern */
}

const hitRate = hits / (hits + misses + expirations);
```

The counters are cumulative for the cache instance's lifetime. `delete`, `deleteMatching`, `deleteAllForUrl`, and `clear` drop entries but never reset or increment the counters, while `entries` reflects the current live entry count. Every `get()` call partitions into exactly one of `hits`, `misses`, or `expirations`: a read that finds a live entry counts as a hit, a read of an absent key counts as a miss, and a read that finds an expired entry counts as an expiration. That read also evicts the entry. `evictions` counts live entries dropped by `set()` under `maxEntries` pressure. The returned object is frozen, so a caller cannot mutate the cache's internal state through it.

### Read-after-write freshness

A successful mutation sent through the same client automatically invalidates the cached reads it may have changed, so a read-after-write sequence refetches instead of serving the pre-mutation entry for the rest of the TTL:

```typescript
const aniLink = new AniLink({
    mal: { accessToken: "mal-token", responseCache: cache },
});

// Read (cached).
await aniLink.mal.anime.get({ id: 21 });

// Mutate: the PATCH to /anime/21/my_list_status drops the cached
// read of /anime/21 automatically.
await aniLink.mal.anime.updateMyListStatus({ anime_id: 21, status: "completed" });

// The next `get` refetches the updated entry.
await aniLink.mal.anime.get({ id: 21 });
```

REST writes and GraphQL mutations invalidate differently:

- **REST writes** (MAL and any `protocol: "rest"` call) drop the cached `GET` entries of the mutated resource. The cache derives the invalidation prefix from the mutated URL. It strips the query string and removes a trailing action segment (`my_list_status`), so a write to `/anime/21/my_list_status` invalidates the cached reads of `/anime/21`. The match is boundary-aware: `/anime/21` never invalidates `/anime/212`. The match spans every auth namespace, because a mutation by one identity changes the resource for every identity that reads it. Only writes whose final path segment is a numeric resource id invalidate anything. A collection write (`POST /anime`) or an unidentifiable path invalidates nothing rather than evicting unrelated entries. One concrete consequence: a whole-list write such as `PUT /users/@me/animelist` (a bulk update dispatched through a custom transport call) has no numeric resource id, so it invalidates nothing. Cached reads of the affected entries stay stale for up to `ttlMs`. Keep `ttlMs` short, or call `deleteMatching`/`clear` manually after such writes.
- **GraphQL mutations** (AniList writes) drop the cached GraphQL queries at the endpoint whose root field the mutation can change. The cache keys every operation of one provider at the same URL, and a mutation can change what many different query documents return. A `SaveMediaListEntry`, for example, changes what `MediaList`, `MediaListCollection`, `Page`, `Media` (its `mediaListEntry` embed), `User`/`Viewer` (their `mediaListCollection` embed), and `Activity` (the `ListActivity` AniList generates from the write) queries can report, so those cached entries are dropped while an unrelated `Staff` query stays warm. A mutation the cache cannot map to affected root fields — including any future upstream mutation, or a document whose root field cannot be confidently attributed — falls back to dropping every cached GraphQL query at the endpoint, so an unmapped mutation can never under-invalidate. Cached queries whose own document cannot be confidently attributed to a single root field (a fragment-spread root, a multi-field selection) are dropped by every scoped invalidation too, fail-closed: such a document may select data the affected-field match cannot see. The next reads refetch fresh data instead of serving pre-mutation entries.

Failed mutations never drop cached entries. When an invalidation affects an in-flight read, the transport detects the interleaving and drops the stale write-back instead of caching it, so the race cannot reintroduce pre-mutation data. The guard is scoped. An invalidation of one resource never discards another resource's in-flight write-back, so concurrent reads of unaffected entries keep filling the cache.

For manual invalidation, `delete` keys on the exact `(method, url, body, authKey)` the read used (the same arguments `get` takes). `deleteMatching(urlPrefix)` drops every cached read whose URL starts at that resource prefix, and `deleteAllForUrl(url)` drops every cached read keyed at a URL (the tool for GraphQL endpoints):

```typescript
// Drop every cached read of /anime/21 (any query string, any identity).
cache.deleteMatching("https://api.myanimelist.net/v2/anime/21");

// Drop every cached GraphQL query at the AniList endpoint.
cache.deleteAllForUrl("https://graphql.anilist.co");
```

Treat `delete` as the targeted tool, `deleteMatching` as the per-resource tool, `deleteAllForUrl` as the per-endpoint tool, and `clear` as the last resort.

### The in-flight read guard, manually

The same guard the transport uses is available for hand-rolled read paths. Capture the generation before the read goes to the network, then store through `setIfFresh`, so an invalidation that landed mid-flight drops the stale write-back instead of caching it:

```typescript
const generationAtRead = cache.getGeneration();
const response = await fetchMyRead();
cache.setIfFresh("GET", url, undefined, authKey, generationAtRead, response);
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) documents the `onResponse` hook that reports cache hits.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) scopes the cache to a single call.
