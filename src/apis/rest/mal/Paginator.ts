/**
 * MyAnimeList pagination helpers over the shared pagination engine.
 *
 * MAL's list endpoints paginate with `offset`/`limit` query parameters and
 * signal continuation through the optional `paging.next` URL, with a short
 * page (fewer items returned than requested) as the heuristic when the
 * `paging` node is absent. These helpers adapt that contract to the engine's
 * numeric driver: the caller-supplied `fetchPage` closure maps the
 * traversal's `(page, perPage)` slot arithmetic onto `offset`/`limit`, and
 * the traversal stops at the first page that reports the end of the list:
 * a `paging` node with no `next` URL (authoritative even on a full final
 * page), or a short page when the response carries no `paging` node.
 *
 * This module is the second adapter over `src/base/pagination.ts` (the
 * AniList paginator is the first), which is what makes the engine's
 * provider-neutral seam real.
 */
import { safeInvoke } from "../../../base/hooks";
import { type DiagnosticsMode, type OnHookErrorHandler } from "../../../base/transportTypes";
import { AniLinkValidationError } from "../../../base/AniLinkError";
import {
    bridgeAbortSignal,
    fetchWithLookAhead,
    type PaginationDefaults,
    resolvePaginationOptions,
    streamNumericPages,
} from "../../../base/pagination";
import type { MalPaging } from "./types";

/**
 * Hard cap on entries requested per page. MyAnimeList documents 100 as the
 * maximum for the search and discovery list endpoints; caller-supplied
 * values above the cap are clamped down to it.
 */
const MAX_PER_PAGE = 100;

/**
 * Default entries requested per page: the cap itself, so a traversal asks
 * for the most data MAL allows per round-trip by default.
 */
const DEFAULT_PER_PAGE = MAX_PER_PAGE;

/** Default hard cap on pages fetched, guarding against unbounded loops. */
const DEFAULT_MAX_PAGES = 100;

/**
 * Default look-ahead `concurrency` for the MAL pagination helpers. MAL's
 * rate limit (~1-2 requests per second) makes look-ahead windows
 * counterproductive: sequential fetches respect the limit without pacing
 * machinery, so the default is strictly sequential. Pass a higher
 * `concurrency` only for endpoints known to tolerate bursts.
 */
const DEFAULT_CONCURRENCY = 1;

/**
 * Resolution defaults for MAL list traversals: the shared engine's
 * {@link resolvePaginationOptions} resolves `MalPaginateOptions` against
 * these caps and fallbacks in one place for both MAL helpers.
 */
const MAL_DEFAULTS: PaginationDefaults = {
    naming: "page",
    maxPerEntry: MAX_PER_PAGE,
    defaultPerEntry: DEFAULT_PER_PAGE,
    defaultMaxEntries: DEFAULT_MAX_PAGES,
    defaultConcurrency: DEFAULT_CONCURRENCY,
};

/**
 * {@link MalPage} is the response shape every MyAnimeList list endpoint
 * returns. It contains an items array and an optional paging node.
 *
 * The nine paginated MAL endpoints, `anime.search`, `anime.ranking`,
 * `anime.seasonal`, `anime.suggestions`, `manga.search`, `manga.ranking`,
 * `user.animeList`, `user.mangaList`, and `forum.topics`, return this shape.
 * The pagination helpers accept it directly without an items-key parameter.
 *
 * `forum.topic` paginates posts inside one topic-detail response. Its `data`
 * object contains a `posts` array with its own `paging` node, so it does not
 * fit these helpers, which paginate across responses. Call `topic()` with
 * updated `limit` and `offset` filters to page topic posts.
 *
 * @typeParam TItem - The list entry shape of the paginated endpoint.
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
 */
export interface MalPage<TItem> {
    /** The list entries on this page. */
    data: TItem[];
    /** The paging node with the next-page URL, when the list continues. */
    paging?: MalPaging;
}

/**
 * Options controlling a {@link malPaginate} or {@link malPaginatePages} traversal.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
 */
