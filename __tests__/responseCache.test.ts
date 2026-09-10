import { describe, expect, test } from "vitest";
import { ResponseCache } from "../src/base/responseCache";

describe("ResponseCache", () => {
    test("returns undefined for a missing key", () => {
        const cache = new ResponseCache();
        expect(cache.get("GET", "https://example.com/api")).toBeUndefined();
    });

    test("stores and retrieves a GET response", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/api", undefined, undefined, { id: 1 });
        expect(cache.get("GET", "https://example.com/api")).toEqual({ id: 1 });
    });

    test("does not cache non-GET responses", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("POST", "https://example.com/api", { query: "mutation" }, undefined, { id: 1 });
        expect(cache.get("POST", "https://example.com/api", { query: "mutation" })).toBeUndefined();
    });

    test("expires entries after the TTL", () => {
        const cache = new ResponseCache({ ttlMs: 1 });
        cache.set("GET", "https://example.com/api", undefined, undefined, { id: 1 });
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                expect(cache.get("GET", "https://example.com/api")).toBeUndefined();
                resolve();
            }, 10);
        });
    });

    test("evicts the LRU entry when maxEntries is reached", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 2 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/b", undefined, undefined, 2);
        // Access "a" to make it more recently used than "b"
        cache.get("GET", "https://example.com/a");
        // Adding "c" should evict "b" (the LRU)
        cache.set("GET", "https://example.com/c", undefined, undefined, 3);
        expect(cache.get("GET", "https://example.com/a")).toBe(1);
        expect(cache.get("GET", "https://example.com/b")).toBeUndefined();
        expect(cache.get("GET", "https://example.com/c")).toBe(3);
    });

    test("distinguishes entries by method, url, and body", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        // Same URL and body, different method: separate entries.
        cache.set("GET", "https://example.com/api", undefined, undefined, 1);
        cache.set("POST", "https://example.com/api", undefined, undefined, 2);
        // Same URL and method, different body: separate entries.
        cache.set("GET", "https://example.com/api", { page: 1 }, undefined, 3);
        cache.set("GET", "https://example.com/api", { page: 2 }, undefined, 4);

        expect(cache.get("GET", "https://example.com/api")).toBe(1);
        expect(cache.get("POST", "https://example.com/api")).toBeUndefined();
        expect(cache.get("GET", "https://example.com/api", { page: 1 })).toBe(3);
        expect(cache.get("GET", "https://example.com/api", { page: 2 })).toBe(4);
    });

    test("clear removes all entries", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.clear();
        expect(cache.get("GET", "https://example.com/a")).toBeUndefined();
    });

    test("updates an existing key instead of evicting", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/a", undefined, undefined, 2);
        expect(cache.get("GET", "https://example.com/a")).toBe(2);
    });

    test("evicts the LRU entry when maxEntries is 1", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/b", undefined, undefined, 2);
        expect(cache.get("GET", "https://example.com/a")).toBeUndefined();
        expect(cache.get("GET", "https://example.com/b")).toBe(2);
    });

    test("rejects non-finite ttlMs", () => {
        expect(() => new ResponseCache({ ttlMs: NaN })).toThrow(TypeError);
        expect(() => new ResponseCache({ ttlMs: Infinity })).toThrow(TypeError);
    });

    test("rejects negative ttlMs", () => {
        expect(() => new ResponseCache({ ttlMs: -1 })).toThrow(TypeError);
    });

    test("rejects non-integer or non-positive maxEntries", () => {
        expect(() => new ResponseCache({ maxEntries: 0 })).toThrow(TypeError);
        expect(() => new ResponseCache({ maxEntries: -1 })).toThrow(TypeError);
        expect(() => new ResponseCache({ maxEntries: 2.5 })).toThrow(TypeError);
        expect(() => new ResponseCache({ maxEntries: NaN })).toThrow(TypeError);
        expect(() => new ResponseCache({ maxEntries: Infinity })).toThrow(TypeError);
    });

    test("returns a deep clone so callers cannot poison the cached entry", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const original = { id: 1, nested: { value: "a" }, list: [1, 2] };
        cache.set("GET", "https://example.com/api", undefined, undefined, original);

        const first = cache.get<{ id: number; nested: { value: string }; list: number[] }>(
            "GET",
            "https://example.com/api"
        )!;
        // Mutate the returned value.
        first.id = 999;
        first.nested.value = "poisoned";
        first.list.push(3);

        // A second read must return the pristine cached value, not the mutation.
        const second = cache.get<{ id: number; nested: { value: string }; list: number[] }>(
            "GET",
            "https://example.com/api"
        )!;
        expect(second).toEqual({ id: 1, nested: { value: "a" }, list: [1, 2] });
        expect(second).not.toBe(original);
    });

    test("delete removes a single cached entry by key", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/b", undefined, undefined, 2);

        expect(cache.delete("GET", "https://example.com/a")).toBe(true);
        expect(cache.get("GET", "https://example.com/a")).toBeUndefined();
        // The other entry is untouched.
        expect(cache.get("GET", "https://example.com/b")).toBe(2);
    });

    test("delete returns false for a missing key", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        expect(cache.delete("GET", "https://example.com/missing")).toBe(false);
    });

    test("delete ignores non-GET methods (no-op)", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        expect(cache.delete("POST", "https://example.com/a")).toBe(false);
    });

    test("scopes cached entries by auth key", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/api", undefined, "bearer:token-a", { id: 1 });
        // Same URL with a different auth key does not return the cached entry.
        expect(
            cache.get("GET", "https://example.com/api", undefined, "bearer:token-b")
        ).toBeUndefined();
        // Same auth key returns the cached entry.
        expect(cache.get("GET", "https://example.com/api", undefined, "bearer:token-a")).toEqual({
            id: 1,
        });
    });

    test("set snapshots the value so later mutation cannot poison the entry", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const payload = { list: [{ id: 1 }] };
        cache.set("GET", "https://example.test/q", undefined, "none", payload);

        payload.list[0].id = 999;

        const hit = cache.get<{ list: Array<{ id: number }> }>(
            "GET",
            "https://example.test/q",
            undefined,
            "none"
        );
        expect(hit).toEqual({ list: [{ id: 1 }] });
    });

    test("keeps the existing entry when a later write for the same key is uncloneable", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.test/q", undefined, "none", { ok: true });
        // A function value makes structuredClone throw; the failed write
        // must not drop the entry already cached under the same key.
        cache.set("GET", "https://example.test/q", undefined, "none", { bad: () => {} });

        expect(cache.get("GET", "https://example.test/q", undefined, "none")).toEqual({ ok: true });
    });

    test("does not evict an unrelated entry when the payload is uncloneable", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 1 });
        cache.set("GET", "https://example.test/a", undefined, "none", { a: 1 });
        // The uncloneable write must not evict the unrelated "a" entry.
        cache.set("GET", "https://example.test/b", undefined, "none", { bad: () => {} });

        expect(cache.get("GET", "https://example.test/a", undefined, "none")).toEqual({ a: 1 });
    });

    test("treats bodies that differ only in key order as the same request", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.test/q", { a: 1, b: 2 }, "none", { ok: true });

        const hit = cache.get("GET", "https://example.test/q", { b: 2, a: 1 }, "none");

        expect(hit).toEqual({ ok: true });
    });

    test("refreshes recency on read so the most recently used entry survives", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 2 });
        cache.set("GET", "https://example.test/a", undefined, "none", { a: 1 });
        cache.set("GET", "https://example.test/b", undefined, "none", { b: 2 });

        // Touch `a` so `b` becomes the least recently used.
        expect(cache.get("GET", "https://example.test/a", undefined, "none")).toEqual({ a: 1 });
        cache.set("GET", "https://example.test/c", undefined, "none", { c: 3 });

        expect(cache.get("GET", "https://example.test/a", undefined, "none")).toEqual({ a: 1 });
        expect(cache.get("GET", "https://example.test/b", undefined, "none")).toBeUndefined();
    });

    test("refreshes recency on write so an updated key survives the next eviction", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 2 });
        cache.set("GET", "https://example.test/a", undefined, "none", { a: 1 });
        cache.set("GET", "https://example.test/b", undefined, "none", { b: 2 });

        // Re-writing `a` must move it to the most-recent position; without
        // the delete+re-insert refresh, `a` would stay oldest and be evicted.
        cache.set("GET", "https://example.test/a", undefined, "none", { a: 9 });
        cache.set("GET", "https://example.test/c", undefined, "none", { c: 3 });

        expect(cache.get("GET", "https://example.test/a", undefined, "none")).toEqual({ a: 9 });
        expect(cache.get("GET", "https://example.test/b", undefined, "none")).toBeUndefined();
    });

    test("builds stable keys for array and nested-object bodies", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.test/q", { list: [1, 2], nested: { x: 1 } }, "none", {
            ok: true,
        });

        // Same content, different key order and array order sensitivity.
        const hit = cache.get(
            "GET",
            "https://example.test/q",
            { nested: { x: 1 }, list: [1, 2] },
            "none"
        );
        expect(hit).toEqual({ ok: true });

        // A different array order is a different request.
        const miss = cache.get(
            "GET",
            "https://example.test/q",
            { list: [2, 1], nested: { x: 1 } },
            "none"
        );
        expect(miss).toBeUndefined();
    });

    test("distinguishes bodies whose exotic values JSON.stringify differently", () => {
        // `Object.keys(new Date())` is empty, so a naive sorted-key walk
        // renders every Date as `{}`. Two bodies differing only in their
        // Date values must not share one cache entry (a wrong-answer hit).
        const cache = new ResponseCache();
        const first = { since: new Date("2024-01-01T00:00:00Z") };
        const second = { since: new Date("2025-06-01T00:00:00Z") };

        cache.set("GET", "https://example.com/api", first, undefined, { a: 1 });
        const hit = cache.get<{ a: number }>("GET", "https://example.com/api", second, undefined);

        expect(hit).toBeUndefined();
    });

    test("distinguishes class-instance bodies by their serialized form", () => {
        class Body {
            constructor(public readonly tag: string) {}
        }
        const cache = new ResponseCache();

        cache.set("GET", "https://example.com/api", new Body("one"), undefined, { a: 1 });
        const hit = cache.get<{ a: number }>(
            "GET",
            "https://example.com/api",
            new Body("two"),
            undefined
        );

        expect(hit).toBeUndefined();
    });

    test("does not embed the raw body in the cache key", () => {
        // The serialized body used to be embedded verbatim in the key string;
        // a credential-bearing GET body would then live in the key Map in
        // plaintext. The key must not contain the raw body.
        const cache = new ResponseCache();
        const secretBody = { apiToken: "raw-body-secret-value" };

        cache.set("GET", "https://example.com/api", secretBody, undefined, { a: 1 });

        const entries = (cache as unknown as { entries: Map<string, unknown> }).entries;
        const key = [...entries.keys()][0];
        expect(key).not.toContain("raw-body-secret-value");
        expect(key).not.toContain("apiToken");
    });

    test("serializes a circular body without throwing and keys it deterministically", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const circular: Record<string, unknown> = { name: "loop" };
        circular.self = circular;
        cache.set("GET", "https://example.test/q", circular, "none", { ok: true });

        const again: Record<string, unknown> = { name: "loop" };
        again.self = again;
        const hit = cache.get("GET", "https://example.test/q", again, "none");
        expect(hit).toEqual({ ok: true });
    });
});
