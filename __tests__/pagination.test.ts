import { describe, expect, test, vi } from "vitest";
import {
    paginate,
    paginatePages,
    paginateChunks,
    type PaginateOptions,
    type ChunkPaginateOptions,
} from "../src/apis/graphql/anilist/Paginator";
import type { PageInfo } from "../src/apis/graphql/anilist/interfaces/responses/page/PageInfo";
import { fuzzyDate } from "../src/apis/graphql/anilist/helpers/fuzzyDate";
import { flattenMediaListCollection } from "../src/apis/graphql/anilist/helpers/flattenMediaListCollection";
import type { MediaListCollectionResponse } from "../src/apis/graphql/anilist/interfaces/responses/query/MediaListCollectionResponse";

/** Build a {@link PageInfo} object for tests. */
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

describe("paginate", () => {
    test("collects items across pages until hasNextPage is false", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            const isLast = page >= 2;
            return {
                pageInfo: pageInfo({
                    currentPage: page,
                    lastPage: 2,
                    hasNextPage: !isLast,
                }),
                media: [{ id: page }, { id: page + 100 }],
            };
        });

        const result = await paginate(fetchPage, "media", { perPage: 50, concurrency: 1 });

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
        expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 50);
        expect(result.items).toEqual([{ id: 1 }, { id: 101 }, { id: 2 }, { id: 102 }]);
        expect(result.pageCount).toBe(2);
        expect(result.truncated).toBe(false);
        expect(result.pages).toHaveLength(2);
        expect(result.pages[0].pageInfo.hasNextPage).toBe(true);
        expect(result.pages[1].pageInfo.hasNextPage).toBe(false);
    });

    test("stops at the maxPages guard and reports truncation", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", { maxPages: 3 });

        expect(fetchPage).toHaveBeenCalledTimes(3);
        expect(result.pageCount).toBe(3);
        expect(result.truncated).toBe(true);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    test("respects startPage and perPage options", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", {
            startPage: 5,
            perPage: 25,
        });

        expect(fetchPage).toHaveBeenNthCalledWith(1, 5, 25);
        expect(result.pageCount).toBe(1);
        expect(result.truncated).toBe(false);
    });

    test("handles a single page with no next page", async () => {
        const fetchPage = vi.fn(async (): Promise<TestPage> => ({
            pageInfo: pageInfo({ hasNextPage: false, lastPage: 1 }),
            media: [{ id: 1 }],
        }));

        const result = await paginate(fetchPage, "media", { concurrency: 1 });

        expect(fetchPage).toHaveBeenCalledTimes(1);
        expect(result.pageCount).toBe(1);
        expect(result.truncated).toBe(false);
        expect(result.items).toEqual([{ id: 1 }]);
    });

    test("falls back to defaults when options are invalid", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", {
            perPage: -5,
            startPage: 0,
            maxPages: NaN,
        } as PaginateOptions);

        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
        expect(result.pageCount).toBe(1);
    });

    test("stops when a response has no usable pageInfo object", async () => {
        const fetchPage = vi.fn(async (): Promise<TestPage> => ({
            pageInfo: undefined as never,
            media: [{ id: 1 }],
        }));

        const result = await paginate(fetchPage, "media", { concurrency: 1 });

        expect(fetchPage).toHaveBeenCalledTimes(1);
        expect(result.items).toEqual([{ id: 1 }]);
        expect(result.truncated).toBe(false);
    });

    test("clamps perPage above AniList's cap of 50 down to 50", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", { perPage: 100 });

        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
        expect(result.pageCount).toBe(1);
    });

    test("keeps perPage unchanged at the boundary value of 50", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: false }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", { perPage: 50 });

        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
        expect(result.pageCount).toBe(1);
    });
});

