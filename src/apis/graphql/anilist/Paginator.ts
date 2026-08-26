import type { PageInfo } from "./interfaces/responses/page/PageInfo";

/**
 * Default items requested per page. AniList caps `perPage` at 50; caller-supplied
 * values above the cap are clamped down to it.
 */
const DEFAULT_PER_PAGE = 50;

/** Hard cap on items requested per page; larger values are clamped down to this. */
const MAX_PER_PAGE = DEFAULT_PER_PAGE;

/** Default hard cap on pages fetched, guarding against unbounded loops. */
const DEFAULT_MAX_PAGES = 100;

/**
 * Default entries requested per `MediaListCollection` chunk. Values above the
 * documented maximum of 500 are clamped down to it.
 */
const DEFAULT_PER_CHUNK = 500;

/** Hard cap on entries requested per chunk; larger values are clamped down to this. */
const MAX_PER_CHUNK = DEFAULT_PER_CHUNK;

/** Default hard cap on chunks fetched, guarding against unbounded loops. */
const DEFAULT_MAX_CHUNKS = 100;

/**
 * Upper bound on caller-supplied look-ahead `concurrency`. Values above this are
 * clamped down so a typo like `concurrency: 1000` cannot hammer AniList.
 */
const MAX_CONCURRENCY = 8;

/**
 * Keys of `T` whose value is a readonly array — the items field of a page or
 * chunk response. `PageInfo` and `hasNextChunk` are never arrays, so they are
 * excluded automatically.
 */
type ArrayKeys<T> = {
    [K in keyof T]: T[K] extends readonly unknown[] ? K : never;
}[keyof T];

/** Extract the element type of the array stored at key `K` of `T`. */
type ArrayElement<T, K extends keyof T> = T[K] extends readonly (infer U)[] ? U : never;

/** Options controlling a `paginate` traversal over `PageInfo`-based pages. */
export interface PaginateOptions {
    /**
     * Items requested per page. AniList caps this at 50; values above 50 are
     * clamped down to 50. Defaults to 50.
     */
    perPage?: number;

    /** 1-based page number to start from. Defaults to 1. */
    startPage?: number;

    /** Hard cap on pages fetched, guarding against unbounded loops. Defaults to 100. */
    maxPages?: number;

    /**
     * Maximum number of page requests kept in flight at once while collecting
     * results. Pages are always returned in order regardless of completion
     * order, scheduling stops as soon as a fetched page reports
     * `hasNextPage: false`, and every existing guard (`maxPages`, `perPage`
     * clamping) still applies. Defaults to `1` (strictly sequential fetches,
     * matching previous behavior). Values above 8 are clamped down to 8.
     */
    concurrency?: number;
}

/** Options controlling a `paginateChunks` traversal over `hasNextChunk`-based chunks. */
export interface ChunkPaginateOptions {
    /**
     * Entries requested per chunk. Values above the documented maximum of 500
     * are clamped down to 500. Defaults to 500.
     */
    perChunk?: number;

    /** 1-based chunk number to start from. Defaults to 1. */
    startChunk?: number;

    /** Hard cap on chunks fetched, guarding against unbounded loops. Defaults to 100. */
    maxChunks?: number;

    /**
     * Maximum number of chunk requests kept in flight at once while collecting
     * results. Chunks are always returned in order regardless of completion
     * order, scheduling stops as soon as a fetched chunk reports
     * `hasNextChunk: false`, and every existing guard (`maxChunks`, `perChunk`
     * clamping) still applies. Defaults to `1` (strictly sequential fetches,
     * matching previous behavior). Values above 8 are clamped down to 8.
     */
    concurrency?: number;
}

/** The outcome of a `paginate` traversal. */
export interface PaginateResult<TItem> {
    /** Every item collected across all fetched pages, in page order. */
    items: TItem[];

    /** Per-page snapshots (`pageInfo` plus that page's items), one entry per fetched page. */
    pages: Array<{ pageInfo: PageInfo; items: TItem[] }>;

    /** Number of pages fetched. */
    pageCount: number;

    /** `true` when the traversal stopped at `maxPages` before `hasNextPage` was false. */
    truncated: boolean;
}

