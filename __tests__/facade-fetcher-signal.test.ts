import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { describe, expect, test } from "vitest";

/**
 * The facade pagination helpers must accept the same fetcher callbacks as
 * the exported `paginate`/`paginatePages`/`paginateChunks` functions —
 * including the third `signal` parameter that lets a traversal forward its
 * abort signal into each page request.
 *
 * These tests are compile-time contracts: each callback declares the
 * three-parameter signature. If the facade's `PageFetcher`/`ChunkFetcher`
 * types drop the `signal` parameter, the callbacks fail to assign and the
 * suite does not compile — which is exactly the regression to catch.
 */

/** A terminal one-page response in the shape the transport returns post-unwrap. */
const UNWRAPPED_PAGE = {
    pageInfo: { total: 2, perPage: 2, currentPage: 1, lastPage: 1, hasNextPage: false },
    media: [{ id: 1 }, { id: 2 }],
};

/** The fetcher shape `Paginator.ts` documents: (page, perPage, signal). */
type DocumentedPageFetcher = (
    page: number,
    perPage: number,
    signal?: AbortSignal
) => Promise<{ pageInfo: typeof UNWRAPPED_PAGE.pageInfo; media: { id: number }[] }>;

/** The chunk-fetcher shape `Paginator.ts` documents: (chunk, perChunk, signal). */
type DocumentedChunkFetcher = (
    chunk: number,
    perChunk: number,
    signal?: AbortSignal
) => Promise<{ hasNextChunk: boolean; lists: { name: string }[] }>;

describe("facade pagination fetchers accept the traversal signal", () => {
    test("anilist.paginate accepts a three-parameter page fetcher", async () => {
        const client = createTestClient("fetcher-signal-token");
        // The mocked transport replaces `sendRequest` after envelope
        // unwrapping, so the mock resolves with the bare page value.
        setMockResponse(UNWRAPPED_PAGE);

        // The required-`signal` signature is the pattern `Paginator.ts`
        // documents; assigning it through the facade only compiles when the
        // facade's fetcher type carries the third parameter.
        const fetchPage: DocumentedPageFetcher = (page, perPage, signal) =>
            client.anilist.query.page.medias({ page, perPage, type: "ANIME" }, { signal });

        const result = await client.anilist.paginate(fetchPage, "media", {
            perPage: 2,
            maxPages: 1,
        });

        expect(result.pageCount).toBe(1);
        expect(result.items).toHaveLength(2);
    });

    test("anilist.paginatePages accepts a three-parameter page fetcher", async () => {
        const client = createTestClient("fetcher-signal-token");
        setMockResponse(UNWRAPPED_PAGE);

        const fetchPage: DocumentedPageFetcher = (page, perPage, signal) =>
            client.anilist.query.page.medias({ page, perPage, type: "ANIME" }, { signal });

        const seen: number[] = [];
        for await (const page of client.anilist.paginatePages(fetchPage, {
            perPage: 2,
            maxPages: 1,
        })) {
            seen.push(page.pageInfo.currentPage);
        }

        expect(seen).toEqual([1]);
    });

    test("anilist.paginateChunks accepts a three-parameter chunk fetcher", async () => {
        const client = createTestClient("fetcher-signal-token");
        setMockResponse({
            lists: [
                {
                    entries: [{ id: 1 }],
                    name: "Watching",
                    isCustomList: false,
                    isSplitCompletedList: false,
                    status: "CURRENT",
                },
            ],
            hasNextChunk: false,
        });

        const fetchChunk: DocumentedChunkFetcher = (chunk, perChunk, signal) =>
            client.anilist.query.mediaListCollection(
                { userId: 542244, type: "ANIME", chunk, perChunk },
                { signal }
            );

        const result = await client.anilist.paginateChunks(fetchChunk, "lists", {
            perChunk: 500,
            maxChunks: 1,
        });

        expect(result.chunkCount).toBe(1);
        expect(result.items.length).toBeGreaterThan(0);
    });

    test("the forwarded signal reaches the per-request transport options", async () => {
        const client = createTestClient("fetcher-signal-token");
        setMockResponse(UNWRAPPED_PAGE);
        const controller = new AbortController();
        let capturedDuringRequest: AbortSignal | undefined;
        let abortedAtCaptureTime: boolean | undefined;

        const fetchPage: DocumentedPageFetcher = (page, perPage, signal) => {
            // Capture the signal the traversal hands the fetcher while
            // the traversal is still live — the bridge is disposed
            // (aborted) once the traversal completes, so the live state
            // must be observed mid-flight, not after the await returns.
            capturedDuringRequest = signal;
            abortedAtCaptureTime = signal?.aborted;
            return client.anilist.query.page.medias({ page, perPage, type: "ANIME" }, { signal });
        };

        await client.anilist.paginate(fetchPage, "media", {
            perPage: 2,
            maxPages: 1,
            signal: controller.signal,
        });

        // The traversal signal must be forwarded into each page request's
        // transport options, so aborting the traversal aborts the in-flight
        // HTTP request instead of only stopping new launches. The paginator
        // bridges the consumer's signal through an internal controller (so
        // it can dispose the bridge), so the per-request options carry the
        // bridged signal — assert presence and abort propagation, not
        // instance identity.
        expect(capturedDuringRequest).toBeInstanceOf(AbortSignal);
        expect(abortedAtCaptureTime).toBe(false);
        const forwarded = getLastRequest()?.sendOptions?.options?.signal;
        expect(forwarded).toBe(capturedDuringRequest);
        controller.abort();
        expect(capturedDuringRequest?.aborted).toBe(true);
        expect(mockSendRequest).toHaveBeenCalledTimes(1);
    });
});
