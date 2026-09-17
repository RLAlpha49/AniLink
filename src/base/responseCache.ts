/**
 * Opt-in in-memory TTL response cache for read-heavy traversals.
 *
 * The cache is keyed by `(method, url, serialized body)` and capped by
 * `maxEntries`. It is opt-in (off by default) and serves two kinds of reads:
 * `GET` requests, and GraphQL query documents dispatched as `POST` (the
 * AniList transport's only read shape). Mutations are never cached — neither
 * REST `POST`/`PUT`/`DELETE` calls nor GraphQL `mutation` documents. A
 * successful mutation dispatched through the transport invalidates the
 * cached reads of the mutated resource (REST writes, via
 * {@link ResponseCache.deleteMatching}) or of the whole GraphQL endpoint
 * (GraphQL writes, via {@link ResponseCache.deleteAllForUrl}). Cache hits
 * are observable through the existing `onResponse` hook via a `cacheHit`
 * flag so consumers can distinguish a cached response from a network
 * round-trip, and lifetime size and hit/miss/expiration/eviction counters
 * are available through {@link ResponseCache.stats} for data-driven
 * `ttlMs`/`maxEntries` tuning.
 */

import { createHash } from "node:crypto";

/**
 * Matches a GraphQL document that declares a read (query) operation: an
 * anonymous shorthand selection (`{ Viewer { id } }`) or a document opening
 * with the `query` keyword. Documents opening with `mutation` (or anything
 * else) fail the test, so write documents stay excluded from the cache.
 *
 * This is the same deliberately lightweight shape check `CustomRequest`
 * applies to validate executable documents — not a parser. Leading `#`
 * comment lines are stripped before the test so a copied document that
 * opens with a comment anchors at the first executable token.
 */
