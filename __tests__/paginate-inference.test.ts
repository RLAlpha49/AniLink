import { describe, expect, test } from "vitest";
import type { AniLink } from "../src/AniLink";
import { createTestClient, mockSendRequest } from "./helpers/mockRequestHandler";

/**
 * Compile-time regression tests for the documented `paginate` pattern.
 *
 * The JSDoc examples on `paginate`/`paginatePages`/`paginateChunks` pass the
 * facade page methods directly as the fetch callback. These tests pin that
 * pattern: it must infer `TPage` from the callback and type `items` as the
 * page's element type — no casts.
 */
describe("paginate inference from facade page methods", () => {
    test("the documented paginate pattern infers items without casts", async () => {
        const client: AniLink = createTestClient("paginate-inference-token");

        let callCount = 0;
        mockSendRequest.mockImplementation(async () => {
            callCount += 1;
            return {
                pageInfo: {
                    total: 100,
                    perPage: 50,
                    currentPage: callCount,
                    lastPage: 2,
                    hasNextPage: callCount < 2,
                },
                media: [{ id: callCount }],
            };
        });

        const result = await client.anilist.paginate(
            (page, perPage) => client.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
            "media",
            { maxPages: 5, concurrency: 1 }
        );

        // items must be the media element type — id is a number, no cast needed.
        const ids: number[] = result.items.map((media) => media.id);
        expect(ids).toEqual([1, 2]);
    });

    test("the documented paginatePages pattern infers the page type", async () => {
        const client: AniLink = createTestClient("paginate-pages-inference-token");

        mockSendRequest.mockImplementation(async () => ({
            pageInfo: {
                total: 100,
                perPage: 50,
                currentPage: 1,
                lastPage: 1,
                hasNextPage: false,
            },
            media: [{ id: 1 }],
        }));

        for await (const page of client.anilist.paginatePages(
            (page, perPage) => client.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
            { maxPages: 2, concurrency: 1 }
        )) {
            const current: number | undefined = page.pageInfo?.currentPage;
            expect(current).toBe(1);
            break;
        }
    });

    test("the documented paginateChunks pattern infers items without casts", async () => {
        const client: AniLink = createTestClient("paginate-chunks-inference-token");

        let callCount = 0;
        mockSendRequest.mockImplementation(async () => {
            callCount += 1;
            return {
                hasNextChunk: callCount < 2,
                lists: [{ name: "Watching", entries: [{ id: callCount }] }],
            };
        });

        const result = await client.anilist.paginateChunks(
            (chunk, perChunk) =>
                client.anilist.query.mediaListCollection({
                    userId: 1,
                    type: "ANIME",
                    chunk,
                    perChunk,
                }),
            "lists",
            { maxChunks: 2, concurrency: 1 }
        );

        const first = result.items[0];
        if (first !== undefined) {
            // items are the list groups; entries is the array of list entries on each.
            const count: number = first.entries.length;
            expect(count).toBe(1);
        }
    });

    test("a non-array itemsKey yields never[] and collects nothing", async () => {
        const client: AniLink = createTestClient("paginate-bad-key-token");

        // The mock returns a real PageInfo object at the bad key: "pageInfo"
        // is not an array-typed key of the response type, so the traversal
        // collects nothing (the documented never[] result) instead of
        // spreading a non-iterable.
        mockSendRequest.mockImplementation(async () => ({
            pageInfo: {
                total: 100,
                perPage: 50,
                currentPage: 1,
                lastPage: 1,
                hasNextPage: false,
            },
            media: [{ id: 1 }],
        }));

        const result = await client.anilist.paginate(
            (page, perPage) => client.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
            "pageInfo",
            { maxPages: 1, concurrency: 1 }
        );

        // @ts-expect-error — items is never[] for a non-array key.
        result.items.map((media) => media.id);
        expect(result.items).toEqual([]);
    });

    test("a non-array itemsKey on paginateChunks collects nothing instead of spreading", async () => {
        const client: AniLink = createTestClient("paginate-chunks-bad-key-token");

        // "hasNextChunk" is a boolean, not an array-typed key: the traversal
        // must collect nothing (the documented never[] result) instead of
        // spreading a non-iterable boolean.
        mockSendRequest.mockImplementation(async () => ({
            hasNextChunk: false,
            lists: [{ name: "Watching", entries: [{ id: 1 }] }],
        }));

        const result = await client.anilist.paginateChunks(
            (chunk, perChunk) =>
                client.anilist.query.mediaListCollection({
                    userId: 1,
                    type: "ANIME",
                    chunk,
                    perChunk,
                }),
            "hasNextChunk",
            { maxChunks: 1, concurrency: 1 }
        );

        // @ts-expect-error — items is never[] for a non-array key.
        result.items.map((list) => list.name);
        expect(result.items).toEqual([]);
    });
});
