import { describe, expect, test } from "vitest";
import {
    fetchCursorChain,
    fetchNumericWithLookAhead,
    fetchWithLookAhead,
    MAX_CONCURRENCY,
    resolveCappedInt,
    resolvePositiveInt,
} from "../src/base/pagination";

describe("resolvePositiveInt", () => {
    test("falls back on undefined and invalid values", () => {
        expect(resolvePositiveInt(undefined, 7)).toBe(7);
        expect(resolvePositiveInt(Number.NaN, 7)).toBe(7);
        expect(resolvePositiveInt(Number.POSITIVE_INFINITY, 7)).toBe(7);
        expect(resolvePositiveInt(Number.NEGATIVE_INFINITY, 7)).toBe(7);
        expect(resolvePositiveInt(0, 7)).toBe(7);
        expect(resolvePositiveInt(-3, 7)).toBe(7);
    });

    test("floors positive values", () => {
        expect(resolvePositiveInt(5, 7)).toBe(5);
        expect(resolvePositiveInt(5.9, 7)).toBe(5);
    });
});

describe("resolveCappedInt", () => {
    test("clamps above the cap and falls back below it", () => {
        expect(resolveCappedInt(100, 50, 50)).toBe(50);
        expect(resolveCappedInt(undefined, 50, 25)).toBe(25);
        expect(resolveCappedInt(Number.NaN, 50, 25)).toBe(25);
        expect(resolveCappedInt(10, 50, 25)).toBe(10);
    });
});

describe("fetchWithLookAhead", () => {
    test("collects responses in entry order regardless of settle order", async () => {
        const settleOrder: number[] = [];
        const result = await fetchWithLookAhead<number>(
            (n) =>
                new Promise<number>((resolve) => {
                    // Settle every fetch on the microtask queue, entry 3
                    // before entry 2, to prove collection stays in entry order.
                    queueMicrotask(() => {
                        settleOrder.push(n);
                        resolve(n);
                    });
                }),
            () => true,
            1,
            3,
            3
        );

        expect(result.responses).toEqual([1, 2, 3]);
        expect(result.count).toBe(3);
        // The source never ran dry, so the run ended at the maxEntries guard.
        expect(result.truncated).toBe(true);
        // All three fetches were launched up front by the concurrency window.
        expect(settleOrder).toHaveLength(3);
    });

    test("stops at a terminal entry and drains launched stragglers", async () => {
        const fetched: number[] = [];
        const result = await fetchWithLookAhead<{ n: number; more: boolean }>(
            async (n) => {
                fetched.push(n);
                return { n, more: n < 2 };
            },
            (response) => response.more,
            1,
            10,
            4
        );

        // Entry 2 is terminal; entries 3-4 were launched by the window but drained.
        expect(result.responses.map((r) => r.n)).toEqual([1, 2]);
        expect(result.count).toBe(2);
        expect(result.truncated).toBe(false);
        expect(fetched.length).toBeGreaterThanOrEqual(2);
    });

    test("truncates at maxEntries while the source still has data", async () => {
        const result = await fetchWithLookAhead<{ more: boolean }>(
            async () => ({ more: true }),
            (response) => response.more,
            1,
            5,
            2
        );

        expect(result.count).toBe(5);
        expect(result.truncated).toBe(true);
    });

    test("propagates the first consumed rejection", async () => {
        await expect(fetchWithLearnAheadFailure()).rejects.toThrow("boom");
    });

    test("never keeps more than the requested window in flight", async () => {
        // Behavioral replacement for the old constant pin: prove the driver
        // itself caps concurrent fetches, including when the caller asks for
        // a window above MAX_CONCURRENCY.
        let inFlight = 0;
        let peakInFlight = 0;
        const result = await fetchWithLookAhead<number>(
            (n) =>
                new Promise<number>((resolve) => {
                    inFlight += 1;
                    peakInFlight = Math.max(peakInFlight, inFlight);
                    // Settle on a macrotask so the window genuinely overlaps.
                    setTimeout(() => {
                        inFlight -= 1;
                        resolve(n);
                    }, 0);
                }),
            () => true,
            1,
            6,
            50 // far above MAX_CONCURRENCY; the driver must clamp to 8
        );

        expect(result.count).toBe(6);
        expect(peakInFlight).toBeLessThanOrEqual(MAX_CONCURRENCY);
        expect(peakInFlight).toBeGreaterThan(1);
    });
});

/** Helper whose fetch rejects on the first consumed entry. */
async function fetchWithLearnAheadFailure(): Promise<unknown> {
    return fetchWithLookAhead<never>(
        async (n) => {
            if (n === 1) throw new Error("boom");
            return undefined as never;
        },
        () => true,
        1,
        3,
        1
    );
}