describe("paginatePages", () => {
    test("yields each page until hasNextPage is false", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 2 }),
            media: [{ id: page }],
        }));

        const yielded: TestPage[] = [];
        for await (const page of paginatePages(fetchPage, { concurrency: 1 })) {
            yielded.push(page);
        }

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(yielded).toHaveLength(2);
        expect(yielded[0].pageInfo.currentPage).toBe(1);
        expect(yielded[1].pageInfo.currentPage).toBe(2);
    });

    test("stops at the maxPages guard", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        const yielded: TestPage[] = [];
        for await (const page of paginatePages(fetchPage, { maxPages: 2 })) {
            yielded.push(page);
        }

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(yielded).toHaveLength(2);
    });

    test("supports early break from the consumer loop", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        let count = 0;
        for await (const _page of paginatePages(fetchPage, { maxPages: 100, concurrency: 1 })) {
            void _page;
            count++;
            if (count === 2) break;
        }

        expect(fetchPage).toHaveBeenCalledTimes(2);
    });
    test("keeps pages in flight and yields strictly in page order by default", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const settleOrder: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            // Later pages settle sooner than earlier ones.
            const delay = page === 1 ? 20 : page === 2 ? 10 : 0;
            if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
            inFlight -= 1;
            settleOrder.push(page);
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 3 }),
                media: [{ id: page }],
            };
        });

        const yielded: TestPage[] = [];
        for await (const page of paginatePages(fetchPage)) {
            yielded.push(page);
        }

        // Look-ahead overlaps latency, but the consumer still sees pages in order.
        expect(maxObserved).toBeGreaterThanOrEqual(2);
        expect(settleOrder).not.toEqual([1, 2, 3]);
        expect(yielded.map((p) => p.pageInfo.currentPage)).toEqual([1, 2, 3]);
        expect(yielded.map((p) => p.media[0].id)).toEqual([1, 2, 3]);
    });

    test("stops scheduling past a terminal page and drains in-flight stragglers", async () => {
        const gates: Array<() => void> = [];
        const launchedPages: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            launchedPages.push(page);
            await new Promise<void>((resolve) => gates.push(resolve));
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 3 }),
                media: [{ id: page }],
            };
        });

        const generator = paginatePages(fetchPage, { concurrency: 3 });

        // The window launches pages 1-3 while page 1 is being fetched.
        const firstPromise = generator.next();
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3]));

        gates[0]?.();
        const first = await firstPromise;
        expect(first.value.pageInfo.currentPage).toBe(1);

        // Consuming page 1 refills the window with page 4 before the
        // traversal can know page 3 is terminal.
        gates[1]?.();
        const second = await generator.next();
        expect(second.value.pageInfo.currentPage).toBe(2);
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3, 4]));

        // Page 3 is terminal. Release the stragglers asynchronously so the
        // drain settles once the terminal page settles.
        gates[2]?.();
        gates[3]?.();
        setTimeout(() => gates.forEach((release) => release()), 0);
        const third = await generator.next();
        expect(third.value.pageInfo.hasNextPage).toBe(false);
        await expect(generator.next()).resolves.toMatchObject({ done: true });
        // The window could only reach page 5 (launched before page 3 was
        // known to be terminal); nothing past the window is ever scheduled.
        expect(launchedPages).toEqual([1, 2, 3, 4, 5]);
    });

    test("supports early break from the consumer loop with a look-ahead window", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const launchedPages: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            launchedPages.push(page);
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 5));
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
                media: [{ id: page }],
            };
        });

        let count = 0;
        for await (const _page of paginatePages(fetchPage, { maxPages: 100 })) {
            void _page;
            count++;
            if (count === 2) break;
        }

        // The window launched ahead of consumption; breaking drains the
        // in-flight stragglers without hanging or leaking rejections, and
        // nothing beyond the window is scheduled.
        expect(launchedPages.length).toBeGreaterThanOrEqual(2);
        expect(launchedPages.length).toBeLessThanOrEqual(4);
        expect(maxObserved).toBeLessThanOrEqual(3);
    });

    test("releases the iterator on early break without awaiting unresolved stragglers", async () => {
        // Stragglers that never settle must not keep the iterator alive when
        // the consumer breaks: the generator releases immediately and the
        // dangling rejections are handled so nothing leaks.
        const gates: Array<() => void> = [];
        const launchedPages: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            launchedPages.push(page);
            await new Promise<void>((resolve) => gates.push(resolve));
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
                media: [{ id: page }],
            };
        });

        const generator = paginatePages(fetchPage, { concurrency: 3 });
        const firstPromise = generator.next();
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3]));

        // Release only page 1 so it can be yielded; pages 2 and 3 stay pending.
        gates[0]?.();
        const first = await firstPromise;
        expect(first.value.pageInfo.currentPage).toBe(1);

        // Break without releasing pages 2 and 3: the iterator must complete
        // promptly instead of hanging on the unresolved stragglers.
        const settledBeforeBreak = Date.now();
        await expect(generator.return(undefined)).resolves.toMatchObject({ done: true });
        expect(Date.now() - settledBeforeBreak).toBeLessThan(1_000);
        expect(launchedPages).toEqual([1, 2, 3]);
    });

    test("delivers the original fetch failure without awaiting unresolved stragglers", async () => {
        // When the consumed page rejects, the original error propagates
        // immediately even if sibling look-ahead requests never settle.
        const gates: Array<() => void> = [];
        const launchedPages: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            launchedPages.push(page);
            if (page === 1) {
                throw new Error("page 1 failed");
            }
            // Siblings never settle.
            await new Promise<void>((resolve) => gates.push(resolve));
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
                media: [{ id: page }],
            };
        });

        const generator = paginatePages(fetchPage, { concurrency: 3 });
        const settledAt = Date.now();
        await expect(generator.next()).rejects.toThrow("page 1 failed");
        expect(Date.now() - settledAt).toBeLessThan(1_000);
        // Pages 2 and 3 were launched as stragglers but never released.
        expect(launchedPages).toEqual([1, 2, 3]);
        // Releasing the stragglers later must not surface an unhandled rejection.
        gates.forEach((release) => release());
    });

    test("clamps perPage above AniList's cap of 50 down to 50", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        for await (const _page of paginatePages(fetchPage, {
            perPage: 100,
            maxPages: 1,
            concurrency: 1,
        })) {
            void _page;
        }

        expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 50);
    });
});

