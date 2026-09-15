---
title: Response cache
description: "The opt-in in-memory TTL response cache keyed by method, url, and body: repeated identical reads — GETs and GraphQL queries — skip the network and mutations are never cached."
layout: .vitepress/theme/DocsLayout.vue
---

# Response cache

AniLink ships an opt-in in-memory TTL response cache for read-heavy traversals. When enabled, cacheable reads are cached by `(method, url, serialized body)` for a configurable TTL window, so repeated identical reads skip the network round-trip entirely. Cacheable reads are `GET` requests and GraphQL query documents — including AniList queries, which the transport dispatches as `POST`. Mutations (GraphQL `mutation` documents and REST `POST`/`PUT`/`DELETE` calls) are never cached — no stale writes, ever.

## Creating a cache

```typescript
import { AniLink, ResponseCache } from "anilink-api-wrapper";

const cache = new ResponseCache({ ttlMs: 120_000, maxEntries: 256 });

const aniLink = new AniLink("token", { responseCache: cache });
```

The cache is per-instance: one `ResponseCache` belongs to the `AniLink` client it is attached to and never leaks across clients. Pass the same `ResponseCache` instance to multiple clients only if you genuinely want them to share a cache.

## Configuration

| Option       | Type     | Default             | Description                                                                                |
| ------------ | -------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `ttlMs`      | `number` | `60_000` (1 minute) | Time-to-live for cached entries, in milliseconds                                           |
| `maxEntries` | `number` | `128`               | Maximum number of entries. Least-recently-used entries are evicted when the cap is reached |

```typescript
// Short TTL for near-fresh data, small footprint.
const shortCache = new ResponseCache({ ttlMs: 5_000, maxEntries: 32 });

// Long TTL for immutable reference data.
const longCache = new ResponseCache({ ttlMs: 3_600_000, maxEntries: 1_000 });
```

## What gets cached

Two kinds of reads are cached:

- `GET` responses — MAL reads and any custom `GET` requests you dispatch through the transport.
- GraphQL query documents dispatched as `POST` — every AniList read. The GraphQL transport always POSTs (that is how the AniList HTTP endpoint works), so the cache recognizes a `{ query, variables }` body whose document declares a `query` operation (including anonymous shorthand selections like `{ Viewer { id } }`) and caches it like a read. The document and variables are part of the cache key, so two queries selecting different fields or passing different variables get separate entries.

Mutations are never cached: a GraphQL document opening with `mutation` is excluded, as are REST `POST`/`PUT`/`DELETE` calls. There is no `GET` path through the GraphQL layer — `custom()` POSTs like every other GraphQL operation — so query-document caching is the way to cache AniList reads.

Values are deep-copied on write and on read: the cache never shares a reference with the caller, so mutating an object after `set` (or after receiving it from `get`) cannot poison later hits. Cache keys hash the request body, so a credential-bearing `GET` body is never duplicated into the key in plaintext. The URL's query string is canonicalized (parameters sorted) before keying, so the same resource requested with a different parameter order (`?a=1&b=2` vs `?b=2&a=1`) hits the same entry.

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

Expired entries are evicted lazily on read — a `get` call for an expired entry removes it and returns `undefined` — and opportunistically on write, so never-re-read entries do not linger past their TTL. No background sweeper required.

### Read-after-write freshness

A successful mutation sent through the same client automatically invalidates the cached reads it may have changed, so a read-after-write sequence refetches instead of serving the pre-mutation entry for the rest of the TTL:

```typescript
const aniLink = new AniLink({
    mal: { accessToken: "mal-token", responseCache: cache },
});

// Read (cached) …
await aniLink.mal.anime.get({ id: 21 });

// … mutate: the PATCH to /anime/21/my_list_status drops the cached
// read of /anime/21 automatically …
await aniLink.mal.anime.updateMyListStatus({ anime_id: 21, status: "completed" });

// … so the next `get` refetches the updated entry.
await aniLink.mal.anime.get({ id: 21 });
```

The two write shapes invalidate differently:

- **REST writes** (MAL and any `protocol: "rest"` call) drop the cached `GET` entries of the mutated resource. The invalidation prefix is derived from the mutated URL: the query string is stripped, and a trailing action segment (`my_list_status`) is removed so a write to `/anime/21/my_list_status` invalidates the cached reads of `/anime/21`. The match is boundary-aware — `/anime/21` never invalidates `/anime/212` — and spans every auth namespace, because a mutation by one identity changes the resource for every identity that reads it. Only writes whose final path segment is a numeric resource id invalidate anything: a collection write (`POST /anime`) or an unidentifiable path invalidates nothing rather than evicting unrelated entries. One concrete consequence: a whole-list write such as `PUT /users/@me/animelist` (a bulk update dispatched through a custom transport call) has no numeric resource id, so it invalidates nothing — cached reads of the affected entries stay stale for up to `ttlMs`. Keep `ttlMs` short, or call `deleteMatching`/`clear` manually after such writes.
- **GraphQL mutations** (AniList writes) drop every cached GraphQL query at the endpoint. Every operation of one provider is keyed at the same URL, and a mutation can change what many different query documents return (a `SaveMediaListEntry` changes what both a `MediaList` and a `MediaListCollection` query report), so no finer-grained prefix than the endpoint can be derived. This is deliberately conservative: the next reads refetch fresh data instead of serving pre-mutation entries.

Failed mutations never drop cached entries, and a read whose response was in flight when an invalidation affecting it landed is not re-cached — the transport detects the interleaving and drops the stale write-back, so the race cannot reintroduce pre-mutation data. The guard is scoped: an invalidation of one resource never discards another resource's in-flight write-back, so concurrent reads of unaffected entries keep filling the cache.

For manual invalidation, `delete` keys on the exact `(method, url, body, authKey)` the read used — the same arguments `get` takes — `deleteMatching(urlPrefix)` drops every cached read whose URL starts at that resource prefix, and `deleteAllForUrl(url)` drops every cached read keyed at a URL (the tool for GraphQL endpoints):

```typescript
// Drop every cached read of /anime/21 (any query string, any identity).
cache.deleteMatching("https://api.myanimelist.net/v2/anime/21");

// Drop every cached GraphQL query at the AniList endpoint.
cache.deleteAllForUrl("https://graphql.anilist.co");
```

Treat `delete` as the targeted tool, `deleteMatching` as the per-resource tool, `deleteAllForUrl` as the per-endpoint tool, and `clear` as the sledgehammer.

### The in-flight read guard, manually

The same guard the transport uses is available for hand-rolled read paths: capture the generation before the read goes to the network, then store through `setIfFresh` so an invalidation that landed mid-flight drops the stale write-back instead of caching it:

```typescript
const generationAtRead = cache.getGeneration();
const response = await fetchMyRead();
cache.setIfFresh("GET", url, undefined, authKey, generationAtRead, response);
```

## Next steps

- <Icon name="ArrowRight" :size="14" /> [Observability](/observability) — the `onResponse` hook that reports cache hits.
- <Icon name="ArrowRight" :size="14" /> [Per-request options](/per-request-options) — scoping the cache to a single call.