/** The outcome of a `paginateChunks` traversal. */
export interface ChunkPaginateResult<TItem> {
    /** Every item collected across all fetched chunks, in chunk order. */
    items: TItem[];

    /** Per-chunk snapshots (`hasNextChunk` plus that chunk's items), one entry per fetched chunk. */
    chunks: Array<{ hasNextChunk: boolean; items: TItem[] }>;

    /** Number of chunks fetched. */
    chunkCount: number;

    /** `true` when the traversal stopped at `maxChunks` before `hasNextChunk` was false. */
    truncated: boolean;
}

/**
 * Resolve a numeric option with a fallback, rejecting non-finite or non-positive values.
 * @param value - The caller-supplied value (may be `undefined`).
 * @param fallback - The default to use when `value` is not a usable positive integer.
 * @returns A positive, finite integer.
 */
function resolvePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
}

/**
 * Resolve a numeric option like {@link resolvePositiveInt}, then clamp any result
 * above `max` down to exactly `max` so upstream API limits are never exceeded.
 * @param value - The caller-supplied value (may be `undefined`).
 * @param max - The upper bound; larger values are reduced to this.
 * @param fallback - The default to use when `value` is not a usable positive integer.
 * @returns A positive, finite integer no greater than `max`.
 */
function resolveCappedInt(value: number | undefined, max: number, fallback: number): number {
    return Math.min(resolvePositiveInt(value, fallback), max);
}

/**
 * Shared look-ahead driver for {@link paginate} and {@link paginateChunks}.
 *
 * Fetches entries through a sliding window of at most `concurrency` launched-
 * but-unconsumed requests so round-trip latency overlaps instead of stacking,
 * while results are appended strictly in entry-number order no matter when each
 * request settles. Scheduling stops as soon as an entry reports "no more data"
 * or the `maxEntries` guard fires; `truncated` mirrors the sequential semantics.
 *
 * Because the window runs ahead of consumption, up to `concurrency - 1`
 * already-launched requests may complete past a terminal entry; their payloads
 * are drained and discarded so the collected prefix matches what a strictly
 * sequential traversal would have returned.
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @param fetch - Callback that fetches a single entry given its 1-based number.
 * @param startNumber - First entry number to request (already resolved/validated).
 * @param maxEntries - Hard cap on entries fetched (already resolved/validated).
 * @param concurrency - Look-ahead window size (already resolved/clamped).
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard truncated the run.
 */
async function fetchWithLookAhead<TEntry>(
    fetch: (number: number) => Promise<TEntry>,
    startNumber: number,
    maxEntries: number,
    concurrency: number
): Promise<{
    /** Responses ordered by entry number. */
    responses: TEntry[];
    /** Number of entries actually fetched. */
    count: number;
    /** Whether the traversal stopped at `maxEntries` before the source ran out. */
    truncated: boolean;
}> {
    const responses: TEntry[] = [];
    // Requests indexed by slot. Entries are never removed: awaiting an
    // already-settled request must remain possible, because several siblings
    // can settle during the same tick and consumption still happens in order.
    const pending: Promise<void>[] = [];
    let launched = 0;
    let count = 0;
    let truncated = false;

    while (count < maxEntries) {
        // Refill: keep at most `concurrency` requests launched but unconsumed.
        while (launched < maxEntries && launched - count < concurrency) {
            const slot = launched;
            launched += 1;
            const request = fetch(startNumber + slot).then((response) => {
                responses[slot] = response;
            });
            pending[slot] = request;
            // A sibling may reject before this request is ever awaited; mark
            // that secondary rejection handled so Node does not report it as
            // unhandled. The original rejection still propagates through
            // `pending[slot]` when this slot is consumed.
            void request.catch(() => {});
        }

        if (count >= launched) break;

        // Wait for the next unconsumed entry in order. Awaiting an
        // already-settled request is safe: `responses[slot]` is assigned before
        // the corresponding promise resolves.
        await pending[count];
        count += 1;

        const hasMore = extractHasMore(responses[count - 1]);
        if (!hasMore) {
            // Terminal entry: drain already-launched stragglers so nothing
            // dangles, discard their payloads, and stop. Entries past a
            // terminal response are never newly scheduled, and a failure in a
            // drained straggler must not fail the traversal.
            await Promise.allSettled(pending.slice(count));
            responses.length = count;
            return { responses, count, truncated: false };
        }
        if (count >= maxEntries) {
            await Promise.allSettled(pending.slice(count));
            truncated = true;
            break;
        }
    }

    return { responses, count, truncated };
}