describe("paginateChunks", () => {
    test("collects items across chunks until hasNextChunk is false", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => {
            const isLast = chunk >= 2;
            return {
                hasNextChunk: !isLast,
                lists: [{ name: `list-${chunk}` }],
            };
        });

        const result = await paginateChunks(fetchChunk, "lists", { perChunk: 500, concurrency: 1 });

        expect(fetchChunk).toHaveBeenCalledTimes(2);
        expect(fetchChunk).toHaveBeenNthCalledWith(1, 1, 500);
        expect(fetchChunk).toHaveBeenNthCalledWith(2, 2, 500);
        expect(result.items).toEqual([{ name: "list-1" }, { name: "list-2" }]);
        expect(result.chunkCount).toBe(2);
        expect(result.truncated).toBe(false);
        expect(result.chunks).toHaveLength(2);
        expect(result.chunks[0].hasNextChunk).toBe(true);
        expect(result.chunks[1].hasNextChunk).toBe(false);
    });

    test("stops at the maxChunks guard and reports truncation", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
            hasNextChunk: true,
            lists: [{ name: `list-${chunk}` }],
        }));

        const result = await paginateChunks(fetchChunk, "lists", { maxChunks: 3 });

        expect(fetchChunk).toHaveBeenCalledTimes(3);
        expect(result.chunkCount).toBe(3);
        expect(result.truncated).toBe(true);
    });

    test("respects startChunk and perChunk options", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
            hasNextChunk: false,
            lists: [{ name: `list-${chunk}` }],
        }));

        const result = await paginateChunks(fetchChunk, "lists", {
            startChunk: 4,
            perChunk: 250,
        });

        expect(fetchChunk).toHaveBeenNthCalledWith(1, 4, 250);
        expect(result.chunkCount).toBe(1);
    });

    test("falls back to defaults when options are invalid", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
            hasNextChunk: false,
            lists: [{ name: `list-${chunk}` }],
        }));

        const result = await paginateChunks(fetchChunk, "lists", {
            perChunk: -1,
            startChunk: 0,
            maxChunks: Infinity,
        } as ChunkPaginateOptions);

        expect(fetchChunk).toHaveBeenNthCalledWith(1, 1, 500);
        expect(result.chunkCount).toBe(1);
    });

    test("clamps perChunk above the documented max of 500 down to 500", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => ({
            hasNextChunk: false,
            lists: [{ name: `list-${chunk}` }],
        }));

        const result = await paginateChunks(fetchChunk, "lists", { perChunk: 1000 });

        expect(fetchChunk).toHaveBeenNthCalledWith(1, 1, 500);
        expect(result.chunkCount).toBe(1);
    });
});

