import type { PageInfo } from "../apis/anilist/interfaces/responses/page/PageInfo";

/** Default items requested per page. AniList caps `perPage` at 50. */
const DEFAULT_PER_PAGE = 50;

/** Default hard cap on pages fetched, guarding against unbounded loops. */
const DEFAULT_MAX_PAGES = 100;

/** Default entries requested per `MediaListCollection` chunk. */
const DEFAULT_PER_CHUNK = 500;

/** Default hard cap on chunks fetched, guarding against unbounded loops. */
const DEFAULT_MAX_CHUNKS = 100;

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
    /** Items requested per page. AniList caps this at 50. Defaults to 50. */
    perPage?: number;

    /** 1-based page number to start from. Defaults to 1. */
    startPage?: number;

    /** Hard cap on pages fetched, guarding against unbounded loops. Defaults to 100. */
    maxPages?: number;
}

/** Options controlling a `paginateChunks` traversal over `hasNextChunk`-based chunks. */
export interface ChunkPaginateOptions {
    /** Entries requested per chunk. Defaults to 500. */
    perChunk?: number;

    /** 1-based chunk number to start from. Defaults to 1. */
    startChunk?: number;

    /** Hard cap on chunks fetched, guarding against unbounded loops. Defaults to 100. */
    maxChunks?: number;
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
 * Iterate `PageInfo`-based pages until `hasNextPage` is false or `maxPages` is reached.
 *
 * The helper calls `fetchPage(page, perPage)` for each page, extracts the items
 * array at `itemsKey`, and stops when AniList reports no further pages or when the
 * `maxPages` guard fires. The guard prevents accidental unbounded fetch loops.
 *
 * @typeParam TPage - The page response shape (must include `pageInfo`).
 * @typeParam K - The key of the items array on `TPage`.
 * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
 * @param itemsKey - The key of the items array on the page response (e.g. `"media"`, `"users"`).
 * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
 * @returns The collected items, per-page snapshots, page count, and whether the guard truncated the run.
 * @see https://docs.anilist.co/reference/object/pageinfo
 * @example
 * ```typescript
 * const result = await paginate(
 *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
 *   "media",
 *   { perPage: 50, maxPages: 10 }
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
    const perPage = resolvePositiveInt(options?.perPage, DEFAULT_PER_PAGE);
    const startPage = resolvePositiveInt(options?.startPage, 1);
    const maxPages = resolvePositiveInt(options?.maxPages, DEFAULT_MAX_PAGES);

    const items: ArrayElement<TPage, K>[] = [];
    const pages: Array<{ pageInfo: PageInfo; items: ArrayElement<TPage, K>[] }> = [];
    let page = startPage;
    let pageCount = 0;
    let truncated = false;

    while (pageCount < maxPages) {
        const response = await fetchPage(page, perPage);
        const pageItems = response[itemsKey] as unknown as ArrayElement<TPage, K>[];
        const pageInfo = response.pageInfo;

        pages.push({ pageInfo, items: pageItems });
        items.push(...pageItems);
        pageCount += 1;

        if (!pageInfo.hasNextPage) {
            break;
        }
        if (pageCount >= maxPages) {
            truncated = true;
            break;
        }
        page += 1;
    }

    return { items, pages, pageCount, truncated };
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
    const perPage = resolvePositiveInt(options?.perPage, DEFAULT_PER_PAGE);
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
 * reports no further chunks or when the `maxChunks` guard fires.
 *
 * @typeParam TChunk - The chunk response shape (must include `hasNextChunk`).
 * @typeParam K - The key of the items array on `TChunk`.
 * @param fetchChunk - Callback that fetches a single chunk given its 1-based number and `perChunk`.
 * @param itemsKey - The key of the items array on the chunk response (e.g. `"lists"`).
 * @param options - Optional `perChunk`, `startChunk`, and `maxChunks` controls.
 * @returns The collected items, per-chunk snapshots, chunk count, and whether the guard truncated the run.
 * @see https://docs.anilist.co/reference/object/medialistcollection
 * @example
 * ```typescript
 * const result = await paginateChunks(
 *   (chunk, perChunk) => aniLink.anilist.query.mediaListCollection(
 *     { userId: 542244, type: "ANIME", chunk, perChunk }
 *   ),
 *   "lists",
 *   { perChunk: 500, maxChunks: 20 }
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
    const perChunk = resolvePositiveInt(options?.perChunk, DEFAULT_PER_CHUNK);
    const startChunk = resolvePositiveInt(options?.startChunk, 1);
    const maxChunks = resolvePositiveInt(options?.maxChunks, DEFAULT_MAX_CHUNKS);

    const items: ArrayElement<TChunk, K>[] = [];
    const chunks: Array<{ hasNextChunk: boolean; items: ArrayElement<TChunk, K>[] }> = [];
    let chunk = startChunk;
    let chunkCount = 0;
    let truncated = false;

    while (chunkCount < maxChunks) {
        const response = await fetchChunk(chunk, perChunk);
        const chunkItems = response[itemsKey] as unknown as ArrayElement<TChunk, K>[];
        const hasNextChunk = response.hasNextChunk;

        chunks.push({ hasNextChunk, items: chunkItems });
        items.push(...chunkItems);
        chunkCount += 1;

        if (!hasNextChunk) {
            break;
        }
        if (chunkCount >= maxChunks) {
            truncated = true;
            break;
        }
        chunk += 1;
    }

    return { items, chunks, chunkCount, truncated };
}