const GRAPHQL_QUERY_PATTERN = /^\s*(?:\{|query\b[\s\S]*\{)/;

/**
 * Strips leading `#` comment lines and blank lines from a GraphQL document
 * so the query pattern can anchor at the first executable token. Only the
 * document head is stripped — comments between selections are untouched.
 */
const stripLeadingComments = (query: string): string => {
    let rest = query;
    for (;;) {
        // Consume one leading blank-or-comment line per iteration; a flat
        // loop avoids the nested-quantifier regex the security linter flags.
        const line = /^[^\n]*\n/.exec(rest);
        if (line === null) {
            return rest;
        }
        if (!/^\s*(#|$)/.test(line[0])) {
            return rest;
        }
        rest = rest.slice(line[0].length);
    }
};

/**
 * Whether a request is a cacheable read: a `GET`, or a GraphQL-protocol
 * `POST` whose `{ query, variables }` body declares a `query` operation.
 *
 * The AniList transport dispatches every GraphQL document — queries
 * included — as a `POST`, so a `GET`-only gate would leave the cache
 * structurally inert for the library's primary provider. Query documents
 * are safe to cache for the same reason `GET`s are: they are reads whose
 * response is fully determined by the request (the body is part of the
 * cache key). Mutations — GraphQL `mutation` documents and REST
 * `POST`/`PUT`/`DELETE` calls — stay excluded so no write is ever served
 * from cache.
 * Internal transport helper: exported for the transport module, not part
 * of the package's public surface.
 * @param method - The HTTP method of the request.
 * @param data - The request body, when present.
 * @returns `true` when the request is a cacheable read.
 */
export const isCacheableRequest = (method: string, data?: object | string): boolean => {
    if (method === "GET") {
        return true;
    }
    if (method !== "POST") {
        return false;
    }
    // A GraphQL read POST carries the `{ query, variables }` body shape;
    // REST POSTs (form grants, JSON writes) and pre-encoded string bodies
    // are not GraphQL documents and stay excluded.
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return false;
    }
    const { query } = data as { query?: unknown };
    if (typeof query !== "string") {
        return false;
    }
    return GRAPHQL_QUERY_PATTERN.test(stripLeadingComments(query));
};

/**
 * Whether a request carries a GraphQL document body at all — a
 * GraphQL-protocol `POST` whose body is a `{ query, variables }` object —
 * regardless of whether the document declares a read or a write.
 *
 * The transport uses this to route invalidation: a GraphQL document POST
 * that is not a cacheable read (see {@link isCacheableRequest}) is a
 * `mutation` document, and a successful one invalidates every cached
 * GraphQL query at the endpoint (see {@link ResponseCache.deleteAllForUrl}).
 * REST `POST` bodies that merely happen to carry a `query` field (for
 * example a search request) never reach this check through the transport:
 * the caller marks them with the REST protocol first.
 *
 * Internal transport helper: exported for the transport module, not part
 * of the package's public surface.
 *
 * @param method - The HTTP method of the request.
 * @param data - The request body, when present.
 * @returns `true` when the body is a GraphQL `{ query, variables }` document.
 */
export const isGraphQLDocumentRequest = (method: string, data?: object | string): boolean => {
    if (method !== "POST") {
        return false;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return false;
    }
    return typeof (data as { query?: unknown }).query === "string";
};

/**
 * A single cached response entry.
 */
interface CacheEntry<T> {
    /** The cached response body. */
    data: T;
    /** The epoch millisecond at which the entry expires. */
    expiresAt: number;
}

/**
 * One recorded invalidation for the in-flight read guard (see
 * {@link ResponseCache.setIfFresh}): the generation it landed at and a
 * predicate telling whether a cache key falls inside its scope.
 */
interface InvalidationEvent {
    /** The generation the invalidation landed at. */
    at: number;
    /** Whether the invalidation affects the given cache key. */
    affects: (key: string) => boolean;
}

/**
 * Upper bound on retained invalidation events. Invalidation is rare (one
 * event per successful mutation), so the log stays tiny in practice; the
 * cap only bounds memory for invalidation-heavy workloads. A read that
 * captured a generation older than the pruned events has its write-back
 * dropped conservatively (see {@link ResponseCache.setIfFresh}).
 */
const MAX_INVALIDATION_EVENTS = 64;

/**
 * Configuration for the opt-in response cache.
 */
export interface ResponseCacheOptions {
    /**
     * The time-to-live for cached entries, in milliseconds. Defaults to
     * 60_000 (1 minute). `0` disables retention entirely — every `set()` is
     * a no-op and every `get()` is a miss — so a shared cache instance can be
     * wired in for shape-compatibility while a particular workload opts out
     * of caching without constructing a second client.
     */
    ttlMs?: number;
    /** The maximum number of entries to retain. Defaults to 128. Entries are evicted LRU when the cap is reached. */
    maxEntries?: number;
    /**
     * Whether `get()` deep-clones the cached entry before returning it.
     * Defaults to `true`, which preserves the mutation-safety guarantee: a
     * caller that mutates the returned object cannot corrupt the cached
     * copy or affect subsequent reads. Set to `false` to skip the read-side
     * clone — every cache hit then returns the cached object itself, so a
     * caller that mutates it poisons later hits. Disable only when cached
     * responses are treated as immutable. The write-side clone in `set()`
     * is unaffected: the cache never aliases the caller's object either
     * way.
     */
    cloneOnRead?: boolean;
}

/**
 * A point-in-time snapshot of the cache's size and lifetime counters,
 * returned by {@link ResponseCache.stats}.
 *
 * The counters are cumulative for the cache instance's lifetime and never
 * reset — `delete()`, `deleteMatching()`, `deleteAllForUrl()`, and `clear()`
 * drop entries but keep the counters, so a dashboard graphing hit rate over
 * time stays monotonic — while `entries` reflects the current live entry
 * count. The snapshot is frozen: a caller cannot mutate the cache's internal
 * state through it.
 */
export interface ResponseCacheStats {
    /** The number of entries currently live in the cache. */
    entries: number;
    /** How many `get()` calls returned a live entry. */
    hits: number;
    /**
     * How many `get()` calls found no entry for the key — an absent key, or
     * a live entry that degraded to a miss because its payload could not
     * be cloned on read.
     */
    misses: number;
    /**
     * How many expired entries were evicted — encountered on read, or
     * removed by the opportunistic write-time sweep.
     */
    expirations: number;
    /** How many live entries were evicted by `set()` under `maxEntries` pressure. */
    evictions: number;
}

/**
 * Whether `value` is a plain object literal (or `Object.create(null)`), as
 * opposed to a built-in like `Date`/`Map` or a class instance.
 */
const isPlainObject = (value: object): boolean => {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

/**
 * Deterministic serialization for cache keys: object properties are sorted
 * so bodies that differ only in key order produce one key. The `seen` set
 * guards against cycles (repeated references serialize as `"[Circular]"`),
 * and removing a reference after serialization keeps duplicate sibling
 * references working like `JSON.stringify`.
 *
 * Non-plain objects (`Date`, `Map`, class instances, …) fall back to
 * `JSON.stringify` so their native rendering (`Date` → ISO string) keeps
 * distinct values on distinct keys. A naive sorted-key walk would render
 * every one of them as `{}` and collapse different bodies onto one cache
 * entry — a wrong-answer cache hit.
 */
const stableStringify = (value: unknown, seen: Set<object> = new Set()): string => {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value) ?? "undefined";
    }
    if (seen.has(value)) {
        return '"[Circular]"';
    }
    seen.add(value);
    try {
        if (Array.isArray(value)) {
            return `[${value.map((item) => stableStringify(item, seen)).join(",")}]`;
        }
        if (!isPlainObject(value)) {
            // Built-ins and class instances: keep JSON.stringify's native
            // rendering (toJSON, ISO dates, …) so distinct values stay
            // distinct. Key-order stability does not apply to them.
            return JSON.stringify(value) ?? "undefined";
        }
        const keys = Object.keys(value).sort();
        return `{${keys
            .map(
                (key) =>
                    `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key], seen)}`
            )
            .join(",")}}`;
    } finally {
        seen.delete(value);
    }
};