describe("paginate concurrency", () => {
    test("keeps a small look-ahead window in flight by default", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 5));
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 5 }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media");

        // The default window of 3 overlaps round-trip latency without opting
        // in, while still collecting every page in order.
        expect(maxObserved).toBe(3);
        expect(result.pageCount).toBe(5);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    });

    test("falls back to the default look-ahead window when concurrency is invalid", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 5));
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 5 }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media", {
            concurrency: -3,
        } as PaginateOptions);

        expect(maxObserved).toBe(3);
        expect(result.pageCount).toBe(5);
    });

    test("keeps multiple pages in flight with concurrency above one", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 10));
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 4 }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media", { concurrency: 3 });

        // Pages 1-3 launch together before the first 10 ms timer fires.
        expect(maxObserved).toBe(3);
        expect(result.pageCount).toBe(4);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });

    test("collects results strictly in page order even when later pages settle first", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            // Later pages resolve sooner than earlier ones.
            const delay = page === 1 ? 20 : page === 2 ? 10 : 0;
            if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 3 }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media", { concurrency: 3 });

        expect(result.pages.map((p) => p.pageInfo.currentPage)).toEqual([1, 2, 3]);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    test("stops scheduling new pages once a terminal page settles", async () => {
        const gates: Array<() => void> = [];
        const launchedPages: number[] = [];
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            launchedPages.push(page);
            await new Promise<void>((resolve) => gates.push(resolve));
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 2 }),
                media: [{ id: page }],
            };
        });

        const pending = paginate(fetchPage, "media", { concurrency: 3 });
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3]));

        // Page 1 settles with more data ahead, so the window refills with page 4.
        const releaseFirst = gates[0];
        releaseFirst?.();
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3, 4]));

        // Page 2 is terminal: no further pages may be scheduled.
        const releaseSecond = gates[1];
        releaseSecond?.();
        await vi.waitFor(() => expect(launchedPages).toEqual([1, 2, 3, 4]));
        expect(gates).toHaveLength(4);

        for (const release of gates) release();
        const result = await pending;

        expect(result.pageCount).toBe(2);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
        expect(result.truncated).toBe(false);
    });

    test("still reports truncation at maxPages with concurrency above one", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        const result = await paginate(fetchPage, "media", { concurrency: 4, maxPages: 6 });

        expect(fetchPage).toHaveBeenCalledTimes(6);
        expect(result.pageCount).toBe(6);
        expect(result.items).toHaveLength(6);
        expect(result.truncated).toBe(true);
    });
    test("keeps strictly sequential fetches with concurrency: 1", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await Promise.resolve();
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: page < 3 }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media", { concurrency: 1 });

        expect(maxObserved).toBe(1);
        expect(result.pageCount).toBe(3);
        expect(result.items).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    test("clamps concurrency above the cap of 8 down to 8", async () => {
        let inFlight = 0;
        let maxObserved = 0;
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => {
            inFlight += 1;
            maxObserved = Math.max(maxObserved, inFlight);
            await new Promise((resolve) => setTimeout(resolve, 5));
            inFlight -= 1;
            return {
                pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
                media: [{ id: page }],
            };
        });

        const result = await paginate(fetchPage, "media", { concurrency: 50, maxPages: 30 });

        expect(maxObserved).toBe(8);
        expect(result.pageCount).toBe(30);
        expect(result.truncated).toBe(true);
    });

    test("paginateChunks keeps chunks in flight and collects them in chunk order", async () => {
        const fetchChunk = vi.fn(async (chunk: number): Promise<TestChunk> => {
            // Earlier chunks resolve later than later chunks.
            const delay = chunk === 1 ? 15 : chunk === 2 ? 5 : 0;
            if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
            return { hasNextChunk: chunk < 3, lists: [{ name: `list-${chunk}` }] };
        });

        const result = await paginateChunks(fetchChunk, "lists", { concurrency: 3 });

        expect(result.chunkCount).toBe(3);
        expect(result.chunks.map((c) => c.hasNextChunk)).toEqual([true, true, false]);
        expect(result.items).toEqual([{ name: "list-1" }, { name: "list-2" }, { name: "list-3" }]);
        expect(result.truncated).toBe(false);
    });
});

describe("fuzzyDate", () => {
    test("builds a full date from year, month, and day", () => {
        const result = fuzzyDate({ year: 2024, month: 4, day: 15 });
        expect(result).toEqual({ year: 2024, month: 4, day: 15 });
    });

    test("defaults missing parts to zero", () => {
        const result = fuzzyDate({ year: 2024 });
        expect(result).toEqual({ year: 2024, month: 0, day: 0 });
    });

    test("returns a zero date when no options are given", () => {
        const result = fuzzyDate();
        expect(result).toEqual({ year: 0, month: 0, day: 0 });
    });
});

