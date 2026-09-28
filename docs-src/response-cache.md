---
title: Response cache
description: "The opt-in in-memory TTL response cache keyed by method, url, and body. Repeated identical reads, whether GETs or GraphQL queries, skip the network, and the cache never stores mutations."
layout: .vitepress/theme/DocsLayout.vue
---

# Response cache

AniLink has an opt-in in-memory TTL cache for reads. It keys cacheable reads by `(method, url, serialized body)` for the configured TTL, so repeated identical reads skip the network. Cacheable reads include `GET` requests and GraphQL query documents, including AniList queries that the transport sends as `POST`. The cache never stores mutations, including GraphQL `mutation` documents and REST `POST`/`PUT`/`DELETE` calls. It therefore never serves a cached mutation result.

## Creating a cache

```typescript
import { AniLink, ResponseCache } from "anilink-api-wrapper";

const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256 });

const aniLink = new AniLink("token", { responseCache: cache });
```

A `ResponseCache` belongs to the `AniLink` client it is attached to unless you explicitly share it. Pass the same instance to multiple clients only when you want them to share cached entries.

## Configuration

| Option        | Type      | Default             | Description                                                                                                                                                                      |
| ------------- | --------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ttlMs`       | `number`  | `60_000` (1 minute) | Time-to-live for cached entries, in milliseconds                                                                                                                                 |
| `maxEntries`  | `number`  | `128`               | Maximum number of entries. When full, the cache evicts the least-recently-used entries                                                                                           |
| `cloneOnRead` | `boolean` | `true`              | Whether `get()` deep-clones the cached entry before returning it. Set to `false` only when you treat cached responses as immutable. See [Read-side cloning](#read-side-cloning). |

```typescript
// Short TTL for near-fresh data, small footprint.
const shortCache = new ResponseCache({ ttlMs: 5_000, maxEntries: 32 });