/**
 * An in-memory TTL response cache with an LRU eviction cap.
 *
 * The cache is per-instance (one per `AniLink` client when enabled) so cache
 * state never leaks across clients. Entries expire after `ttlMs` and the
 * cache is capped at `maxEntries` with least-recently-used eviction.
 *
 * **Aliasing:** values returned from {@link ResponseCache.get} are deep
 * clones of the cached entry, so a caller that mutates the returned object
 * cannot corrupt the cached copy or affect subsequent reads. Consumers
 * that treat cached responses as immutable can disable the read-side clone
 * with `cloneOnRead: false` (see {@link ResponseCacheOptions.cloneOnRead});
 * the write-side clone in {@link ResponseCache.set} still guarantees the
 * cache never aliases the caller's object.
 *
 * **Invalidation:** entries expire after `ttlMs`, and a successful
 * non-`GET` request dispatched through the same transport automatically
 * invalidates the cached reads of what it mutated — REST writes drop the
 * mutated resource's cached `GET` entries (see
 * {@link ResponseCache.deleteMatching}) and GraphQL `mutation` documents
 * drop every cached query at the endpoint (see
 * {@link ResponseCache.deleteAllForUrl}) — so a read-after-write sequence
 * refetches instead of serving the pre-mutation entry. A read whose
 * network response was in flight when an invalidation affecting it landed
 * does not re-cache its stale response (see
 * {@link ResponseCache.setIfFresh}). Use
 * {@link ResponseCache.delete} for exact-key invalidation or
 * {@link ResponseCache.clear} to drop everything.
 *
 * **Observability:** {@link ResponseCache.stats} returns a frozen snapshot
 * of the live entry count and the lifetime hit/miss/expiration/eviction
 * counters, so tuning can distinguish a too-small cache (rising evictions)
 * from a too-short TTL (rising expirations).
 *
 * **Privacy:** the cache stores the full response body of every `GET`
 * request when enabled, including authenticated user-scoped responses
 * (for example `/Viewer`-style queries that return the user's profile or
 * email). Cached bodies are retained in plaintext in the JS heap for up to
 * `ttlMs` and are accessible to any code holding a reference to the
 * `ResponseCache` instance. Entries are scoped by a SHA-256 hash of the
 * bearer token so cached responses never cross identities, but within one
 * identity sensitive payloads are retained verbatim. Do not enable the
 * cache for clients that fetch private user data unless `ttlMs` is short
 * and the cache instance is not shared across trust boundaries.
 */
export class ResponseCache {
    private readonly entries = new Map<string, CacheEntry<unknown>>();
    private readonly ttlMs: number;
    private readonly maxEntries: number;
    /** Whether `get()` deep-clones the cached entry (see {@link ResponseCacheOptions.cloneOnRead}). */
    private readonly cloneOnRead: boolean;
    private nextExpiryCheckAt: number | undefined;
    private generation = 0;
    /** Scoped invalidation events for the in-flight read guard (see {@link setIfFresh}). */
    private readonly invalidationEvents: InvalidationEvent[] = [];
    /** The newest generation pruned from {@link invalidationEvents}. */
    private prunedThrough = 0;
    /** Lifetime count of `get()` calls that returned a live entry. */
    private hits = 0;
    /** Lifetime count of `get()` calls that found no entry for the key. */
    private misses = 0;
    /** Lifetime count of expired entries evicted on read or by the write-time sweep. */
    private expirations = 0;
    /** Lifetime count of live entries evicted by `set()` under `maxEntries` pressure. */
    private evictions = 0;