export interface MalPaginateOptions {
    /**
     * Entries requested per page. Values above 100, the most restrictive
     * documented cap across MAL's list endpoints, are clamped down to 100.
     * Defaults to 100.
     */
    perPage?: number;

    /**
     * 1-based page number to start from. The closure's offset math rotates
     * with it: `startPage: 3` starts at `offset = 2 * perPage`. Defaults to 1.
     */
    startPage?: number;

    /**
     * Hard cap on pages fetched, guarding against unbounded loops. Defaults
     * to 100, which means up to 100 round-trips (up to 10,000 items at the
     * default `perPage`); set an explicit value for cost-sensitive workloads.
     */
    maxPages?: number;

    /**
     * Maximum number of page requests kept in flight at once while collecting
     * results. Pages are always returned in order regardless of completion
     * order, scheduling stops as soon as a fetched page reports the end of
     * the list (a `paging` node with no `next` URL, or a short page when the
     * response carries no `paging` node), and every existing guard
     * (`maxPages`, `perPage` clamping) still applies. Defaults to `1`
     * (strictly sequential) because MAL's rate limit of ~1-2 requests per
     * second makes look-ahead counterproductive; values above 8 are
     * clamped down to 8.
     */
    concurrency?: number;

    /**
     * Optional `AbortSignal` to cancel the traversal. When aborted, all
     * in-flight look-ahead page requests are cancelled immediately so they
     * stop consuming rate-limit budget and bandwidth for payloads that will
     * be discarded. The signal is also forwarded to `fetchPage` calls so the
     * transport layer can abort the underlying HTTP request.
     */
    signal?: AbortSignal;

    /**
     * Optional callback invoked once per page after {@link malPaginate} collects
     * all responses. The callback receives the page's paging node and items array.
     * This function still returns the full `MalPaginateResult`, so the callback
     * does not reduce peak memory or yield items incrementally. Use
     * {@link malPaginatePages} to process pages as they arrive or stop early with
     * `break` or `return`. Errors thrown by the callback are caught and reported
     * through {@link MalPaginateOptions.onHookError} when configured, or through
     * `console.warn` otherwise. The traversal continues.
     */
    onPage?: (page: { paging: MalPaging | undefined; items: unknown[] }) => void;

    /**
     * Optional observer for failures thrown by the
     * {@link MalPaginateOptions.onPage} callback. When provided, a throwing
     * `onPage` callback is reported to this handler with the hook name
     * (`"onPage"`) and the thrown error instead of falling back to
     * `console.warn`. Failures thrown by the observer itself are swallowed so
     * a broken logger cannot fail the traversal.
     */
    onHookError?: OnHookErrorHandler;

    /**
     * Controls how a throwing `onPage` callback with no `onHookError` observer
     * is reported: `"warn"` (default) emits a structured `console.warn`
     * record, `"hook"` requires the observer and never touches the console,
     * and `"silent"` suppresses the report entirely.
     */
    diagnostics?: DiagnosticsMode;
}

/**
 * The outcome of a {@link malPaginate} traversal.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
 */
export interface MalPaginateResult<TItem> {
    /** Every item collected across all fetched pages, in page order. */
    items: TItem[];

    /** Per-page snapshots (the paging node plus that page's items), one entry per fetched page. */
    pages: Array<{ paging: MalPaging | undefined; items: TItem[] }>;

    /** Number of pages fetched. */
    pageCount: number;

    /**
     * `true` when the `maxPages` limit stops traversal before a terminal page
     * arrives. An abort returns the collected prefix with `truncated: false`.
     * Check `signal.aborted` to distinguish an abort from a clean end.
     */
    truncated: boolean;
}

