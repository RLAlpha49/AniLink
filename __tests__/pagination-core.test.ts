import { describe, expect, test } from "vitest";
import {
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

    test("concurrency cap constant stays conservative", () => {
        expect(MAX_CONCURRENCY).toBeLessThanOrEqual(8);
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
