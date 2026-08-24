/**
 * Property-based tests for `paginate`, `paginatePages`, and `paginateChunks`
 * invariants.
 *
 * These suites complement the example-based tests in `pagination.test.ts` by
 * exercising whole input classes with `fast-check`: `maxPages`/`maxChunks`
 * truncation, `startPage`/`startChunk` bounds, `perPage`/`perChunk` clamping,
 * and item ordering across arbitrary `hasNextPage`/`hasNextChunk` sequences.
 */
import { describe, expect, test, vi } from "vitest";
import fc from "fast-check";
import { paginate, paginatePages, paginateChunks } from "../src/base/Paginator";
import type { PageInfo } from "../src/apis/anilist/interfaces/responses/page/PageInfo";

/** Build a `PageInfo` object for tests. */
function pageInfo(overrides: Partial<PageInfo> = {}): PageInfo {
    return {
        total: 100,
        perPage: 50,
        currentPage: 1,
        lastPage: 2,
        hasNextPage: true,
        ...overrides,
    };
}

/** A minimal page response shape used by the paginator tests. */
interface TestPage {
    pageInfo: PageInfo;
    media: { id: number }[];
}

/** A minimal chunk response shape used by the paginator tests. */
interface TestChunk {
    hasNextChunk: boolean;
    lists: { name: string }[];
}

/** AniList's documented per-page cap, mirrored from `Paginator.ts`. */
const MAX_PER_PAGE = 50;
/** AniList's documented per-chunk cap, mirrored from `Paginator.ts`. */
const MAX_PER_CHUNK = 500;
/** Default max pages guard, mirrored from `Paginator.ts`. */
const DEFAULT_MAX_PAGES = 100;
/** Default max chunks guard, mirrored from `Paginator.ts`. */
const DEFAULT_MAX_CHUNKS = 100;

/**
 * Arbitrary for a finite numeric option, including invalid values the paginator
 * must reject by falling back to a default. `NaN`, `Infinity`, `-Infinity`, and
 * non-positive values all fall back; finite positives are used as-is (then clamped
 * for the capped variants).
 */
const numericOption = fc.oneof(
    fc.double({ min: -100, max: 1000, noNaN: false, noDefaultInfinity: false }),
    fc.integer({ min: -100, max: 1000 }),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity)
);

/** Arbitrary for a `PaginateOptions`-shaped object with arbitrary numeric knobs. */
const paginateOptionsArb = fc.record({
    perPage: numericOption,
    startPage: numericOption,
    maxPages: numericOption,
});

/** Arbitrary for a `ChunkPaginateOptions`-shaped object with arbitrary numeric knobs. */
const chunkOptionsArb = fc.record({
    perChunk: numericOption,
    startChunk: numericOption,
    maxChunks: numericOption,
});

/**
 * Resolve a numeric option the same way `Paginator.resolvePositiveInt` does, so
 * tests can predict the effective value without re-implementing the clamping.
 */
function resolvePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
}

function resolveCappedInt(value: number | undefined, max: number, fallback: number): number {
    return Math.min(resolvePositiveInt(value, fallback), max);
}

