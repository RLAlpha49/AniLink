/**
 * MyAnimeList pagination helpers over the shared pagination engine.
 *
 * MAL's list endpoints paginate with `offset`/`limit` query parameters and
 * signal continuation through the optional `paging.next` URL, with a short
 * page (fewer items returned than requested) as the heuristic when the
 * `paging` node is absent. These helpers adapt that contract to the engine's
 * numeric driver: the caller-supplied `fetchPage` closure maps the
 * traversal's `(page, perPage)` slot arithmetic onto `offset`/`limit`, and
 * the traversal stops at the first page that reports the end of the list —
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
 * {@link MalPage} is the response shape every MyAnimeList list endpoint returns: the items array plus the optional paging node.
 *
 * The nine paginated MAL endpoints — `anime.search`, `anime.ranking`, `anime.seasonal`, `anime.suggestions`, `manga.search`, `manga.ranking`, `user.animeList`, `user.mangaList`, and `forum.topics` — return exactly this shape, so the pagination helpers take and yield it directly instead of an items-key parameter.
 *
 * `forum.topic` is the one list-shaped exception: it paginates posts *inside*
 * one response (`data` is a single topic-detail object whose `posts` array
 * carries its own `paging` node), not across responses, so it does not fit
 * these helpers. Page its posts with repeated `topic()` calls advancing the
 * `limit`/`offset` post filters instead.
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
     * Entries requested per page. Values above 100 — the most restrictive
     * documented cap across MAL's list endpoints — are clamped down to 100.
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
     * Optional per-page callback invoked once per page **after all responses
     * have been collected**, as the results are gathered into the returned
     * `MalPaginateResult`. This is a post-collection notification, not a
     * streaming hook: because {@link malPaginate} collects every response
     * before returning, this callback does **not** reduce peak memory or
     * release collected items incrementally. For true streaming, early-exit,
     * or memory-bounded workflows, use {@link malPaginatePages} instead — it
     * yields each page as it arrives and lets the consumer `break` or
     * `return` to stop the traversal. The callback receives the page's paging
     * node and items array; the full `MalPaginateResult` is still returned for
     * callers that need the collected items. Errors thrown by the callback
     * are caught, reported through {@link MalPaginateOptions.onHookError}
     * when configured (falling back to `console.warn`), and swallowed, so a
     * failing observer cannot fail the traversal.
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
     * `true` when the traversal stopped at the `maxPages` guard before a
     * terminal page ended the run. An aborted traversal (the `signal` fired
     * mid-run) returns the collected prefix with `truncated: false` — check
     * `signal.aborted` if you need to distinguish a clean end from an
     * aborted one.
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
 * Read the "more data available" signal from a fetched MAL page. MAL's own
 * `paging` node is authoritative when present: a node with no `next` URL
 * says the list ended even when the page came back full (the offset math
 * cannot know), so a full final page costs no extra round-trip. The
 * short-page heuristic (a page that returned fewer entries than requested)
 * remains the fallback for responses with no `paging` node at all. A
 * malformed `data` (missing or non-array) ends the traversal in every
 * branch — a broken payload must never keep the traversal launching pages
 * up to the `maxPages` guard, whether or not it carries a `paging` node.
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
 * Iterate MyAnimeList list pages until the end of the list or the `maxPages` guard is reached, collecting every item across pages.
 *
 * The helper calls `fetchPage(page, perPage, signal)` for each page — the
 * closure maps the slot arithmetic onto the endpoint's `offset`/`limit` query
 * parameters (`offset = (page - 1) * perPage`) — and stops at the first
 * page that reports the end of the list: MAL's own `paging` node is
 * authoritative when present (a node with no `next` URL ends the run even
 * when the page came back full, so a full final page costs no extra
 * confirmation request), with the short-page heuristic (a page that
 * returned fewer items than requested) as the fallback for responses
 * with no `paging` node at all. The `maxPages` guard prevents accidental
 * unbounded fetch loops. This is the MAL sibling of the AniList `paginate`
 * helper; both run over the same shared engine.
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
            // A missing `data` key is a closure bug (the wrong object handed
            // back) and must fail loudly — a silent empty result is the
            // hardest failure to debug in a pagination API where empty is a
            // normal outcome. A present non-array value collects nothing,
            // matching the documented `never[]` case of the AniList helper.
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
 * Async generator that yields each MyAnimeList list page until the end of
 * the list or the `maxPages` guard is reached. The generator ends without a
 * truncation flag — a yielded terminal page (a `paging` node with no `next`
 * URL, or a short page when the response carries no `paging` node) is itself
 * the visible signal of the end of the list, and stopping at the guard means
 * the last yielded page came back full.
 *
 * Use this for streaming or early-exit workflows where collecting every item
 * into memory is unnecessary. The `maxPages` guard still prevents unbounded
 * loops. The generator keeps a window of `concurrency` in-flight page
 * requests (default `1`, strictly sequential — MAL's rate limit makes
 * look-ahead counterproductive) so round-trip latency overlaps while pages
 * are still yielded strictly in page order; on early exit (`break`/`return`
 * by the consumer), a terminal page, or the `maxPages` guard, already-
 * launched stragglers are drained and their payloads discarded.
 *
 * The traversal runs on the shared streaming engine
 * (`streamNumericPages`): the launch window, the terminal-page drain, the
 * abort bridging, and the early-exit cancellation live once for every
 * provider. MAL contributes only its terminal predicate — a `paging` node
 * with no `next` URL, a short page when the response carries no `paging`
 * node, or a malformed `data` array (which ends the traversal instead of
 * looping forever) — and honors the same `onPage`/`onHookError`/
 * `diagnostics` observer contract as {@link malPaginate}, firing `onPage`
 * once per page as it is yielded.
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
        // The terminal predicate is {@link extractHasMore} inverted — one
        // shared definition both traversal helpers consume, so the eager
        // and streaming MAL helpers can never disagree about where the
        // list ends: malformed `data` ends it in every branch, MAL's
        // `paging` node is authoritative when present (a node with no
        // `next` URL ends the traversal even when the page came back
        // full), and the short-page heuristic covers responses with no
        // `paging` node at all.
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