describe("flattenMediaListCollection", () => {
    function makeCollection(
        groups: Array<{
            name: string;
            isCustomList?: boolean;
            isSplitCompletedList?: boolean;
            entries: Array<{
                id: number;
                userId: number;
                mediaId: number;
                status: string;
                score: number;
                progress: number;
            }>;
        }>
    ): MediaListCollectionResponse {
        return {
            lists: groups.map((g) => ({
                entries: g.entries.map((e) => ({
                    id: e.id,
                    userId: e.userId,
                    mediaId: e.mediaId,
                    status: e.status,
                    score: e.score,
                    progress: e.progress,
                    progressVolumes: 0,
                    repeat: 0,
                    priority: 0,
                    private: false,
                    notes: "",
                    hiddenFromStatusLists: false,
                    customLists: [],
                    advancedScores: [],
                    startedAt: { year: 0, month: 0, day: 0 },
                    completedAt: { year: 0, month: 0, day: 0 },
                    updatedAt: 0,
                    createdAt: 0,
                    media: {} as never,
                })),
                name: g.name,
                isCustomList: g.isCustomList ?? false,
                isSplitCompletedList: g.isSplitCompletedList ?? false,
                status: g.name,
            })),
            hasNextChunk: false,
        };
    }

    test("flattens multiple list groups into a single deduplicated entries array", () => {
        const collection = makeCollection([
            {
                name: "Completed",
                entries: [
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                    { id: 2, userId: 5, mediaId: 101, status: "COMPLETED", score: 9, progress: 24 },
                ],
            },
            {
                name: "Watching",
                entries: [
                    { id: 3, userId: 5, mediaId: 102, status: "CURRENT", score: 7, progress: 3 },
                ],
            },
        ]);

        const entries = flattenMediaListCollection(collection);

        expect(entries).toHaveLength(3);
        expect(entries[0]).toEqual({
            id: 1,
            userId: 5,
            mediaId: 100,
            status: "COMPLETED",
            score: 8,
            progress: 12,
            listNames: ["Completed"],
            inCustomList: false,
            inSplitCompletedList: false,
        });
        expect(entries[2].listNames).toEqual(["Watching"]);
    });

    test("deduplicates entries that appear in multiple list groups and collects all list names", () => {
        const collection = makeCollection([
            {
                name: "Completed",
                entries: [
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                ],
            },
            {
                name: "Favorites",
                isCustomList: true,
                entries: [
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                ],
            },
            {
                name: "Rewatch",
                isCustomList: true,
                entries: [
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                ],
            },
        ]);

        const entries = flattenMediaListCollection(collection);

        expect(entries).toHaveLength(1);
        expect(entries[0].listNames).toEqual(["Completed", "Favorites", "Rewatch"]);
        expect(entries[0].inCustomList).toBe(true);
        expect(entries[0].inSplitCompletedList).toBe(false);
    });

    test("does not duplicate a list name when an entry repeats within the same group", () => {
        const collection = makeCollection([
            {
                name: "Completed",
                entries: [
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                    { id: 1, userId: 5, mediaId: 100, status: "COMPLETED", score: 8, progress: 12 },
                ],
            },
        ]);

        const entries = flattenMediaListCollection(collection);

        expect(entries).toHaveLength(1);
        expect(entries[0].listNames).toEqual(["Completed"]);
    });

    test("tags entries with custom and split-completed list flags", () => {
        const collection = makeCollection([
            {
                name: "Favorites",
                isCustomList: true,
                entries: [
                    {
                        id: 1,
                        userId: 5,
                        mediaId: 100,
                        status: "COMPLETED",
                        score: 10,
                        progress: 12,
                    },
                ],
            },
            {
                name: "Completed",
                isSplitCompletedList: true,
                entries: [
                    { id: 2, userId: 5, mediaId: 101, status: "COMPLETED", score: 9, progress: 24 },
                ],
            },
        ]);

        const entries = flattenMediaListCollection(collection);

        expect(entries[0].inCustomList).toBe(true);
        expect(entries[0].inSplitCompletedList).toBe(false);
        expect(entries[1].inCustomList).toBe(false);
        expect(entries[1].inSplitCompletedList).toBe(true);
    });

    test("returns an empty array when there are no lists", () => {
        expect(flattenMediaListCollection({ lists: [], hasNextChunk: false })).toEqual([]);
    });

    test("returns an empty array for a null or malformed response", () => {
        expect(flattenMediaListCollection(null as unknown as MediaListCollectionResponse)).toEqual(
            []
        );
        expect(flattenMediaListCollection({} as unknown as MediaListCollectionResponse)).toEqual(
            []
        );
    });

    test("skips groups with no entries array", () => {
        const collection = makeCollection([
            {
                name: "Watching",
                entries: [
                    { id: 3, userId: 5, mediaId: 102, status: "CURRENT", score: 7, progress: 3 },
                ],
            },
        ]);
        collection.lists.unshift({ name: "Broken", entries: undefined } as never);

        const entries = flattenMediaListCollection(collection);

        expect(entries).toHaveLength(1);
        expect(entries[0].listNames).toEqual(["Watching"]);
    });
});