describe("paginate (property-based)", () => {
    test("never fetches more pages than maxPages and reports truncation only when hasNextPage remains", () => {
        fc.assert(
            fc.asyncProperty(
                fc.array(fc.boolean(), { maxLength: 20 }),
                paginateOptionsArb,
                async (hasNextSequence, options) => {
                    const maxPages = resolvePositiveInt(options.maxPages, DEFAULT_MAX_PAGES);
                    let callCount = 0;
                    const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
                        callCount += 1;
                        const hasNextPage =
                            callCount <= hasNextSequence.length
                                ? hasNextSequence[callCount - 1]
                                : false;
                        return {
                            pageInfo: pageInfo({ currentPage: page, hasNextPage }),
                            media: [{ id: page }],
                        };
                    });

                    const result = await paginate(fetchPage, "media", options);

                    expect(result.pageCount).toBeLessThanOrEqual(maxPages);
                    expect(fetchPage).toHaveBeenCalledTimes(result.pageCount);
                    // Truncated iff we hit the guard while a next page was still reported.
                    if (result.pageCount === 0) {
                        expect(result.truncated).toBe(false);
                    } else {
                        const lastPage = result.pages[result.pages.length - 1];
                        expect(result.truncated).toBe(
                            result.pageCount === maxPages && lastPage.pageInfo.hasNextPage
                        );
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    test("preserves item order across pages regardless of hasNextPage sequence", () => {
        fc.assert(
            fc.asyncProperty(
                fc.array(fc.boolean(), { maxLength: 15 }),
                fc.integer({ min: 1, max: 50 }),
                async (hasNextSequence, maxPages) => {
                    let callCount = 0;
                    const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
                        callCount += 1;
                        const hasNextPage =
                            callCount <= hasNextSequence.length
                                ? hasNextSequence[callCount - 1]
                                : false;
                        return {
                            pageInfo: pageInfo({ currentPage: page, hasNextPage }),
                            media: [{ id: page * 10 }, { id: page * 10 + 1 }],
                        };
                    });

                    const result = await paginate(fetchPage, "media", { maxPages });

                    // Items must appear in page order, preserving within-page order.
                    const expected: number[] = [];
                    for (let p = 1; p <= result.pageCount; p += 1) {
                        expected.push(p * 10, p * 10 + 1);
                    }
                    expect(result.items.map((item) => item.id)).toEqual(expected);
                    expect(result.pages).toHaveLength(result.pageCount);
                }
            ),
            { numRuns: 200 }
        );
    });

    test("clamps perPage to the documented cap of 50 and floors to an integer", () => {
        fc.assert(
            fc.asyncProperty(numericOption, async (perPage) => {
                const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
                    pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
                    media: [{ id: page }],
                }));

                await paginate(fetchPage, "media", { perPage });

                const expected = resolveCappedInt(perPage, MAX_PER_PAGE, MAX_PER_PAGE);
                expect(fetchPage).toHaveBeenNthCalledWith(1, 1, expected);
            }),
            { numRuns: 200 }
        );
    });

    test("starts from startPage when it is a positive finite integer, else from 1", () => {
        fc.assert(
            fc.asyncProperty(numericOption, async (startPage) => {
                const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
                    pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
                    media: [{ id: page }],
                }));

                await paginate(fetchPage, "media", { startPage });

                const expected = resolvePositiveInt(startPage, 1);
                expect(fetchPage).toHaveBeenNthCalledWith(1, expected, MAX_PER_PAGE);
            }),
            { numRuns: 200 }
        );
    });

    test("stops as soon as hasNextPage is false even when maxPages is larger", () => {
        fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 30 }),
                fc.integer({ min: 1, max: 30 }),
                async (stopAfter, maxPages) => {
                    let callCount = 0;
                    const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
                        callCount += 1;
                        const hasNextPage = callCount < stopAfter;
                        return {
                            pageInfo: pageInfo({ currentPage: page, hasNextPage }),
                            media: [{ id: page }],
                        };
                    });

                    const result = await paginate(fetchPage, "media", { maxPages });

                    expect(result.pageCount).toBe(Math.min(stopAfter, maxPages));
                    expect(result.truncated).toBe(maxPages < stopAfter);
                }
            ),
            { numRuns: 200 }
        );
    });
});

