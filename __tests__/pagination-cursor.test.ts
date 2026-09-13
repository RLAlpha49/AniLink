import { describe, expect, test } from "vitest";
import { fetchCursorChain, fetchWithLookAhead } from "../src/base/pagination";

/**
 * The fixture page shape these tests fetch: a cursor page carrying items, a
 * has-more flag, and the next cursor key. `nextKey` is required on the type
 * (the driver's next-key extractor returns it); the {@link page} factory
 * defaults it to `""` so terminal pages never need to spell one out.
 */
interface LookAheadEntry {
    items: string[];
    hasMore: boolean;
    nextKey: string;
}

/** A fixture page with the next key defaulted for terminal entries. */
const page = (
    entry: Omit<LookAheadEntry, "nextKey"> & Partial<Pick<LookAheadEntry, "nextKey">>
): LookAheadEntry => ({
    nextKey: "",
    ...entry,
});

/**
 * Cursor-aware look-ahead driver suite.
 *
 * The shared pagination core must serve providers whose paging key is an
 * opaque cursor (MyAnimeList) as well as numeric page numbers (AniList). The
 * driver therefore accepts a `nextKey` extractor: when a fetched entry
 * reports more data ahead, the next request uses the key that entry carries,
 * not `startNumber + slot`.
 */

describe("fetchWithLookAhead cursor keys", () => {
    test("uses each entry's nextKey for the following request", async () => {
        const requestedKeys: (string | number)[] = [];
        const pages: Record<string, LookAheadEntry> = {
            start: page({ items: ["a"], hasMore: true, nextKey: "cursor-1" }),
            "cursor-1": page({ items: ["b"], hasMore: true, nextKey: "cursor-2" }),
            "cursor-2": page({ items: ["c"], hasMore: false }),
        };

        const result = await fetchWithLookAhead<LookAheadEntry, string>(
            async (key) => {
                requestedKeys.push(key);
                return pages[String(key)] ?? page({ items: [], hasMore: false });
            },
            (response) => response.hasMore,
            (response) => response.nextKey,
            "start",
            10,
            2
        );

        expect(requestedKeys).toEqual(["start", "cursor-1", "cursor-2"]);
        expect(result.responses.map((r) => r.items)).toEqual([["a"], ["b"], ["c"]]);
        expect(result.count).toBe(3);
        expect(result.truncated).toBe(false);
        // The public result carries exactly these members — no extra keys
        // leak onto the shape consumers destructure.
        expect(Object.keys(result).sort()).toEqual(["count", "responses", "truncated"]);
    });

    test("numeric keys keep the existing page-number behavior", async () => {
        const requestedKeys: number[] = [];
        // The numeric-key variant carries number keys, so it gets its own
        // entry shape rather than reusing the string-key fixture type.
        const result = await fetchWithLookAhead<
            { items: number[]; hasMore: boolean; nextKey: number },
            number
        >(
            async (key) => {
                requestedKeys.push(key);
                return {
                    items: [key],
                    hasMore: key < 3,
                    nextKey: key + 1,
                };
            },
            (response) => response.hasMore,
            (response) => response.nextKey,
            1,
            10,
            3
        );

        expect(requestedKeys).toEqual([1, 2, 3]);
        expect(result.count).toBe(3);
        expect(result.truncated).toBe(false);
    });

    test("does not schedule past a terminal entry even with a nextKey present", async () => {
        const requestedKeys: string[] = [];
        const result = await fetchWithLookAhead<LookAheadEntry, string>(
            async (key) => {
                requestedKeys.push(String(key));
                // Terminal entry still carries a stale nextKey; the driver
                // must ignore it once hasMore is false.
                return page({ items: ["x"], hasMore: false, nextKey: "never" });
            },
            (response) => response.hasMore,
            (response) => response.nextKey,
            "first",
            10,
            4
        );

        expect(result.count).toBe(1);
        expect(requestedKeys).toEqual(["first"]);
    });
});

describe("fetchWithLookAhead legacy numeric contract", () => {
    test("without extractNextKey, advances by slot arithmetic from startNumber", async () => {
        const requestedKeys: number[] = [];
        // The legacy call shape routes through the cursor overload with an
        // explicit `undefined` extractor; the implementation then falls back
        // to numeric slot arithmetic from the first key.
        const result = await fetchWithLookAhead<{ n: number; more: boolean }, number>(
            async (key) => {
                requestedKeys.push(key);
                return { n: key, more: key < 3 };
            },
            (response) => response.more,
            undefined,
            1,
            10,
            2
        );

        expect(requestedKeys).toEqual([1, 2, 3, 4]);
        expect((result.responses as Array<{ n: number }>).map((r) => r.n)).toEqual([1, 2, 3]);
    });
});

describe("fetchCursorChain (direct)", () => {
    test("returns the two-page cursor-chain contract for both call shapes", async () => {
        const pages: Record<string, LookAheadEntry> = {
            start: page({ items: ["a"], hasMore: true, nextKey: "cursor-1" }),
            "cursor-1": page({ items: ["b"], hasMore: false }),
        };
        const requestedKeys: string[] = [];

        const viaLegacy = await fetchWithLookAhead<LookAheadEntry, string>(
            async (key) => {
                requestedKeys.push(key);
                return pages[String(key)] ?? page({ items: [], hasMore: false });
            },
            (response) => response.hasMore,
            (response) => response.nextKey,
            "start",
            10,
            2
        );
        const viaDirect = await fetchCursorChain(
            async (key) => pages[String(key)] ?? page({ items: [], hasMore: false }),
            (response) => response.hasMore,
            (response) => response.nextKey,
            "start",
            10
        );

        expect(requestedKeys).toEqual(["start", "cursor-1"]);
        // Both call shapes are asserted against the explicit two-page
        // contract — the start page, the terminal cursor-1 page, and no
        // truncation — rather than against each other, so a shared
        // regression cannot hide behind the comparison.
        const expected = {
            responses: [
                page({ items: ["a"], hasMore: true, nextKey: "cursor-1" }),
                page({ items: ["b"], hasMore: false }),
            ],
            count: 2,
            truncated: false,
        };
        expect(viaLegacy).toEqual(expected);
        expect(viaDirect).toEqual(expected);
    });
});
