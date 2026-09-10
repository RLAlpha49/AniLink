/**
 * Opt-in in-memory TTL response cache for read-heavy traversals.
 *
 * The cache is keyed by `(method, url, serialized body)` and capped by
 * `maxEntries`. It is opt-in (off by default) and never caches mutations
 * (`POST`/`PUT`/`DELETE`). Cache hits are observable through the existing
 * `onResponse` hook via a `cacheHit` flag so consumers can distinguish a
 * cached response from a network round-trip.
 */

import { createHash } from "node:crypto";

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
 * Configuration for the opt-in response cache.
 */
export interface ResponseCacheOptions {
    /** The time-to-live for cached entries, in milliseconds. Defaults to 60_000 (1 minute). */
    ttlMs?: number;
    /** The maximum number of entries to retain. Defaults to 128. Entries are evicted LRU when the cap is reached. */
    maxEntries?: number;
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
     * The serialized body is SHA-256 hashed (truncated to 16 hex chars)
     * before it enters the key, so a credential-bearing GET body is never
     * duplicated into the key string in plaintext — the key map retains
     * entries for up to the TTL, outliving the error paths the rest of the
     * library scrubs. The hash is deterministic, so equal bodies still share
     * one entry and different bodies still get different entries.
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
    get<T>(method: string, url: string, data?: object | string, authKey?: string): T | undefined {
        const key = ResponseCache.buildKey(method, url, data, authKey);
        const entry = this.entries.get(key);
        if (entry === undefined) {
            return undefined;
        }
        if (Date.now() >= entry.expiresAt) {
            this.entries.delete(key);
            return undefined;
        }
        // Refresh recency: delete + re-insert moves the entry to the end.
        this.entries.delete(key);
        this.entries.set(key, entry);
        return structuredClone(entry.data) as T;
    }

    /**
     * Stores a response in the cache, evicting the LRU entry when the cap is
     * reached. Only `GET` responses are cached; other methods are no-ops.
     * The value is deep-copied on write; the cache never aliases the
     * caller's object.
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
        if (method !== "GET") return;
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
    delete(method: string, url: string, data?: object | string, authKey?: string): boolean {
        if (method !== "GET") return false;
        const key = ResponseCache.buildKey(method, url, data, authKey);
        return this.entries.delete(key);
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
        }
    }

    /**
     * Clears all cached entries.
     */
    clear(): void {
        this.entries.clear();
    }
}