describe("paginatePages (property-based)", () => {
    test("yields at most maxPages pages and stops when hasNextPage is false", () => {
        fc.assert(
            fc.asyncProperty(
                fc.array(fc.boolean(), { maxLength: 20 }),
                fc.integer({ min: 1, max: 50 }),
                async (hasNextSequence, maxPages) => {
                    let callCount = 0;
                    const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
                        callCount += 1;
                        const hasNextPage =
                            callCount <= hasNextSequence.length
                                ? hasNextSequence[callCount - 1]
                                : false;
                        return {
                            pageInfo: pageInfo({ currentPage: page, hasNextPage }),
                            media: [{ id: page }],
                        };
                    });

                    const yielded: TestPage[] = [];
                    for await (const page of paginatePages(fetchPage, { maxPages })) {
                        yielded.push(page);
                    }

                    expect(yielded.length).toBeLessThanOrEqual(maxPages);
                    expect(fetchPage).toHaveBeenCalledTimes(yielded.length);
                    // If we stopped before maxPages, the last yielded page had no next.
                    if (yielded.length < maxPages) {
                        expect(yielded[yielded.length - 1].pageInfo.hasNextPage).toBe(false);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    test("clamps perPage to the documented cap of 50", () => {
        fc.assert(
            fc.asyncProperty(numericOption, async (perPage) => {
                const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
                    pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
                    media: [{ id: page }],
                }));

                for await (const _page of paginatePages(fetchPage, { perPage })) {
                    void _page;
                }

                const expected = resolveCappedInt(perPage, MAX_PER_PAGE, MAX_PER_PAGE);
                expect(fetchPage).toHaveBeenNthCalledWith(1, 1, expected);
            }),
            { numRuns: 200 }
        );
    });
});

describe("paginateChunks (property-based)", () => {
    test("never fetches more chunks than maxChunks and reports truncation only when hasNextChunk remains", () => {
        fc.assert(
            fc.asyncProperty(
                fc.array(fc.boolean(), { maxLength: 20 }),
                chunkOptionsArb,
                async (hasNextSequence, options) => {
                    const maxChunks = resolvePositiveInt(options.maxChunks, DEFAULT_MAX_CHUNKS);
                    let callCount = 0;
                    const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => {
                        callCount += 1;
                        const hasNextChunk =
                            callCount <= hasNextSequence.length
                                ? hasNextSequence[callCount - 1]
                                : false;
                        return {
                            hasNextChunk,
                            lists: [{ name: `list-${chunk}` }],
                        };
                    });

                    const result = await paginateChunks(fetchChunk, "lists", options);

                    expect(result.chunkCount).toBeLessThanOrEqual(maxChunks);
                    expect(fetchChunk).toHaveBeenCalledTimes(result.chunkCount);
                    if (result.chunkCount === 0) {
                        expect(result.truncated).toBe(false);
                    } else {
                        const lastChunk = result.chunks[result.chunks.length - 1];
                        expect(result.truncated).toBe(
                            result.chunkCount === maxChunks && lastChunk.hasNextChunk
                        );
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    test("preserves item order across chunks regardless of hasNextChunk sequence", () => {
        fc.assert(
            fc.asyncProperty(
                fc.array(fc.boolean(), { maxLength: 15 }),
                fc.integer({ min: 1, max: 50 }),
                async (hasNextSequence, maxChunks) => {
                    let callCount = 0;
                    const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => {
                        callCount += 1;
                        const hasNextChunk =
                            callCount <= hasNextSequence.length
                                ? hasNextSequence[callCount - 1]
                                : false;
                        return {
                            hasNextChunk,
                            lists: [{ name: `a-${chunk}` }, { name: `b-${chunk}` }],
                        };
                    });

                    const result = await paginateChunks(fetchChunk, "lists", { maxChunks });

                    const expected: string[] = [];
                    for (let c = 1; c <= result.chunkCount; c += 1) {
                        expected.push(`a-${c}`, `b-${c}`);
                    }
                    expect(result.items.map((item) => item.name)).toEqual(expected);
                    expect(result.chunks).toHaveLength(result.chunkCount);
                }
            ),
            { numRuns: 200 }
        );
    });

    test("clamps perChunk to the documented cap of 500 and floors to an integer", () => {
        fc.assert(
            fc.asyncProperty(numericOption, async (perChunk) => {
                const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
                    hasNextChunk: false,
                    lists: [{ name: `list-${chunk}` }],
                }));

                await paginateChunks(fetchChunk, "lists", { perChunk });

                const expected = resolveCappedInt(perChunk, MAX_PER_CHUNK, MAX_PER_CHUNK);
                expect(fetchChunk).toHaveBeenNthCalledWith(1, 1, expected);
            }),
            { numRuns: 200 }
        );
    });

    test("starts from startChunk when it is a positive finite integer, else from 1", () => {
        fc.assert(
            fc.asyncProperty(numericOption, async (startChunk) => {
                const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
                    hasNextChunk: false,
                    lists: [{ name: `list-${chunk}` }],
                }));

                await paginateChunks(fetchChunk, "lists", { startChunk });

                const expected = resolvePositiveInt(startChunk, 1);
                expect(fetchChunk).toHaveBeenNthCalledWith(1, expected, MAX_PER_CHUNK);
            }),
            { numRuns: 200 }
        );
    });

    test("stops as soon as hasNextChunk is false even when maxChunks is larger", () => {
        fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 30 }),
                fc.integer({ min: 1, max: 30 }),
                async (stopAfter, maxChunks) => {
                    let callCount = 0;
                    const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => {
                        callCount += 1;
                        const hasNextChunk = callCount < stopAfter;
                        return {
                            hasNextChunk,
                            lists: [{ name: `list-${chunk}` }],
                        };
                    });

                    const result = await paginateChunks(fetchChunk, "lists", { maxChunks });

                    expect(result.chunkCount).toBe(Math.min(stopAfter, maxChunks));
                    expect(result.truncated).toBe(maxChunks < stopAfter);
                }
            ),
            { numRuns: 200 }
        );
    });
});