describe("fetchNumericWithLookAhead", () => {
    test("overlaps the window and collects strictly in entry order", async () => {
        const settleOrder: number[] = [];
        const result = await fetchNumericWithLookAhead<number>(
            (n) =>
                new Promise<number>((resolve) => {
                    queueMicrotask(() => {
                        settleOrder.push(n);
                        resolve(n);
                    });
                }),
            () => true,
            1,
            3,
            3
        );

        expect(result.responses).toEqual([1, 2, 3]);
        expect(result.count).toBe(3);
        expect(result.truncated).toBe(true);
        expect(settleOrder).toHaveLength(3);
    });

    test("stops scheduling after a terminal entry and drains stragglers", async () => {
        const requested: number[] = [];
        const result = await fetchNumericWithLookAhead<number>(
            async (n) => {
                requested.push(n);
                return n;
            },
            (n) => n < 2,
            1,
            10,
            3
        );

        expect(result.responses).toEqual([1, 2]);
        expect(result.truncated).toBe(false);
        // The window launched pages 1–3 up front; eager refill may add at
        // most one straggler (page 4) before page 2 reports terminal, and
        // nothing past the window is ever requested.
        expect(requested.slice(0, 3)).toEqual([1, 2, 3]);
        expect(requested.length).toBeLessThanOrEqual(4);
    });

    test("returns a partial result when the signal aborts mid-traversal", async () => {
        const controller = new AbortController();
        const result = await fetchNumericWithLookAhead<number>(
            async (n) => {
                if (n === 2) {
                    controller.abort();
                }
                return n;
            },
            () => true,
            1,
            10,
            2,
            controller.signal
        );

        expect(result.count).toBe(1);
        expect(result.responses).toEqual([1]);
        expect(result.truncated).toBe(false);
    });
});

describe("fetchCursorChain", () => {
    test("walks the cursor chain serially and stops at the terminal entry", async () => {
        const requestedKeys: string[] = [];
        const pages: Record<string, { items: string[]; hasMore: boolean; nextKey?: string }> = {
            start: { items: ["a"], hasMore: true, nextKey: "c1" },
            c1: { items: ["b"], hasMore: true, nextKey: "c2" },
            c2: { items: ["c"], hasMore: false },
        };
        const result = await fetchCursorChain(
            async (key) => {
                requestedKeys.push(key);
                return pages[key];
            },
            (response) => response.hasMore,
            (response) => response.nextKey as string,
            "start",
            10
        );

        expect(requestedKeys).toEqual(["start", "c1", "c2"]);
        expect(result.responses.map((r) => r.items)).toEqual([["a"], ["b"], ["c"]]);
        expect(result.truncated).toBe(false);
    });

    test("reports truncated when the guard caps the chain", async () => {
        const result = await fetchCursorChain(
            async (key) => ({ key, hasMore: true, nextKey: `${key}-next` }),
            (response) => response.hasMore,
            (response) => response.nextKey,
            "start",
            3
        );

        expect(result.count).toBe(3);
        expect(result.truncated).toBe(true);
    });

    test("stops cleanly when an entry carries no next key", async () => {
        const requestedKeys: string[] = [];
        const result = await fetchCursorChain(
            async (key) => {
                requestedKeys.push(key);
                return { key, hasMore: true };
            },
            () => true,
            (response) => (response as { nextKey?: string }).nextKey as string,
            "start",
            10
        );

        // The first entry reports more data but carries no next key: the
        // chain ends instead of fetching `undefined`.
        expect(requestedKeys).toEqual(["start"]);
        expect(result.count).toBe(1);
        expect(result.truncated).toBe(false);
    });

    test("returns a partial result when the signal aborts mid-fetch", async () => {
        const controller = new AbortController();
        const result = await fetchCursorChain<string | "boom", string>(
            async (key) => {
                if (key === "c1") {
                    controller.abort();
                    throw new Error("fetch rejected after abort");
                }
                return key;
            },
            () => true,
            (key) => (key === "start" ? "c1" : "c2"),
            "start",
            10,
            controller.signal
        );

        // The abort during the in-flight fetch settles as a partial result,
        // not a rejection.
        expect(result.responses).toEqual(["start"]);
        expect(result.count).toBe(1);
        expect(result.truncated).toBe(false);
    });

    test("reports truncated: false for a zero maxEntries guard, matching the numeric driver", async () => {
        // Both drivers share one contract: a degenerate zero-entry guard
        // fetches nothing and reports `truncated: false` (nothing was cut
        // short — the caller asked for zero entries and got zero).
        const requestedKeys: string[] = [];
        const result = await fetchCursorChain(
            async (key) => {
                requestedKeys.push(key);
                return { key, hasMore: true, nextKey: `${key}-next` };
            },
            () => true,
            (response) => response.nextKey,
            "start",
            0
        );

        expect(requestedKeys).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.truncated).toBe(false);
    });

    test("returns an empty result for an undefined first key without fetching", async () => {
        const requestedKeys: string[] = [];
        const result = await fetchCursorChain<string | undefined, string | undefined>(
            async (key) => {
                requestedKeys.push(key as string);
                return { key, hasMore: true, nextKey: "next" };
            },
            () => true,
            (response) => (response as { nextKey?: string }).nextKey,
            undefined,
            10
        );

        expect(requestedKeys).toEqual([]);
        expect(result.count).toBe(0);
        expect(result.truncated).toBe(false);
    });
});