    /**
     * Creates a response cache.
     *
     * @param options - Cache configuration; `ttlMs` defaults to 60_000,
     * `maxEntries` to 128, and `cloneOnRead` to `true`.
     */
    constructor(options?: ResponseCacheOptions) {
        const rawTtl = options?.ttlMs ?? 60_000;
        if (!Number.isFinite(rawTtl) || rawTtl < 0) {
            throw new TypeError("ttlMs must be a finite, non-negative number");
        }
        this.ttlMs = rawTtl;

        const rawMax = options?.maxEntries ?? 128;
        if (!Number.isFinite(rawMax) || rawMax <= 0 || !Number.isInteger(rawMax)) {
            throw new TypeError("maxEntries must be a finite, positive integer");
        }
        this.maxEntries = rawMax;

        const rawCloneOnRead = options?.cloneOnRead ?? true;
        if (typeof rawCloneOnRead !== "boolean") {
            throw new TypeError("cloneOnRead must be a boolean");
        }
        this.cloneOnRead = rawCloneOnRead;
    }

    /**
     * Canonicalizes a URL for keying: the query string's parameters are
     * sorted so `?a=1&b=2` and `?b=2&a=1` — the same resource — share one
     * cache entry instead of missing each other.
     *
     * The query string is anchored at the first `?` that appears before any
     * `#`, so a `?` inside a fragment (`path#frag?x`) is never mistaken for
     * the query delimiter — harmless for keying, but the method must stay
     * correct if it is ever reused for matching or allowlists.
     *
     * @param url - The request URL, possibly carrying a query string.
     * @returns The URL with its query parameters in sorted order.
     */
    private static canonicalizeUrl(url: string): string {
        const fragmentIndex = url.indexOf("#");
        const searchStart = fragmentIndex === -1 ? url : url.slice(0, fragmentIndex);
        const queryIndex = searchStart.indexOf("?");
        if (queryIndex === -1) {
            return url;
        }
        const base = searchStart.slice(0, queryIndex);
        const query = searchStart.slice(queryIndex + 1);
        const fragment = fragmentIndex === -1 ? "" : url.slice(fragmentIndex);
        if (query === "") {
            return url;
        }
        const sorted = query.split("&").sort().join("&");
        return `${base}?${sorted}${fragment}`;
    }

    /**
     * Builds the cache key for a request.
     *
     * The serialized body is SHA-256 hashed (truncated to 16 hex chars)
     * before it enters the key, so a credential-bearing GET body is never
     * duplicated into the key string in plaintext — the key map retains
     * entries for up to the TTL, outliving the error paths the rest of the
     * library scrubs. The hash is deterministic, so equal bodies still share
     * one entry and different bodies still get different entries. The URL's
     * query string is canonicalized (parameters sorted) so the same resource
     * requested with a different parameter order hits the same entry.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @returns The cache key.
     */
    private static buildKey(
        method: string,
        url: string,
        data?: object | string,
        authKey?: string
    ): string {
        const body =
            data === undefined
                ? "none"
                : `sha256:${createHash("sha256").update(stableStringify(data)).digest("hex").slice(0, 16)}`;
        return `${method}:${ResponseCache.canonicalizeUrl(url)}:${body}:${authKey ?? "none"}`;
    }

    /**
     * Whether a cache key sits at `prefix` and ends it at a legal boundary
     * character, so the prefix `/anime/21` does not match `/anime/212`.
     * Keys embed the canonicalized URL verbatim in
     * `${method}:${url}:${body}:${authKey}`, so prefix matching against the
     * composed key reaches the URL without parsing it back out (the URL
     * itself contains the `:` of `https://`).
     *
     * @param key - The cache key to test.
     * @param prefix - The composed `method:url` prefix.
     * @param boundaries - The characters that may follow the prefix.
     * @returns `true` when the key starts with the prefix at a boundary.
     */
    private static keyAtPrefix(key: string, prefix: string, boundaries: string): boolean {
        if (!key.startsWith(prefix)) {
            return false;
        }
        const boundary = key.charAt(prefix.length);
        return boundary !== "" && boundaries.includes(boundary);
    }