/**
 * Invokes a traversal callback (`onPage`) and swallows any error it throws so
 * a failing observer cannot abort a traversal after all responses have been
 * collected. Delegates to the transport layer's `safeInvoke` so a broken
 * callback is reported through the same mechanism and message shape as every
 * other user-supplied callback in the library.
 *
 * @param callback - The user-supplied callback, when provided.
 * @param name - The callback name, for the failure report.
 * @param onHookError - Consumer callback observing hook failures, when configured.
 * @param diagnostics - The diagnostics mode for the traversal, defaulting to `"warn"`.
 * @param payload - The argument to hand to the callback.
 */
const safeCallback = <T>(
    callback: ((payload: T) => void) | undefined,
    name: string,
    onHookError: OnHookErrorHandler | undefined,
    diagnostics: DiagnosticsMode,
    payload: T
): void => {
    safeInvoke(callback, name, onHookError, diagnostics, payload);
};

/**
 * Reads whether another page exists. MAL's `paging` node takes precedence: a
 * missing `next` URL means the list ended, even if the page is full. Without
 * a `paging` node, a short page ends traversal. Missing or non-array `data`
 * also ends traversal, even when `paging` is present. This prevents a
 * malformed response from triggering requests up to the `maxPages` limit.
 *
 * @param response - A fetched MAL list page.
 * @param perPage - The resolved entries-per-page the request asked for.
 * @returns Whether further pages exist beyond this one.
 */
function extractHasMore(response: MalPage<unknown>, perPage: number): boolean {
    if (!Array.isArray(response.data)) {
        return false;
    }
    if (typeof response.paging === "object" && response.paging !== null) {
        // A JSON `null` next URL is read as "no next page": MAL omits the
        // field in practice, but a nulled link must not cost an extra
        // (empty) page fetch.
        return response.paging.next != null;
    }
    return response.data.length >= perPage;
}

/**
 * Collect items from MyAnimeList list pages until the list ends or the
 * `maxPages` limit is reached.
 *
 * The helper calls `fetchPage(page, perPage, signal)` for each page. The
 * callback maps the page number to endpoint parameters with
 * `offset = (page - 1) * perPage`. A response with a `paging` node and no
 * `next` URL ends traversal, even if the page is full. Without a `paging`
 * node, a short page ends traversal. The `maxPages` limit bounds requests.
 * Like AniList's `paginate`, this helper uses the shared engine.
 *
 * @typeParam TItem - The list entry shape of the paginated endpoint.
 * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and an optional `AbortSignal` forwarded from the traversal; return the raw MAL list response (`{ data, paging? }`).
 * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, `onPage`, and `onHookError` controls.
 * @returns The collected items, per-page snapshots, page count, and whether the `maxPages` guard truncated the run.
 * @throws An {@link AniLinkValidationError} when a fetched page response has no `data` key at all (a closure returning the wrong object); a present non-array value collects nothing.
 * @throws A `TypeError` when a numeric option is defined but not a finite, positive integer.
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
 * @example
 * ```typescript
 * const result = await aniLink.mal.paginate(
 *   (page, perPage, signal) => aniLink.mal.anime.search(
 *     { q: "one piece", limit: perPage, offset: (page - 1) * perPage },
 *     { signal }
 *   ),
 *   { perPage: 100, maxPages: 5 }
 * );
 * console.log(result.items.length, result.pageCount, result.truncated);
 * ```
 */
