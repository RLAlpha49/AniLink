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

    test("does not cache mutation or non-read responses", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        // A GraphQL mutation document: excluded by design.
        cache.set(
            "POST",
            "https://example.com/api",
            { query: "mutation { SaveMediaListEntry { id } }" },
            undefined,
            { id: 1 }
        );
        expect(
            cache.get("POST", "https://example.com/api", {
                query: "mutation { SaveMediaListEntry { id } }",
            })
        ).toBeUndefined();
        // A REST POST body (no GraphQL query document): excluded.
        cache.set("POST", "https://example.com/api", { title: "write" }, undefined, { id: 2 });
        expect(cache.get("POST", "https://example.com/api", { title: "write" })).toBeUndefined();
        // PUT and DELETE: excluded.
        cache.set("PUT", "https://example.com/api", undefined, undefined, { id: 3 });
        cache.set("DELETE", "https://example.com/api", undefined, undefined, { id: 4 });
        expect(cache.get("PUT", "https://example.com/api")).toBeUndefined();
        expect(cache.get("DELETE", "https://example.com/api")).toBeUndefined();
    });

    test("caches GraphQL query documents dispatched as POST", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const body = { query: "query ($id: Int) { Media (id: $id) { id } }", variables: { id: 1 } };
        cache.set("POST", "https://graphql.anilist.co", body, undefined, { Media: { id: 1 } });
        expect(cache.get("POST", "https://graphql.anilist.co", body)).toEqual({ Media: { id: 1 } });
    });

    test("caches anonymous shorthand GraphQL selections dispatched as POST", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const body = { query: "{ Viewer { id } }" };
        cache.set("POST", "https://graphql.anilist.co", body, undefined, { Viewer: { id: 1 } });
        expect(cache.get("POST", "https://graphql.anilist.co", body)).toEqual({
            Viewer: { id: 1 },
        });
    });

    test("caches a GraphQL query document that opens with a comment", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const body = { query: "# fetch viewer\nquery { Viewer { id } }" };
        cache.set("POST", "https://graphql.anilist.co", body, undefined, { Viewer: { id: 1 } });
        expect(cache.get("POST", "https://graphql.anilist.co", body)).toEqual({
            Viewer: { id: 1 },
        });
    });

    test("keys GraphQL query entries by the full document and variables", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set(
            "POST",
            "https://graphql.anilist.co",
            { query: "query { Media (id: 1) { id } }" },
            undefined,
            1
        );
        // Different document: separate entry.
        expect(
            cache.get("POST", "https://graphql.anilist.co", {
                query: "query { Media (id: 1) { id title } }",
            })
        ).toBeUndefined();
        // Same document, different variables: separate entry.
        cache.set(
            "POST",
            "https://graphql.anilist.co",
            { query: "query ($id: Int) { Media (id: $id) { id } }", variables: { id: 1 } },
            undefined,
            2
        );
        expect(
            cache.get("POST", "https://graphql.anilist.co", {
                query: "query ($id: Int) { Media (id: $id) { id } }",
                variables: { id: 2 },
            })
        ).toBeUndefined();
        expect(
            cache.get("POST", "https://graphql.anilist.co", {
                query: "query ($id: Int) { Media (id: $id) { id } }",
                variables: { id: 1 },
            })
        ).toBe(2);
    });

    test("delete removes a cached GraphQL query entry", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const body = { query: "query { Viewer { id } }" };
        cache.set("POST", "https://graphql.anilist.co", body, undefined, { Viewer: { id: 1 } });
        expect(cache.delete("POST", "https://graphql.anilist.co", body)).toBe(true);
        expect(cache.get("POST", "https://graphql.anilist.co", body)).toBeUndefined();
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
        // Same URL, different cacheable read shapes: separate entries.
        cache.set("GET", "https://example.com/api", undefined, undefined, 1);
        cache.set(
            "POST",
            "https://example.com/api",
            { query: "query { Viewer { id } }" },
            undefined,
            2
        );
        // Same URL and method, different body: separate entries.
        cache.set("GET", "https://example.com/api", { page: 1 }, undefined, 3);
        cache.set("GET", "https://example.com/api", { page: 2 }, undefined, 4);

        expect(cache.get("GET", "https://example.com/api")).toBe(1);
        expect(
            cache.get("POST", "https://example.com/api", { query: "query { Viewer { id } }" })
        ).toBe(2);
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

    test("ttlMs of 0 disables retention entirely: set is a no-op and get is a miss", () => {
        const cache = new ResponseCache({ ttlMs: 0 });

        cache.set("GET", "https://example.com/api", undefined, undefined, { id: 1 });

        // The explicit "do not retain" configuration must be honored: no
        // already-expired entry is stored, so every read is a miss.
        expect(cache.get("GET", "https://example.com/api")).toBeUndefined();
    });

    test("canonicalizes query parameter order so the same resource shares one entry", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });

        cache.set("GET", "https://example.com/api?a=1&b=2", undefined, undefined, { id: 1 });

        // Same resource, different parameter order: one shared entry.
        expect(cache.get("GET", "https://example.com/api?b=2&a=1")).toEqual({ id: 1 });
        // A different resource still misses.
        expect(cache.get("GET", "https://example.com/api?a=1&b=3")).toBeUndefined();
    });

    test("does not mistake a question mark inside a fragment for the query delimiter", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });

        cache.set("GET", "https://example.com/api#frag?x=1", undefined, undefined, { id: 1 });

        // The `?` lives inside the fragment, so there is no query string to
        // sort: both spellings key identically and hit the same entry.
        expect(cache.get("GET", "https://example.com/api#frag?x=1")).toEqual({ id: 1 });
        // A URL with a real query string is a different key.
        expect(cache.get("GET", "https://example.com/api?x=1#frag")).toBeUndefined();
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

    test("cloneOnRead: false returns the cached object itself without copying", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, cloneOnRead: false });
        const original = { id: 1, nested: { value: "a" }, list: [1, 2] };
        cache.set("GET", "https://example.com/api", undefined, undefined, original);

        const first = cache.get<{ id: number; nested: { value: string }; list: number[] }>(
            "GET",
            "https://example.com/api"
        )!;
        const second = cache.get<{ id: number; nested: { value: string }; list: number[] }>(
            "GET",
            "https://example.com/api"
        )!;

        // Both reads observe the same cached object: no per-hit clone.
        expect(first).toBe(second);
        // The cached copy is still isolated from the caller's original: the
        // write-side clone in set() is unaffected by the read-side opt-out.
        expect(first).not.toBe(original);
        expect(first).toEqual(original);
    });

    test("cloneOnRead: false makes caller mutations observable on later hits", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, cloneOnRead: false });
        cache.set("GET", "https://example.com/api", undefined, undefined, {
            id: 1,
            nested: { value: "a" },
        });

        const first = cache.get<{ id: number; nested: { value: string } }>(
            "GET",
            "https://example.com/api"
        )!;
        first.id = 999;
        first.nested.value = "poisoned";

        // The documented trade-off: with the read-side clone disabled, a
        // mutating caller poisons later hits — this is the behavior opting
        // in to cloneOnRead: false accepts.
        const second = cache.get<{ id: number; nested: { value: string } }>(
            "GET",
            "https://example.com/api"
        )!;
        expect(second.id).toBe(999);
        expect(second.nested.value).toBe("poisoned");
    });

    test("cloneOnRead: false still isolates the cache from the caller's original object", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, cloneOnRead: false });
        const original = { id: 1, nested: { value: "a" } };
        cache.set("GET", "https://example.com/api", undefined, undefined, original);

        // Mutating the object handed to set() must not poison the cache: the
        // write-side clone stays on regardless of the read-side opt-out.
        original.id = 999;
        original.nested.value = "poisoned";

        const read = cache.get<{ id: number; nested: { value: string } }>(
            "GET",
            "https://example.com/api"
        )!;
        expect(read).toEqual({ id: 1, nested: { value: "a" } });
    });

    test("cloneOnRead defaults to true, preserving the mutation-safety guarantee", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/api", undefined, undefined, { id: 1 });

        const first = cache.get<{ id: number }>("GET", "https://example.com/api")!;
        const second = cache.get<{ id: number }>("GET", "https://example.com/api")!;

        // Default configuration: each read is a fresh clone.
        expect(first).not.toBe(second);
        expect(first).toEqual(second);
    });

    test("rejects non-boolean cloneOnRead", () => {
        expect(() => new ResponseCache({ cloneOnRead: 1 as unknown as boolean })).toThrow(
            TypeError
        );
        expect(() => new ResponseCache({ cloneOnRead: "true" as unknown as boolean })).toThrow(
            TypeError
        );
        expect(() => new ResponseCache({ cloneOnRead: undefined })).not.toThrow();
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

    test("delete ignores mutation and non-read methods (no-op)", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        expect(cache.delete("POST", "https://example.com/a")).toBe(false);
        expect(
            cache.delete("POST", "https://example.com/a", {
                query: "mutation { SaveMediaListEntry { id } }",
            })
        ).toBe(false);
        expect(cache.delete("PUT", "https://example.com/a")).toBe(false);
    });

    test("deleteMatching drops cached reads of the prefixed resource across query strings", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21?fields=a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/anime/21?fields=b", undefined, undefined, 2);
        cache.set("GET", "https://example.com/anime/42", undefined, undefined, 3);

        const removed = cache.deleteMatching("https://example.com/anime/21");

        expect(removed).toBe(2);
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toBeUndefined();
        expect(cache.get("GET", "https://example.com/anime/21?fields=b")).toBeUndefined();
        // The unrelated resource is untouched.
        expect(cache.get("GET", "https://example.com/anime/42")).toBe(3);
    });

    test("deleteMatching is boundary-aware so sibling ids are not swallowed", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/212", undefined, undefined, 1);
        cache.set("GET", "https://example.com/anime/21/sub", undefined, undefined, 2);
        cache.set("GET", "https://example.com/anime/21", undefined, undefined, 3);

        const removed = cache.deleteMatching("https://example.com/anime/21");

        // The exact resource and its child paths go; /anime/212 stays.
        expect(removed).toBe(2);
        expect(cache.get("GET", "https://example.com/anime/212")).toBe(1);
        expect(cache.get("GET", "https://example.com/anime/21/sub")).toBeUndefined();
        expect(cache.get("GET", "https://example.com/anime/21")).toBeUndefined();
    });

    test("deleteMatching spans auth namespaces", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21", undefined, "bearer:token-a", 1);
        cache.set("GET", "https://example.com/anime/21", undefined, "bearer:token-b", 2);
        cache.set("GET", "https://example.com/anime/21", undefined, "none", 3);

        const removed = cache.deleteMatching("https://example.com/anime/21");

        expect(removed).toBe(3);
        expect(
            cache.get("GET", "https://example.com/anime/21", undefined, "bearer:token-a")
        ).toBeUndefined();
        expect(
            cache.get("GET", "https://example.com/anime/21", undefined, "bearer:token-b")
        ).toBeUndefined();
        expect(cache.get("GET", "https://example.com/anime/21", undefined, "none")).toBeUndefined();
    });

    test("deleteMatching ignores the prefix's own query string and fragment", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21?fields=a", undefined, undefined, 1);

        // Callers can pass the full read URL; the prefix is the base path.
        const removed = cache.deleteMatching("https://example.com/anime/21?fields=z#frag");

        expect(removed).toBe(1);
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toBeUndefined();
    });

    test("deleteMatching drops a fragment-bearing cached URL", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21#frag", undefined, undefined, 1);

        const removed = cache.deleteMatching("https://example.com/anime/21");

        expect(removed).toBe(1);
        expect(cache.get("GET", "https://example.com/anime/21#frag")).toBeUndefined();
    });

    test("deleteMatching returns 0 when nothing matches", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/42", undefined, undefined, 1);

        expect(cache.deleteMatching("https://example.com/anime/21")).toBe(0);
        expect(cache.get("GET", "https://example.com/anime/42")).toBe(1);
    });

    test("deleteAllForUrl drops every cached read keyed at a URL, GraphQL POST entries included", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        // GraphQL query entries at the endpoint, across documents, variables,
        // and auth namespaces.
        cache.set(
            "POST",
            "https://graphql.anilist.co",
            { query: "query { Media (id: 1) { id } }" },
            "bearer:token-a",
            1
        );
        cache.set(
            "POST",
            "https://graphql.anilist.co",
            { query: "query { Viewer { id } }" },
            "bearer:token-b",
            2
        );
        // A GET entry at a different URL stays untouched.
        cache.set("GET", "https://api.myanimelist.net/v2/anime/21", undefined, undefined, 3);

        const removed = cache.deleteAllForUrl("https://graphql.anilist.co");

        expect(removed).toBe(2);
        expect(
            cache.get(
                "POST",
                "https://graphql.anilist.co",
                { query: "query { Media (id: 1) { id } }" },
                "bearer:token-a"
            )
        ).toBeUndefined();
        expect(
            cache.get(
                "POST",
                "https://graphql.anilist.co",
                { query: "query { Viewer { id } }" },
                "bearer:token-b"
            )
        ).toBeUndefined();
        expect(cache.get("GET", "https://api.myanimelist.net/v2/anime/21")).toBe(3);
    });

    test("deleteAllForUrl ignores the URL's query string and fragment", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21?fields=a", undefined, undefined, 1);

        const removed = cache.deleteAllForUrl("https://example.com/anime/21?fields=z#frag");

        expect(removed).toBe(1);
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toBeUndefined();
    });

    test("deleteAllForUrl returns 0 when nothing matches", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/42", undefined, undefined, 1);

        expect(cache.deleteAllForUrl("https://example.com/anime/21")).toBe(0);
        expect(cache.get("GET", "https://example.com/anime/42")).toBe(1);
    });

    test("deleteAllForUrl drops GET entries at the URL too, not only GraphQL POST entries", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/anime/21?fields=a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/anime/21?fields=b", undefined, "none", 2);

        const removed = cache.deleteAllForUrl("https://example.com/anime/21");

        expect(removed).toBe(2);
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toBeUndefined();
        expect(
            cache.get("GET", "https://example.com/anime/21?fields=b", undefined, "none")
        ).toBeUndefined();
    });

    test("a read that started before an invalidation does not re-cache its stale response", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        // Capture the generation the read would have observed.
        const generationAtRead = cache.getGeneration();
        // A mutation lands while the read is in flight.
        cache.deleteMatching("https://example.com/anime/21");
        // The read completes and tries to store its (now stale) response.
        cache.setIfFresh(
            "GET",
            "https://example.com/anime/21?fields=a",
            undefined,
            undefined,
            generationAtRead,
            { stale: true }
        );
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toBeUndefined();
    });

    test("a read whose generation still matches stores its response", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const generationAtRead = cache.getGeneration();
        cache.setIfFresh(
            "GET",
            "https://example.com/anime/21?fields=a",
            undefined,
            undefined,
            generationAtRead,
            { fresh: true }
        );
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toEqual({ fresh: true });
    });

    test("clear bumps the generation so an in-flight read does not re-cache after it", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const generationAtRead = cache.getGeneration();
        cache.clear();
        cache.setIfFresh(
            "GET",
            "https://example.com/anime/21",
            undefined,
            undefined,
            generationAtRead,
            { stale: true }
        );
        expect(cache.get("GET", "https://example.com/anime/21")).toBeUndefined();
    });

    test("deleteAllForUrl bumps the generation so an in-flight read does not re-cache after it", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const generationAtRead = cache.getGeneration();
        cache.deleteAllForUrl("https://graphql.anilist.co");
        cache.setIfFresh(
            "POST",
            "https://graphql.anilist.co",
            { query: "query { Viewer { id } }" },
            undefined,
            generationAtRead,
            { stale: true }
        );
        expect(
            cache.get("POST", "https://graphql.anilist.co", { query: "query { Viewer { id } }" })
        ).toBeUndefined();
    });

    test("an invalidation of one resource does not drop another resource's in-flight write-back", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        // A read of /anime/21 misses and captures the generation.
        const generationAtRead = cache.getGeneration();
        // An invalidation of a different resource lands while the read is
        // in flight: it must not discard /anime/21's fresh write-back.
        cache.deleteMatching("https://example.com/anime/42");
        cache.setIfFresh(
            "GET",
            "https://example.com/anime/21?fields=a",
            undefined,
            undefined,
            generationAtRead,
            { fresh: true }
        );
        expect(cache.get("GET", "https://example.com/anime/21?fields=a")).toEqual({
            fresh: true,
        });
    });

    test("an endpoint invalidation does not drop another URL's in-flight write-back", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const generationAtRead = cache.getGeneration();
        cache.deleteAllForUrl("https://graphql.anilist.co");
        cache.setIfFresh(
            "GET",
            "https://api.myanimelist.net/v2/anime/21",
            undefined,
            undefined,
            generationAtRead,
            { fresh: true }
        );
        expect(cache.get("GET", "https://api.myanimelist.net/v2/anime/21")).toEqual({
            fresh: true,
        });
    });

    test("an exact-key delete does not drop a different key's in-flight write-back", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        const generationAtRead = cache.getGeneration();
        cache.delete("GET", "https://example.com/anime/21?fields=a", undefined, undefined);
        cache.setIfFresh(
            "GET",
            "https://example.com/anime/21?fields=b",
            undefined,
            undefined,
            generationAtRead,
            { fresh: true }
        );
        expect(cache.get("GET", "https://example.com/anime/21?fields=b")).toEqual({
            fresh: true,
        });
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

    test("stats starts zeroed on a fresh cache", () => {
        const cache = new ResponseCache();
        expect(cache.stats()).toEqual({
            entries: 0,
            hits: 0,
            misses: 0,
            expirations: 0,
            evictions: 0,
        });
    });

    test("stats counts hits and misses across get calls", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);

        cache.get("GET", "https://example.com/a"); // hit
        cache.get("GET", "https://example.com/missing"); // miss
        cache.get("GET", "https://example.com/a"); // hit

        expect(cache.stats()).toEqual({
            entries: 1,
            hits: 2,
            misses: 1,
            expirations: 0,
            evictions: 0,
        });
    });

    test("stats counts an expired-on-read entry as an expiration, not a miss", () => {
        const cache = new ResponseCache({ ttlMs: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // The expired entry is evicted on read and counted as an
                // expiration; hits + misses + expirations partition every
                // get() call, so this read is not also a miss.
                expect(cache.get("GET", "https://example.com/a")).toBeUndefined();
                expect(cache.stats()).toEqual({
                    entries: 0,
                    hits: 0,
                    misses: 0,
                    expirations: 1,
                    evictions: 0,
                });
                resolve();
            }, 10);
        });
    });

    test("stats counts evictions under maxEntries pressure", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 2 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/b", undefined, undefined, 2);
        // The cap is reached: inserting "c" evicts the LRU entry ("a").
        cache.set("GET", "https://example.com/c", undefined, undefined, 3);

        expect(cache.stats()).toEqual({
            entries: 2,
            hits: 0,
            misses: 0,
            expirations: 0,
            evictions: 1,
        });
    });

    test("stats does not count an in-place key update as an eviction", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        // Re-writing the same key refreshes it in place: no eviction.
        cache.set("GET", "https://example.com/a", undefined, undefined, 2);

        expect(cache.stats()).toEqual({
            entries: 1,
            hits: 0,
            misses: 0,
            expirations: 0,
            evictions: 0,
        });
    });

    test("stats keeps entries accurate across delete and clear without touching counters", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.set("GET", "https://example.com/b", undefined, undefined, 2);
        cache.get("GET", "https://example.com/a"); // one hit

        // delete drops an entry but increments no counter.
        cache.delete("GET", "https://example.com/a");
        expect(cache.stats()).toEqual({
            entries: 1,
            hits: 1,
            misses: 0,
            expirations: 0,
            evictions: 0,
        });

        // clear drops the rest, counters untouched.
        cache.clear();
        expect(cache.stats()).toEqual({
            entries: 0,
            hits: 1,
            misses: 0,
            expirations: 0,
            evictions: 0,
        });
    });

    test("stats counts write-time sweep expirations for never-re-read entries", () => {
        const cache = new ResponseCache({ ttlMs: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                // The opportunistic purge inside set() drops the expired
                // "a" entry even though nothing read it: an expiration.
                cache.set("GET", "https://example.com/b", undefined, undefined, 2);
                expect(cache.stats()).toEqual({
                    entries: 1,
                    hits: 0,
                    misses: 0,
                    expirations: 1,
                    evictions: 0,
                });
                resolve();
            }, 10);
        });
    });

    test("stats returns a frozen read-only snapshot", () => {
        const cache = new ResponseCache({ ttlMs: 10_000 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);

        const snapshot = cache.stats();
        expect(Object.isFrozen(snapshot)).toBe(true);
        // Mutating the snapshot must neither throw silently through the
        // cache nor corrupt later snapshots (frozen in strict mode).
        expect(() => {
            (snapshot as { hits: number }).hits = 999;
        }).toThrow(TypeError);
        expect(cache.stats().hits).toBe(0);
    });

    test("stats counters are cumulative for the cache instance's lifetime", () => {
        const cache = new ResponseCache({ ttlMs: 10_000, maxEntries: 1 });
        cache.set("GET", "https://example.com/a", undefined, undefined, 1);
        cache.get("GET", "https://example.com/a"); // hit
        cache.get("GET", "https://example.com/missing"); // miss
        cache.set("GET", "https://example.com/b", undefined, undefined, 2); // evicts "a"
        cache.clear();

        // clear() resets entries but never the lifetime counters.
        expect(cache.stats()).toEqual({
            entries: 0,
            hits: 1,
            misses: 1,
            expirations: 0,
            evictions: 1,
        });
    });
});