    /**
     * Reads a cached response for the given request, or `undefined` when the
     * entry is absent or expired. Expired entries are evicted on read. By
     * default the returned value is a deep clone of the cached entry, so a
     * caller that mutates it cannot corrupt the cached copy or affect
     * subsequent reads; with `cloneOnRead: false` the cached object itself is
     * returned and callers must treat it as immutable.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @returns A deep clone of the cached response body (or the cached object
     * itself when `cloneOnRead` is disabled), or `undefined`.
     */
    get<T>(method: string, url: string, data?: object | string, authKey?: string): T | undefined {
        const key = ResponseCache.buildKey(method, url, data, authKey);
        const entry = this.entries.get(key);
        if (entry === undefined) {
            this.misses += 1;
            return undefined;
        }
        if (Date.now() >= entry.expiresAt) {
            this.entries.delete(key);
            this.expirations += 1;
            return undefined;
        }
        // Refresh recency: delete + re-insert moves the entry to the end.
        this.entries.delete(key);
        this.entries.set(key, entry);
        if (!this.cloneOnRead) {
            // Opt-out: return the cached object itself. The write-side clone
            // in set() still guarantees the cache never aliases the
            // caller's object; the caller must not mutate the returned value.
            this.hits += 1;
            return entry.data as T;
        }
        try {
            const clone = structuredClone(entry.data) as T;
            this.hits += 1;
            return clone;
        } catch {
            // Read-side defensive guard, mirroring set(): a payload that
            // cannot be cloned (for example one stored through a future
            // unguarded path) degrades to a cache miss instead of throwing
            // on a hit. The entry is dropped so later reads do not retry
            // the same failing clone. The degraded read counts as a miss
            // (the caller observed one), keeping hits + misses +
            // expirations equal to the total number of get() calls.
            this.entries.delete(key);
            this.misses += 1;
            return undefined;
        }
    }