export async function malPaginate<TItem>(
    fetchPage: (page: number, perPage: number, signal?: AbortSignal) => Promise<MalPage<TItem>>,
    options?: MalPaginateOptions
): Promise<MalPaginateResult<TItem>> {
    const {
        perEntry: perPage,
        startEntry: startPage,
        maxEntries: maxPages,
        concurrency,
        diagnostics,
    } = resolvePaginationOptions(options, MAL_DEFAULTS);

    const { signal, dispose } = bridgeAbortSignal(options?.signal);

    try {
        const { responses, count, truncated } = await fetchWithLookAhead(
            (page) => fetchPage(page, perPage, signal),
            (response) => extractHasMore(response, perPage),
            startPage,
            maxPages,
            concurrency,
            signal
        );

        const items: TItem[] = [];
        const pages: Array<{ paging: MalPaging | undefined; items: TItem[] }> = [];
        for (const response of responses) {
            // A missing `data` key means the closure returned the wrong
            // object. Throw instead of returning an empty result, which is a
            // valid pagination outcome. A present non-array value collects
            // nothing, matching the documented `never[]` case of the
            // AniList helper.
            const raw = response.data as unknown;
            if (raw === undefined) {
                throw new AniLinkValidationError([
                    'malPaginate: the page response has no "data" key. Check the fetchPage closure returns the raw MAL list response.',
                ]);
            }
            const pageItems = Array.isArray(raw) ? (raw as TItem[]) : [];
            pages.push({ paging: response.paging, items: pageItems });
            items.push(...pageItems);
            safeCallback(options?.onPage, "onPage", options?.onHookError, diagnostics, {
                paging: response.paging,
                items: pageItems,
            });
        }

        return { items, pages, pageCount: count, truncated };
    } finally {
        dispose();
    }
}

/**
 * Yields MyAnimeList list pages until the list ends or the `maxPages` limit
 * is reached. The generator has no truncation flag. A terminal page has no
 * `paging.next` URL, or is short when the response has no `paging` node. If
 * the limit stops traversal, the last yielded page was full.
 *
 * Use this generator when you do not need to collect every item in memory or
 * want to stop early. The `maxPages` limit bounds requests. The generator
 * keeps up to `concurrency` page requests in flight. The default is `1`, so
 * requests run sequentially because MAL's rate limit makes look-ahead
 * counterproductive. The generator yields pages in order. If the consumer
 * exits early, a terminal page arrives, or the limit is reached, it waits
 * for already-launched requests and discards their results.
 *
 * The shared `streamNumericPages` engine handles the launch window, terminal
 * page drain, abort bridging, and early-exit cancellation. MAL supplies the
 * terminal predicate: a page ends traversal when it has no `paging.next`
 * URL, is short without a `paging` node, or has malformed `data`. The
 * generator uses the same `onPage`, `onHookError`, and `diagnostics` options
 * as {@link malPaginate}. It calls `onPage` once per yielded page.
 *
 * @typeParam TItem - The list entry shape of the paginated endpoint.
 * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and an optional `AbortSignal` forwarded from the traversal; return the raw MAL list response (`{ data, paging? }`).
 * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, `onPage`, `onHookError`, and `diagnostics` controls.
 * @yields Each raw MAL list page in turn, in page order.
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_get
 * @example
 * ```typescript
 * for await (const page of aniLink.mal.paginatePages(
 *   (page, perPage) => aniLink.mal.user.animeList({
 *     username: "@me",
 *     limit: perPage,
 *     offset: (page - 1) * perPage,
 *   })
 * )) {
 *   console.log(page.data.length);
 * }
 * ```
 */
export async function* malPaginatePages<TItem>(
    fetchPage: (page: number, perPage: number, signal?: AbortSignal) => Promise<MalPage<TItem>>,
    options?: MalPaginateOptions
): AsyncGenerator<MalPage<TItem>> {
    const {
        perEntry: perPage,
        startEntry: startPage,
        maxEntries: maxPages,
        concurrency,
        diagnostics,
    } = resolvePaginationOptions(options, MAL_DEFAULTS);

    for await (const response of streamNumericPages(
        fetchPage,
        // Invert {@link extractHasMore} so both traversal helpers use the
        // same terminal condition. Malformed `data` ends traversal in every
        // branch. When present, MAL's `paging` node is authoritative. A
        // missing `next` URL ends traversal even on a full page. Without a
        // `paging` node, a short page ends traversal.
        (page) => !extractHasMore(page, perPage),
        { perPage, startPage, maxPages, concurrency, signal: options?.signal }
    )) {
        safeCallback(options?.onPage, "onPage", options?.onHookError, diagnostics, {
            paging: response.paging,
            items: Array.isArray(response.data) ? response.data : [],
        });
        yield response;
    }
}
