import { describe, expect, test, vi } from "vitest";
import {
    paginate,
    paginatePages,
    paginateChunks,
    type PaginateOptions,
    type ChunkPaginateOptions,
} from "../src/base/Paginator";
import type { PageInfo } from "../src/apis/anilist/interfaces/responses/page/PageInfo";
import { fuzzyDate } from "../src/apis/anilist/helpers/fuzzyDate";
import { flattenMediaListCollection } from "../src/apis/anilist/helpers/flattenMediaListCollection";
import type { MediaListCollectionResponse } from "../src/apis/anilist/interfaces/responses/query/MediaListCollectionResponse";

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

        const result = await paginate(fetchPage, "media", { perPage: 50 });

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

        const result = await paginate(fetchPage, "media");

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
        for await (const page of paginatePages(fetchPage)) {
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
        for await (const _page of paginatePages(fetchPage, { maxPages: 100 })) {
            void _page;
            count++;
            if (count === 2) break;
        }

        expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    test("clamps perPage above AniList's cap of 50 down to 50", async () => {
        const fetchPage = vi.fn(async (page: number): Promise<TestPage> => ({
            pageInfo: pageInfo({ currentPage: page, hasNextPage: true }),
            media: [{ id: page }],
        }));

        for await (const _page of paginatePages(fetchPage, {
            perPage: 100,
            maxPages: 1,
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

        const result = await paginateChunks(fetchChunk, "lists", { perChunk: 500 });

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
            { name: "Completed", entries: [] },
            {
                name: "Watching",
                entries: [
                    { id: 3, userId: 5, mediaId: 102, status: "CURRENT", score: 7, progress: 3 },
                ],
            },
        ]);

        const entries = flattenMediaListCollection(collection);

        expect(entries).toHaveLength(1);
        expect(entries[0].listNames).toEqual(["Watching"]);
    });
});
