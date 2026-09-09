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
});