// Long TTL for immutable reference data.
const longCache = new ResponseCache({ ttlMs: 3_600_000, maxEntries: 1_000 });
```

## What gets cached

The cache stores two kinds of reads:

- `GET` responses: MAL reads and any custom `GET` requests you dispatch through the transport.
- GraphQL query documents sent as `POST`: every AniList read. The GraphQL transport always uses `POST` for the AniList HTTP endpoint. The cache recognizes a `{ query, variables }` body whose document declares a `query` operation, including anonymous shorthand selections like `{ Viewer { id } }`. It caches those documents as reads. The document and variables form the cache key, so different selections or variable values use separate entries.

The cache excludes GraphQL documents that open with `mutation` and REST `POST`/`PUT`/`DELETE` calls. The GraphQL layer has no `GET` path: `custom()` uses `POST` like every other GraphQL operation. Cache AniList reads by query document.

The cache deep-copies values when it stores them and, by default, when it returns them. The write-side copy prevents changes to the object passed to `set` from affecting the cache. By default, the read-side clone also prevents changes to returned values from affecting later hits. The cache hashes request bodies to build keys, so a credential-bearing `GET` body does not appear in plaintext. It also sorts URL query parameters before keying. Requests for the same resource then share an entry even when their parameter order differs (`?a=1&b=2` and `?b=2&a=1`).

### Read-side cloning

Every cache hit deep-clones the full payload by default. This prevents callers from poisoning later hits by mutating a returned object. For a large payload, such as a 50-item MAL page or a fields-narrowed response, cloning can take a noticeable part of the network time the cache saves. The clone runs on every hit.

Consumers that treat cached responses as immutable can disable the read-side clone with `cloneOnRead: false`:

```typescript
// Read-heavy workload with large payloads, where you treat responses as immutable.
const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256, cloneOnRead: false });
```

With `cloneOnRead: false`, `get()` returns the cached object itself. Hits skip cloning, but mutating the returned object changes the cache and every later hit returns that change. Disable this option only if your code and all consumers treat responses as immutable. The write-side copy still runs. The cache does not retain the object passed to `set()`, so later changes to that original object do not affect the cache.

## Cache hits and observability

Use the existing `onResponse` hook to observe cache hits and misses. A cached response sets `cacheHit: true` and `durationMs: 0`. A cacheable read that goes to the network after a miss sets `cacheHit: false`:

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

Mutations, reads from clients without a cache, and partial-success envelopes resolved by `allowPartialData` omit `cacheHit`. AniLink never caches partial data. Therefore, `cacheHit === false` means that a cacheable read missed. The `onRequestStart` hook also fires for cache hits, so request-volume counters remain accurate.

## Manual cache management

```typescript
// Clear all cached entries (for example after a schema change).
cache.clear();
```

The cache does not serve expired entries. It removes them on read and may remove them on write. A `get` call for an expired entry removes it and returns `undefined`. The cache has no background sweeper.

### Cache statistics

`stats()` returns a frozen snapshot of the cache's current size and lifetime counters. Use the counters to tune `ttlMs` and `maxEntries`:

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

The counters accumulate for the cache instance's lifetime. `delete`, `deleteMatching`, `deleteAllForUrl`, and `clear` remove entries but do not change the counters. `entries` reports the current number of live entries.

Each `get()` call increments exactly one of `hits`, `misses`, or `expirations`. A live entry counts as a hit, an absent key as a miss, and an expired entry as an expiration. Reading an expired entry also removes it. `evictions` counts live entries that `set()` removes to enforce `maxEntries`. The returned snapshot is frozen, so callers cannot change the cache's internal state through it.

### Read-after-write freshness

After a successful mutation, the same client invalidates cached reads the mutation may have changed. A later read fetches fresh data instead of using a pre-mutation entry for the rest of its TTL:

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

- **REST writes** (MAL and any `protocol: "rest"` call) invalidate cached `GET` entries for the mutated resource. The cache derives a prefix from the write URL by removing its query string and any trailing action segment, such as `my_list_status`. A write to `/anime/21/my_list_status` therefore invalidates reads of `/anime/21`. Prefix matching respects path boundaries, so `/anime/21` does not match `/anime/212`. The invalidation applies across auth namespaces because a mutation by one identity changes the resource for every identity. The cache invalidates only when the final path segment is a numeric resource ID. Collection writes such as `POST /anime` and paths without an identifiable ID invalidate nothing, so they do not evict unrelated entries. For example, a bulk update through a custom transport call, such as `PUT /users/@me/animelist`, has no numeric ID and invalidates nothing. Cached affected reads can remain stale until their TTL expires. Use a short `ttlMs` or call `deleteMatching` or `clear` after such writes.
- **GraphQL mutations** (AniList writes) invalidate cached queries at the endpoint when a mutation can change their root fields. All GraphQL operations for one provider share a URL, and one mutation can change several query results. For example, `SaveMediaListEntry` can affect queries for `MediaList`, `MediaListCollection`, `Page`, `Media` (through its `mediaListEntry` embed), `User` or `Viewer` (through their `mediaListCollection` embed), and `Activity` (through the `ListActivity` AniList generates from the write). An unrelated `Staff` query stays cached. If the cache cannot map a mutation to affected root fields, including a future mutation or a document with an uncertain root field, it invalidates every cached GraphQL query at the endpoint. It also drops cached queries whose root cannot be attributed to one field, such as queries with a fragment-spread root or multiple root fields. This fail-closed behavior prevents stale data from surviving a scoped invalidation. The next read fetches fresh data.

Failed mutations never drop cached entries. If an invalidation affects an in-flight read, the transport detects the overlap and drops the stale write-back instead of caching it. This prevents a race from restoring pre-mutation data. The guard is scoped to the affected resource, so an invalidation does not discard another resource's in-flight write-back. Concurrent reads of unaffected entries can still fill the cache.

Use `delete` with the exact `(method, url, body, authKey)` values used by `get()`. It removes that specific entry. `deleteMatching(urlPrefix)` removes every cached read whose URL starts with the prefix. `deleteAllForUrl(url)` removes every cached read for that URL, which is useful for GraphQL endpoints:

```typescript
// Drop every cached read of /anime/21 (any query string, any identity).
cache.deleteMatching("https://api.myanimelist.net/v2/anime/21");

// Drop every cached GraphQL query at the AniList endpoint.
cache.deleteAllForUrl("https://graphql.anilist.co");
```

Use `delete` for one entry, `deleteMatching` for a resource, `deleteAllForUrl` for an endpoint, and `clear` only as a last resort.

### The in-flight read guard, manually

The transport's in-flight read guard is also available for hand-written read paths. Capture the cache generation before starting the network request, then store the response with `setIfFresh`. If an invalidation occurs while the request is in flight, `setIfFresh` drops the stale write-back instead of caching it:

```typescript
const generationAtRead = cache.getGeneration();
const response = await fetchMyRead();
cache.setIfFresh("GET", url, undefined, authKey, generationAtRead, response);
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) documents the `onResponse` hook that reports cache hits.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) scopes the cache to a single call.