/**
 * Read the "more data available" flag from a fetched entry without knowing its
 * concrete shape. Returns `false` for malformed responses so a broken payload
 * ends the traversal instead of looping forever.
 * @param response - A fetched page (`pageInfo.hasNextPage`) or chunk (`hasNextChunk`).
 * @returns Whether further entries exist beyond this one.
 */
function extractHasMore(response: unknown): boolean {
    if (typeof response !== "object" || response === null) return false;
    if ("pageInfo" in response) {
        const pageInfo = (response as { pageInfo?: unknown }).pageInfo;
        if (typeof pageInfo === "object" && pageInfo !== null) {
            return (pageInfo as { hasNextPage?: unknown }).hasNextPage === true;
        }
        return false;
    }
    return (response as { hasNextChunk?: unknown }).hasNextChunk === true;
}

/**
 * Iterate `PageInfo`-based pages until `hasNextPage` is false or `maxPages` is reached.
 *
 * The helper calls `fetchPage(page, perPage)` for each page, extracts the items
 * array at `itemsKey`, and stops when AniList reports no further pages or when the
 * `maxPages` guard fires. The guard prevents accidental unbounded fetch loops.
 * Pass `concurrency` to keep multiple page requests in flight at once; results
 * are still collected strictly in page order.
 *
 * @typeParam TPage - The page response shape (must include `pageInfo`).
 * @typeParam K - The key of the items array on `TPage`.
 * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
 * @param itemsKey - The key of the items array on the page response (e.g. `"media"`, `"users"`).
 * @param options - Optional `perPage`, `startPage`, `maxPages`, and `concurrency` controls.
 * @returns The collected items, per-page snapshots, page count, and whether the guard truncated the run.
 * @see https://docs.anilist.co/reference/object/pageinfo
 * @example
 * ```typescript
 * const result = await paginate(
 *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
 *   "media",
 *   { perPage: 50, maxPages: 10, concurrency: 4 }
 * );
 * console.log(result.items.length, result.truncated);
 * ```
 */
export async function paginate<
    TPage extends { pageInfo: PageInfo },
    K extends ArrayKeys<TPage> & keyof TPage,
>(
    fetchPage: (page: number, perPage: number) => Promise<TPage>,
    itemsKey: K,
    options?: PaginateOptions
): Promise<PaginateResult<ArrayElement<TPage, K>>> {
    const perPage = resolveCappedInt(options?.perPage, MAX_PER_PAGE, DEFAULT_PER_PAGE);
    const startPage = resolvePositiveInt(options?.startPage, 1);
    const maxPages = resolvePositiveInt(options?.maxPages, DEFAULT_MAX_PAGES);
    const concurrency = resolveCappedInt(options?.concurrency, MAX_CONCURRENCY, 1);

    const { responses, count, truncated } = await fetchWithLookAhead(
        (number) => fetchPage(number, perPage),
        startPage,
        maxPages,
        concurrency
    );

    const items: ArrayElement<TPage, K>[] = [];
    const pages: Array<{ pageInfo: PageInfo; items: ArrayElement<TPage, K>[] }> = [];
    for (const response of responses) {
        const pageItems = response[itemsKey] as unknown as ArrayElement<TPage, K>[];
        pages.push({ pageInfo: response.pageInfo, items: pageItems });
        items.push(...pageItems);
    }

    return { items, pages, pageCount: count, truncated };
}

/**
 * Async generator that yields each `PageInfo`-based page response until
 * `hasNextPage` is false or `maxPages` is reached.
 *
 * Use this for streaming or early-exit workflows where collecting every item
 * into memory is unnecessary. The `maxPages` guard still prevents unbounded loops.
 *
 * @typeParam TPage - The page response shape (must include `pageInfo`).
 * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
 * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
 * @yields Each raw page response in turn.
 * @see https://docs.anilist.co/reference/object/pageinfo
 * @example
 * ```typescript
 * for await (const page of paginatePages(
 *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
 * )) {
 *   console.log(page.pageInfo.currentPage, page.media.length);
 *   if (page.media.length > 0 && page.media[0].id === 1) break;
 * }
 * ```
 */
