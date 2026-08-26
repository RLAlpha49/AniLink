import { describe, expect, test } from "vitest";
import {
    fetchWithLookAhead,
    type LookAheadEntry,
    type LookAheadResult,
} from "../src/base/pagination";

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
            start: { items: ["a"], hasMore: true, nextKey: "cursor-1" },
            "cursor-1": { items: ["b"], hasMore: true, nextKey: "cursor-2" },
            "cursor-2": { items: ["c"], hasMore: false },
        };

        const result = await fetchWithLookAhead<LookAheadEntry, string>(
            async (key) => {
                requestedKeys.push(key);
                return pages[String(key)] ?? { items: [], hasMore: false };
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
    });

    test("numeric keys keep the existing page-number behavior", async () => {
        const requestedKeys: number[] = [];
        const result = await fetchWithLookAhead<LookAheadEntry, number>(
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
                return { items: ["x"], hasMore: false, nextKey: "never" };
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
        const result = await fetchWithLookAhead<{ n: number; more: boolean }>(
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

describe("fetchWithLookAhead result shape", () => {
    test("returns LookAheadResult with responses, count, truncated", async () => {
        const result: LookAheadResult<LookAheadEntry> = await fetchWithLookAhead<
            LookAheadEntry,
            number
        >(
            async (key) => ({ items: [key], hasMore: false }),
            (response) => response.hasMore,
            undefined,
            0,
            5,
            2
        );

        expect(Object.keys(result).sort()).toEqual(["count", "responses", "truncated"]);
    });
});