    /**
     * Stores a response in the cache, evicting the LRU entry when the cap is
     * is reached. Only cacheable reads are stored — `GET` requests and
     * GraphQL query documents dispatched as `POST`; mutations and other
     * methods are no-ops. The value is deep-copied on write; the cache never
     * aliases the caller's object.
     *
     * Note for direct callers: a `POST` body shaped like `{ query: "..." }`
     * is treated as a GraphQL document and cached when the document declares
     * a read. Do not use `set` for REST `POST` writes whose body merely
     * carries a `query` field — the transport excludes those via its protocol
     * flag, but `set` itself cannot distinguish them.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @param response - The response body to cache.
     */
    set<T>(
        method: string,
        url: string,
        data: object | string | undefined,
        authKey: string | undefined,
        response: T
    ): void {
        if (!isCacheableRequest(method, data)) return;
        // `ttlMs: 0` is the explicit "do not retain" configuration: storing
        // an already-expired entry would make `get()` a guaranteed miss while
        // still paying the clone and eviction bookkeeping, so skip the write
        // entirely.
        if (this.ttlMs === 0) return;
        const key = ResponseCache.buildKey(method, url, data, authKey);
        let snapshot: T;
        try {
            // Write-side defensive copy: the cache never shares a reference
            // with the caller, so mutating the object handed to (or returned
            // by) sendRequest cannot poison later hits. Cloned before any
            // mutation of `this.entries` so an uncloneable payload leaves
            // the cache untouched instead of dropping the existing entry
            // or evicting an unrelated one.
            snapshot = structuredClone(response);
        } catch {
            // Uncloneable payload (functions, DOM nodes): skip caching
            // rather than fail a request that already succeeded, and never
            // fall back to storing the live reference.
            return;
        }
        // Opportunistic purge: expired entries are also evicted on write so
        // never-re-read entries do not linger until LRU pressure. Bounded by
        // `maxEntries`, but this keeps long-TTL caches from holding plaintext
        // bodies longer than their TTL. The `nextExpiryCheckAt` watermark
        // amortizes the sweep: it runs at most once per TTL elapse, not on
        // every write.
        this.purgeExpired();
        if (this.entries.has(key)) {
            // Refresh recency for an existing key instead of relying on
            // `Map.set` keeping its original position.
            this.entries.delete(key);
        } else if (this.entries.size >= this.maxEntries) {
            this.evictLru();
        }
        this.entries.set(key, {
            data: snapshot,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    /**
     * Returns the current invalidation generation, for callers that need to
     * detect an invalidation landing between a cache-miss read and its
     * write-back (see {@link setIfFresh}). The counter is global, but the
     * check in {@link setIfFresh} is scoped: only invalidations affecting
     * the read's own key drop its write-back.
     *
     * @returns The current generation counter value.
     */
    getGeneration(): number {
        return this.generation;
    }

    /**
     * Stores a response only when no invalidation affecting the request has
     * landed since the caller captured the generation — the write-back half
     * of the in-flight-read guard.
     *
     * The transport captures the generation right after a cache miss (before
     * the network read starts) and hands it here on success. When a mutation
     * invalidates the cache while that read is in flight, the generation has
     * moved on and the stale response is dropped instead of re-cached,
     * closing the read-after-write race a plain {@link ResponseCache.set}
     * would reintroduce. The check is scoped to the request's own key: an
     * invalidation of a different resource does not drop this write-back, so
     * concurrent reads of unaffected resources keep filling the cache.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @param generationAtRead - The generation the caller captured before
     * the read went to the network.
     * @param response - The response body to cache.
     */
    setIfFresh<T>(
        method: string,
        url: string,
        data: object | string | undefined,
        authKey: string | undefined,
        generationAtRead: number,
        response: T
    ): void {
        if (this.wasInvalidatedSince(generationAtRead, method, url, data, authKey)) {
            return;
        }
        this.set(method, url, data, authKey, response);
    }

    /**
     * Whether an invalidation affecting the given request's key landed
     * after the caller captured the generation — the decision half of the
     * in-flight-read guard.
     *
     * The check is scoped, not global: an invalidation of one resource does
     * not drop another resource's in-flight write-back, so interleaved
     * mutate-while-reading workloads keep their unaffected entries. When
     * the event log has been pruned past the read's generation (more than
     * {@link MAX_INVALIDATION_EVENTS} invalidations landed during one
     * read), the write-back is dropped conservatively: staleness can no
     * longer be ruled out.
     *
     * @param generationAtRead - The generation the caller captured before
     * the read went to the network.
     * @param method - The HTTP method of the read.
     * @param url - The URL of the read.
     * @param data - The request body of the read, when present.
     * @param authKey - The auth-scoping cache key fragment of the read.
     * @returns `true` when an affecting invalidation landed mid-flight.
     */
    private wasInvalidatedSince(
        generationAtRead: number,
        method: string,
        url: string,
        data: object | string | undefined,
        authKey: string | undefined
    ): boolean {
        if (generationAtRead === this.generation) {
            // Fast path: no invalidation landed at all.
            return false;
        }
        if (generationAtRead < this.prunedThrough) {
            // Events covering the read's window were pruned: staleness can
            // no longer be ruled out, so drop the write-back. Strict
            // comparison: `prunedThrough` is the oldest pruned event's
            // generation, and a read at exactly that generation still needs
            // only events after it, which are all retained.
            return true;
        }
        const key = ResponseCache.buildKey(method, url, data, authKey);
        for (let i = this.invalidationEvents.length - 1; i >= 0; i -= 1) {
            const event = this.invalidationEvents[i];
            if (event.at <= generationAtRead) {
                break;
            }
            if (event.affects(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Records an invalidation: bumps the generation and logs a scoped event
     * so an in-flight read can later tell whether the invalidation affected
     * its key (see {@link setIfFresh}).
     *
     * @param affects - Whether a cache key falls inside the invalidation's
     * scope.
     */
    private recordInvalidation(affects: (key: string) => boolean): void {
        this.generation += 1;
        this.invalidationEvents.push({ at: this.generation, affects });
        if (this.invalidationEvents.length > MAX_INVALIDATION_EVENTS) {
            const pruned = this.invalidationEvents.shift();
            this.prunedThrough = Math.max(this.prunedThrough, pruned?.at ?? 0);
        }
    }

    /**
     * Removes the cached entry for the given request, if present. Use this
     * for targeted invalidation after a mutation that changes the resource
     * (for example a `POST` that updates the entity a cached `GET` returned).
     * Only cacheable reads are tracked — `GET` requests and GraphQL query
     * documents dispatched as `POST` — so other methods are a no-op and
     * return `false`.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @returns `true` when an entry was removed, `false` when it was absent
     *          or the method is not cached.
     */
    delete(method: string, url: string, data?: object | string, authKey?: string): boolean {
        if (!isCacheableRequest(method, data)) return false;
        const key = ResponseCache.buildKey(method, url, data, authKey);
        this.recordInvalidation((candidate) => candidate === key);
        return this.entries.delete(key);
    }

    /**
     * Removes every cached `GET` entry whose URL starts with `urlPrefix` at
     * a path-segment boundary, and returns how many entries were removed.
     *
     * The prefix is matched against the canonicalized URL with its query
     * string and fragment stripped, so a cached read of
     * `https://host/anime/21?fields=...` is invalidated by the prefix
     * `https://host/anime/21`. The match is boundary-aware: the prefix
     * `https://host/anime/21` does **not** match `https://host/anime/212` —
     * the cached URL must be either exactly the prefix, continue with `/`
     * (a child path), `?` (a query string), or `#` (a fragment). Matching
     * spans every auth namespace, because a mutation performed by one
     * identity changes the underlying resource for every identity that can
     * read it.
     *
     * This is the invalidation primitive behind mutation-triggered cache
     * invalidation for REST writes: after a successful write, the transport
     * derives the mutated resource's base URL and drops every cached read
     * of that resource. It is also usable directly for manual bulk
     * invalidation. GraphQL `mutation` documents invalidate through
     * {@link ResponseCache.deleteAllForUrl} instead: their cached reads are
     * keyed at the endpoint URL, which no resource prefix can name.
     *
     * @param urlPrefix - The resource base URL whose cached reads should be
     * dropped; query strings and fragments on the prefix are ignored.
     * @returns The number of cached entries removed.
     */
    deleteMatching(urlPrefix: string): number {
        // Normalize the prefix the same way cache keys are built: strip any
        // query string and fragment so callers can pass the full read URL,
        // and drop a trailing slash so `/anime/21/` and `/anime/21` share one
        // prefix.
        const fragmentIndex = urlPrefix.indexOf("#");
        const withoutFragment =
            fragmentIndex === -1 ? urlPrefix : urlPrefix.slice(0, fragmentIndex);
        const queryIndex = withoutFragment.indexOf("?");
        const base = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
        const prefix = base.endsWith("/") && base.length > 1 ? base.slice(0, -1) : base;

        // An invalidation landed, whether or not an entry matches: an
        // in-flight read of the resource is stale even when no cached copy
        // of it existed yet.
        this.recordInvalidation((key) => ResponseCache.keyAtPrefix(key, `GET:${prefix}`, ":/?#"));

        let removed = 0;
        // Keys embed the canonicalized URL verbatim in
        // `${method}:${url}:${body}:${authKey}`, and only `GET` entries
        // exist, so matching the key against `GET:${prefix}` is equivalent to
        // matching the URL — without parsing the URL back out of the key
        // (the URL itself contains the `:` of `https://`). The character after
        // the prefix must be the key's `:` delimiter, a `/` (child path), a
        // `?` (query string), or a `#` (fragment) — anything else (for
        // example `/anime/21abc`) is a different resource and must not match.
        const keyPrefix = `GET:${prefix}`;
        for (const key of this.entries.keys()) {
            if (ResponseCache.keyAtPrefix(key, keyPrefix, ":/?#")) {
                this.entries.delete(key);
                removed += 1;
            }
        }
        return removed;
    }

    /**
     * Removes every cached read keyed at the given URL — `GET` entries and
     * GraphQL query `POST` entries alike, across query strings, documents,
     * variables, and auth namespaces — and returns how many entries were
     * removed.
     *
     * This is the invalidation primitive for GraphQL writes: every GraphQL
     * operation of one provider is keyed at the same endpoint URL, and a
     * `mutation` document can change what many different query documents
     * return (a `SaveMediaListEntry` changes what both a `MediaList` and a
     * `MediaListCollection` query report), so no finer-grained prefix than
     * the endpoint can be derived. Dropping the endpoint's cached queries is
     * deliberately conservative: the next reads refetch fresh data instead
     * of serving pre-mutation entries for the rest of the TTL.
     *
     * @param url - The request URL whose cached reads should be dropped;
     * its query string and fragment are ignored.
     * @returns The number of cached entries removed.
     */
    deleteAllForUrl(url: string): number {
        const fragmentIndex = url.indexOf("#");
        const withoutFragment = fragmentIndex === -1 ? url : url.slice(0, fragmentIndex);
        const queryIndex = withoutFragment.indexOf("?");
        const base = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex);
        const prefix = base.endsWith("/") && base.length > 1 ? base.slice(0, -1) : base;

        // An invalidation landed, whether or not an entry matches: an
        // in-flight read at the endpoint is stale even when no cached copy
        // of it existed yet.
        this.recordInvalidation((key) =>
            [`GET:${prefix}`, `POST:${prefix}`].some((methodPrefix) =>
                ResponseCache.keyAtPrefix(key, methodPrefix, ":?#")
            )
        );

        let removed = 0;
        // Keys embed the canonicalized URL verbatim in
        // `${method}:${url}:${body}:${authKey}`. Only `GET` and GraphQL query
        // `POST` entries exist, so matching each method prefix against the
        // base URL — without parsing the URL back out of the key (the URL
        // itself contains the `:` of `https://`) — reaches every entry at
        // the URL. The character after the prefix must be the key's `:`
        // delimiter, a `?` (query string), or a `#` (fragment) — anything else
        // (for example `/anime/21abc`) is a different URL and must not match.
        const methodPrefixes = [`GET:${prefix}`, `POST:${prefix}`];
        for (const key of this.entries.keys()) {
            const matches = methodPrefixes.some((methodPrefix) =>
                ResponseCache.keyAtPrefix(key, methodPrefix, ":?#")
            );
            if (matches) {
                this.entries.delete(key);
                removed += 1;
            }
        }
        return removed;
    }

    /**
     * Evicts the least-recently-used entry.
     */
    private evictLru(): void {
        // Map preserves insertion order; the first key is the least
        // recently used after the delete+re-insert refreshes in get/set.
        const oldestKey = this.entries.keys().next().value;
        if (oldestKey !== undefined) {
            this.entries.delete(oldestKey);
            this.evictions += 1;
        }
    }

    /**
     * Removes every entry whose TTL has elapsed. Called opportunistically on
     * `set()` so expired entries are dropped even when they are never read
     * again; `get()` also evicts lazily on read. The `nextExpiryCheckAt`
     * watermark skips the sweep entirely while no entry can have expired,
     * keeping the per-write cost O(1) amortized instead of O(n).
     */
    private purgeExpired(): void {
        const now = Date.now();
        if (this.nextExpiryCheckAt !== undefined && now < this.nextExpiryCheckAt) {
            return;
        }
        let nextCheck: number | undefined;
        for (const [key, entry] of this.entries) {
            if (now >= entry.expiresAt) {
                this.entries.delete(key);
                this.expirations += 1;
            } else {
                nextCheck =
                    nextCheck === undefined
                        ? entry.expiresAt
                        : Math.min(nextCheck, entry.expiresAt);
            }
        }
        this.nextExpiryCheckAt = nextCheck;
    }

    /**
     * Clears all cached entries.
     */
    clear(): void {
        this.recordInvalidation(() => true);
        this.entries.clear();
    }

    /**
     * Returns a read-only snapshot of the cache's size and lifetime
     * counters, so cache tuning (`ttlMs`/`maxEntries`) can be data-driven:
     * entry counts and eviction/expiration counters distinguish a too-small
     * cache (rising `evictions`) from a too-short TTL (rising
     * `expirations`), and hit-rate dashboards can read `hits`/`misses`
     * directly instead of inferring misses by subtracting hits from total
     * response counts.
     *
     * The counters are cumulative for the cache instance's lifetime —
     * `delete()`, `deleteMatching()`, `deleteAllForUrl()`, and `clear()`
     * drop entries but never reset or increment the counters — and
     * `entries` reflects the current live entry count. The returned object
     * is frozen, so a caller cannot mutate the cache's internal state
     * through it.
     *
     * @returns A frozen `{ entries, hits, misses, expirations, evictions }`
     * snapshot of the cache's current size and lifetime counters.
     */
    stats(): ResponseCacheStats {
        return Object.freeze({
            entries: this.entries.size,
            hits: this.hits,
            misses: this.misses,
            expirations: this.expirations,
            evictions: this.evictions,
        });
    }
}