export async function* paginatePages<TPage extends { pageInfo: PageInfo }>(
    fetchPage: (page: number, perPage: number) => Promise<TPage>,
    options?: PaginateOptions
): AsyncGenerator<TPage> {
    const perPage = resolveCappedInt(options?.perPage, MAX_PER_PAGE, DEFAULT_PER_PAGE);
    const startPage = resolvePositiveInt(options?.startPage, 1);
    const maxPages = resolvePositiveInt(options?.maxPages, DEFAULT_MAX_PAGES);

    let page = startPage;
    let pageCount = 0;

    while (pageCount < maxPages) {
        const response = await fetchPage(page, perPage);
        pageCount += 1;
        yield response;
        if (!response.pageInfo.hasNextPage || pageCount >= maxPages) {
            break;
        }
        page += 1;
    }
}

/**
 * Iterate `MediaListCollection` chunks until `hasNextChunk` is false or `maxChunks` is reached.
 *
 * AniList returns large user lists in chunks via the `chunk`/`perChunk`/`hasNextChunk`
 * contract on `MediaListCollection`. This helper advances `chunk` from `startChunk`,
 * extracts the items array at `itemsKey` (typically `"lists"`), and stops when AniList
 * reports no further chunks or when the `maxChunks` guard fires. Pass
 * `concurrency` to keep multiple chunk requests in flight at once; results are
 * still collected strictly in chunk order.
 *
 * @typeParam TChunk - The chunk response shape (must include `hasNextChunk`).
 * @typeParam K - The key of the items array on `TChunk`.
 * @param fetchChunk - Callback that fetches a single chunk given its 1-based number and `perChunk`.
 * @param itemsKey - The key of the items array on the chunk response (e.g. `"lists"`).
 * @param options - Optional `perChunk`, `startChunk`, `maxChunks`, and `concurrency` controls.
 * @returns The collected items, per-chunk snapshots, chunk count, and whether the guard truncated the run.
 * @see https://docs.anilist.co/reference/object/medialistcollection
 * @example
 * ```typescript
 * const result = await paginateChunks(
 *   (chunk, perChunk) => aniLink.anilist.query.mediaListCollection(
 *     { userId: 542244, type: "ANIME", chunk, perChunk }
 *   ),
 *   "lists",
 *   { perChunk: 500, maxChunks: 20, concurrency: 3 }
 * );
 * console.log(result.items.length, result.truncated);
 * ```
 */
export async function paginateChunks<
    TChunk extends { hasNextChunk: boolean },
    K extends ArrayKeys<TChunk> & keyof TChunk,
>(
    fetchChunk: (chunk: number, perChunk: number) => Promise<TChunk>,
    itemsKey: K,
    options?: ChunkPaginateOptions
): Promise<ChunkPaginateResult<ArrayElement<TChunk, K>>> {
    const perChunk = resolveCappedInt(options?.perChunk, MAX_PER_CHUNK, DEFAULT_PER_CHUNK);
    const startChunk = resolvePositiveInt(options?.startChunk, 1);
    const maxChunks = resolvePositiveInt(options?.maxChunks, DEFAULT_MAX_CHUNKS);
    const concurrency = resolveCappedInt(options?.concurrency, MAX_CONCURRENCY, 1);

    const { responses, count, truncated } = await fetchWithLookAhead(
        (number) => fetchChunk(number, perChunk),
        startChunk,
        maxChunks,
        concurrency
    );

    const items: ArrayElement<TChunk, K>[] = [];
    const chunks: Array<{ hasNextChunk: boolean; items: ArrayElement<TChunk, K>[] }> = [];
    for (const response of responses) {
        const chunkItems = response[itemsKey] as unknown as ArrayElement<TChunk, K>[];
        chunks.push({ hasNextChunk: response.hasNextChunk, items: chunkItems });
        items.push(...chunkItems);
    }

    return { items, chunks, chunkCount: count, truncated };
}
