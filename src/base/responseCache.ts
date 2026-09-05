/**
 * Opt-in in-memory TTL response cache for read-heavy traversals.
 *
 * The cache is keyed by `(method, url, serialized body)` and capped by
 * `maxEntries`. It is opt-in (off by default) and never caches mutations
 * (`POST`/`PUT`/`DELETE`). Cache hits are observable through the existing
 * `onResponse` hook via a `cacheHit` flag so consumers can distinguish a
 * cached response from a network round-trip.
 */

/**
 * A single cached response entry.
 */
interface CacheEntry<T> {
    /** The cached response body. */
    data: T;
    /** The epoch millisecond at which the entry expires. */
    expiresAt: number;
    /** LRU recency stamp; the entry with the smallest value is evicted. */
    lastUsed: number;
}

/**
 * Configuration for the opt-in response cache.
 */
export interface ResponseCacheOptions {
    /** The time-to-live for cached entries, in milliseconds. Defaults to 60_000 (1 minute). */
    ttlMs?: number;
    /** The maximum number of entries to retain. Defaults to 128. Entries are evicted LRU when the cap is reached. */
    maxEntries?: number;
}

/**
 * An in-memory TTL response cache with an LRU eviction cap.
 *
 * The cache is per-instance (one per `AniLink` client when enabled) so cache
 * state never leaks across clients. Entries expire after `ttlMs` and the
 * cache is capped at `maxEntries` with least-recently-used eviction.
 *
 * **Aliasing:** values returned from {@link ResponseCache.get} are deep
 * clones of the cached entry, so a caller that mutates the returned object
 * cannot corrupt the cached copy or affect subsequent reads.
 *
 * **Invalidation:** the cache is TTL-only. Mutations (`POST`/`PUT`/`DELETE`)
 * sent through the same client do not invalidate cached `GET` responses, so
 * a read-after-write sequence can return stale data for up to `ttlMs`. Use
 * {@link ResponseCache.delete} for targeted invalidation, or
 * {@link ResponseCache.clear} to drop everything. Keep `ttlMs` short for
 * read-after-write-sensitive workloads.
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
    /** Monotonic counter for LRU ordering, immune to same-millisecond ties. */
    private lruCounter = 0;

    /**
     * Creates a response cache.
     *
     * @param options - Cache configuration; `ttlMs` defaults to 60_000, `maxEntries` to 128.
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
    }

    /**
     * Builds the cache key for a request.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @returns The cache key.
     */
    private static buildKey(method: string, url: string, data?: object, authKey?: string): string {
        const body = data === undefined ? "" : JSON.stringify(data);
        return `${method}:${url}:${body}:${authKey ?? "none"}`;
    }

    /**
     * Reads a cached response for the given request, or `undefined` when the
     * entry is absent or expired. Expired entries are evicted on read. The
     * returned value is a deep clone of the cached entry, so a caller that
     * mutates it cannot corrupt the cached copy or affect subsequent reads.
     *
     * @param method - The HTTP method.
     * @param url - The request URL.
     * @param data - The request body, when present.
     * @param authKey - An authentication-safe credential identity, so cached
     * responses never cross bearer-token identities.
     * @returns A deep clone of the cached response body, or `undefined`.
     */
    get<T>(method: string, url: string, data?: object, authKey?: string): T | undefined {
        const key = ResponseCache.buildKey(method, url, data, authKey);
        const entry = this.entries.get(key);
        if (entry === undefined) {
            return undefined;
        }
        if (Date.now() >= entry.expiresAt) {
            this.entries.delete(key);
            return undefined;
        }
        entry.lastUsed = ++this.lruCounter;
        return structuredClone(entry.data) as T;
    }

    /**
     * Stores a response in the cache, evicting the LRU entry when the cap is
     * reached. Only `GET` responses are cached; other methods are no-ops.
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
        data: object | undefined,
        authKey: string | undefined,
        response: T
    ): void {
        if (method !== "GET") return;
        const key = ResponseCache.buildKey(method, url, data, authKey);
        if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
            this.evictLru();
        }
        this.entries.set(key, {
            data: response,
            expiresAt: Date.now() + this.ttlMs,
            lastUsed: ++this.lruCounter,
        });
    }

    /**
     * Removes the cached entry for the given request, if present. Use this
     * for targeted invalidation after a mutation that changes the resource
     * (for example a `POST` that updates the entity a cached `GET` returned).
     * Only `GET` entries are tracked, so non-`GET` methods are a no-op and
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
    delete(method: string, url: string, data?: object, authKey?: string): boolean {
        if (method !== "GET") return false;
        const key = ResponseCache.buildKey(method, url, data, authKey);
        return this.entries.delete(key);
    }

    /**
     * Evicts the least-recently-used entry.
     */
    private evictLru(): void {
        let oldestKey: string | undefined;
        let oldestStamp = Infinity;
        for (const [key, entry] of this.entries) {
            if (entry.lastUsed < oldestStamp) {
                oldestStamp = entry.lastUsed;
                oldestKey = key;
            }
        }
        if (oldestKey !== undefined) {
            this.entries.delete(oldestKey);
        }
    }

    /**
     * Clears all cached entries.
     */
    clear(): void {
        this.entries.clear();
    }
}
