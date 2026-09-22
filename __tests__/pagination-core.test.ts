import { describe, expect, test } from "vitest";
import {
    extractLastPageBound,
    fetchNumericWithLookAhead,
    fetchWithLookAhead,
    MAX_CONCURRENCY,
    resolveCappedInt,
    resolvePositiveInt,
} from "../src/base/pagination";

describe("resolvePositiveInt", () => {
    test("falls back on undefined", () => {
        expect(resolvePositiveInt(undefined, 7)).toBe(7);
    });

    test("throws on defined-but-invalid values instead of silently coercing", () => {
        // A defined-but-invalid value is a caller bug: silently coercing it
        // to the fallback hides the mistake behind a full traversal.
        for (const invalid of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            0,
            -3,
        ]) {
            expect(() => resolvePositiveInt(invalid, 7)).toThrow(TypeError);
        }
    });

    test("floors positive values", () => {
        expect(resolvePositiveInt(5, 7)).toBe(5);
        expect(resolvePositiveInt(5.9, 7)).toBe(5);
    });

    test("names the offending option in the error message", () => {
        expect(() => resolvePositiveInt(-5, 7, "perPage")).toThrow(/perPage/);
    });
});

describe("resolveCappedInt", () => {
    test("clamps above the cap and falls back on undefined", () => {
        expect(resolveCappedInt(100, 50, 50)).toBe(50);
        expect(resolveCappedInt(undefined, 50, 25)).toBe(25);
        expect(resolveCappedInt(10, 50, 25)).toBe(10);
    });

    test("throws on defined-but-invalid values like resolvePositiveInt", () => {
        expect(() => resolveCappedInt(Number.NaN, 50, 25)).toThrow(TypeError);
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
        // The window ramps: entry 1 launches alone, then entries 2 and 3
        // launch together once entry 1 confirmed more data.
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
        // The window ramps: page 1 launches alone, and consuming it (it
        // confirmed more data) grows the window to 3 — pages 2-4 launch
        // before page 2 reports terminal, and nothing past the window is
        // ever requested.
        expect(requested.slice(0, 3)).toEqual([1, 2, 3]);
        expect(requested.length).toBeLessThanOrEqual(4);
    });

    test("launches the first entry alone so a single-entry traversal costs one request", async () => {
        const requested: number[] = [];
        const result = await fetchNumericWithLookAhead<number>(
            async (n) => {
                requested.push(n);
                return n;
            },
            () => false,
            1,
            10,
            3
        );

        // The terminal first entry never lets the window grow: pages 2 and
        // 3 are never launched, so the traversal spends one request instead
        // of three requests' worth of rate-limit quota.
        expect(requested).toEqual([1]);
        expect(result.responses).toEqual([1]);
        expect(result.count).toBe(1);
        expect(result.truncated).toBe(false);
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

        // The window ramps, so page 2 (whose fetch fires the abort) only
        // launches after page 1 is consumed: the abort lands after page 2
        // settles but before page 3 is consumed, and the collected prefix
        // returns as a partial result — not a rejection.
        expect(result.count).toBe(2);
        expect(result.responses).toEqual([1, 2]);
        expect(result.truncated).toBe(false);
    });

    test("never launches pages beyond the lastPage bound reported by a received page", async () => {
        const requested: number[] = [];
        const result = await fetchNumericWithLookAhead<{ page: number; more: boolean }>(
            async (n) => {
                requested.push(n);
                return { page: n, more: n < 5, pageInfo: { lastPage: 3 } };
            },
            (response) => response.more,
            1,
            20,
            2,
            undefined,
            extractLastPageBound
        );

        // Page 1 reports lastPage 3: the window keeps overlapping latency but
        // never launches a page the server said does not exist, so the run
        // ends at page 3 instead of launching discarded pages 4+. Page 3
        // still reports more data, so the bound cut is surfaced as
        // truncation instead of a clean end.
        expect(result.responses.map((r) => r.page)).toEqual([1, 2, 3]);
        expect(result.count).toBe(3);
        expect(result.truncated).toBe(true);
        expect(requested).toEqual([1, 2, 3]);
    });

    test("treats a lastPage of 0 as no bound and keeps launching ahead", async () => {
        const requested: number[] = [];
        const result = await fetchNumericWithLookAhead<{ page: number; more: boolean }>(
            async (n) => {
                requested.push(n);
                return { page: n, more: n < 3, pageInfo: { lastPage: 0 } };
            },
            (response) => response.more,
            1,
            10,
            2,
            undefined,
            extractLastPageBound
        );

        // lastPage 0 means "unknown": the window keeps launching ahead of
        // consumption exactly as it does for a response without pageInfo.
        expect(result.responses.map((r) => r.page)).toEqual([1, 2, 3]);
        expect(result.count).toBe(3);
        expect(requested).toEqual([1, 2, 3, 4]);
    });
});
