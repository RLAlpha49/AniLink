/**
 * Provider-neutral pagination machinery.
 *
 * This module owns the transport-agnostic parts of walking a paged remote
 * collection: numeric option resolution and clamping, the look-ahead
 * request driver that overlaps round-trip latency while collecting results
 * strictly in entry order, and the streaming page generator that yields
 * the same traversal one page at a time. Schema-specific contracts — what a
 * page looks like, where the "more data available" flag lives, and per-page
 * size caps — stay with each provider.
 *
 * The driver is key-agnostic: providers with numeric paging (AniList pages,
 * chunks) use slot arithmetic from `startNumber`, while providers with
 * cursor-based paging (MyAnimeList) supply an `extractNextKey` callback so
 * each follow-up request uses the key carried by the previous entry.
 */

/**
 * Upper bound on caller-supplied look-ahead `concurrency`. Values above this
 * are clamped down so a typo like `concurrency: 1000` cannot hammer an API.
 *
 * @see {@link fetchWithLookAhead}
 */
export const MAX_CONCURRENCY = 8;

/**
 * The ordered outcome of a {@link fetchWithLookAhead} traversal.
 *
 * @typeParam TEntry - Raw response shape for one fetched page or chunk.
 * @see {@link fetchWithLookAhead}
 */
export interface LookAheadResult<TEntry> {
    /** Responses ordered by entry number. */
    responses: TEntry[];

    /** Number of entries actually fetched. */
    count: number;

    /**
     * Whether the traversal stopped early — at the `maxEntries` guard, or at
     * a launch bound a received entry reported while that entry still
     * reported more data — so a short read is not mistaken for a clean end.
     */
    truncated: boolean;
}

/**
 * Resolve a numeric option with a fallback, throwing on defined-but-invalid values.
 *
 * A defined value that is not a finite, positive integer (for example
 * `perPage: -5`, `NaN`, `0`, or `2.7`) is a caller bug and throws a
 * `TypeError` instead of silently coercing to the fallback — a negative
 * `maxPages` typo silently becoming a 100-page traversal is far harder to
 * debug than a thrown error at the call site. This matches the
 * fail-fast convention of `resolveAgents` and `resolveRequestOptions`.
 * Fractional values are floored (the only defensible coercion for a
 * count-like option); `undefined` falls back.
 *
 * @param value - The caller-supplied value (may be `undefined`).
 * @param fallback - The default to use when `value` is `undefined`.
 * @param name - The option name used in the error message.
 * @returns A positive, finite integer.
 * @throws A `TypeError` when `value` is defined but not a finite, positive number.
 * @see {@link resolveCappedInt}
 */
export function resolvePositiveInt(
    value: number | undefined,
    fallback: number,
    name = "option"
): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value <= 0) {
        throw new TypeError(`Invalid ${name} ${value}: it must be a finite number greater than 0.`);
    }
    return Math.floor(value);
}

/**
 * Resolve a numeric option like {@link resolvePositiveInt}, then clamp any result
 * above `max` down to exactly `max` so upstream API limits are never exceeded.
 * Values above the cap are clamped (not thrown) because exceeding a
 * provider-documented cap is a legitimate tuning attempt, not a bug.
 *
 * @param value - The caller-supplied value (may be `undefined`).
 * @param max - The upper bound; larger values are reduced to this.
 * @param fallback - The default to use when `value` is `undefined`.
 * @param name - The option name used in the error message.
 * @returns A positive, finite integer no greater than `max`.
 * @throws A `TypeError` when `value` is defined but not a finite, positive number.
 * @see {@link resolvePositiveInt}
 */
export function resolveCappedInt(
    value: number | undefined,
    max: number,
    fallback: number,
    name = "option"
): number {
    return Math.min(resolvePositiveInt(value, fallback, name), max);
}

/**
 * The result of bridging an external abort signal into a traversal-owned
 * controller. Call {@link AbortBridge.dispose} in a `finally` block so the
 * listener attached to the external signal is removed when the traversal
 * ends, preventing leaks on long-lived controllers. `dispose` also aborts
 * the traversal-owned controller so any still-in-flight look-ahead requests
 * launched but never consumed (consumer `break`, a mid-traversal rejection,
 * or normal completion with stragglers) are cancelled immediately instead
 * of running to completion and consuming rate-limit budget for payloads
 * that will be discarded.
 */
export interface AbortBridge {
    /** The traversal-owned signal to forward to `fetch` callbacks. */
    signal: AbortSignal;
    /**
     * Aborts the traversal-owned controller (cancelling in-flight look-ahead
     * requests that have not been consumed) and removes the abort listener
     * from the external signal. Safe to call when no listener was attached
     * and idempotent under repeated calls.
     */
    dispose: () => void;
}

/**
 * Bridges an optional external `AbortSignal` into a traversal-owned
 * `AbortController` so a single caller-supplied signal can cancel many
 * in-flight requests. The returned `dispose` function aborts the
 * traversal-owned controller and removes the listener from the external
 * signal; it must be called in a `finally` block so a long-lived external
 * controller does not accumulate one listener per traversal and so
 * already-launched look-ahead requests are cancelled when the traversal
 * ends early.
 *
 * When `external` is `undefined`, a fresh un-aborted controller is created
 * and `dispose` only aborts that controller (no external listener to remove).
 *
 * @param external - The caller-supplied signal, when provided.
 * @returns The bridge holding the traversal signal and its cleanup function.
 */
export function bridgeAbortSignal(external: AbortSignal | undefined): AbortBridge {
    const controller = new AbortController();
    if (external === undefined) {
        return { signal: controller.signal, dispose: () => controller.abort() };
    }
    if (external.aborted) {
        controller.abort();
        return { signal: controller.signal, dispose: () => {} };
    }
    const onAbort = (): void => controller.abort();
    external.addEventListener("abort", onAbort, { once: true });
    return {
        signal: controller.signal,
        dispose: () => {
            controller.abort();
            external.removeEventListener("abort", onAbort);
        },
    };
}

/**
 * Shared look-ahead driver for paged traversals.
 *
 * Fetches entries through a sliding window of at most `concurrency` launched-
 * but-unconsumed requests so round-trip latency overlaps instead of stacking,
 * while results are appended strictly in entry order no matter when each
 * request settles. Scheduling stops as soon as an entry reports "no more data"
 * (per the caller-supplied `extractHasMore`), at the `maxEntries` guard, or —
 * when `extractBound` is supplied — at the smallest launch bound a received
 * entry reported; `truncated` mirrors the sequential semantics.
 *
 * Because the window runs ahead of consumption, up to `concurrency - 1`
 * already-launched requests may complete past a terminal entry; their payloads
 * are drained and discarded so the collected prefix matches what a strictly
 * sequential traversal would have returned.
 *
 * When the optional `signal` is aborted, any in-flight requests are settled
 * (their payloads discarded) and the entries collected so far are returned as
 * a partial result with `truncated: false` — the abort is not propagated as a
 * rejection.
 *
 * Two call shapes are supported via explicit overloads: numeric paging (this
 * signature) and cursor paging (the companion overload below).
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @param fetch - Callback that fetches a single entry given its numeric page key.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry. Return `false` for malformed responses so a broken payload ends the traversal instead of looping forever.
 * @param startNumber - The 1-based page number to start from.
 * @param maxEntries - Hard cap on entries fetched, guarding against unbounded loops.
 * @param concurrency - Maximum number of requests kept in flight at once.
 * @param signal - Optional `AbortSignal` to cancel the traversal.
 * @param extractBound - Optional reader for the terminal page bound a fetched entry reports (AniList's `pageInfo.lastPage`). Supply it only when entry numbers are page numbers; chunk-style traversals omit it so their scheduling is governed solely by the terminal entry and guard checks.
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard or a reported launch bound truncated the run.
 * @throws The rejection from the next unconsumed `fetch` call in entry order,
 *         unless the `signal` aborted (in which case a partial result is returned).
 * @see {@link LookAheadResult}
 */
export async function fetchWithLookAhead<TEntry>(
    fetch: (key: number) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    startNumber: number,
    maxEntries: number,
    concurrency: number,
    signal?: AbortSignal,
    extractBound?: (response: TEntry) => number | undefined
): Promise<LookAheadResult<TEntry>>;
/**
 * Shared look-ahead driver for paged traversals — cursor paging overload.
 *
 * Cursor paging is for providers whose next key is carried by the previous
 * response (for example MyAnimeList). Each consumed entry supplies the key
 * for its successor via `extractNextKey`; the first key is `firstKey`. Cursor
 * mode never schedules past a terminal entry even if that entry still carries
 * a stale next key. Because the next key depends on the previous response,
 * requests form a dependency chain and the look-ahead window is effectively 1
 * regardless of the supplied `concurrency`.
 *
 * See the numeric paging overload above for the shared abort, drain, and
 * `truncated` semantics.
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @typeParam TKey - The paging key type: an opaque cursor value.
 * @param fetch - Callback that fetches a single entry given its paging key.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry. Return `false` for malformed responses so a broken payload ends the traversal instead of looping forever.
 * @param extractNextKey - Reads the next paging key from a fetched entry. Pass `undefined` to select numeric paging (use the numeric overload instead in that case).
 * @param firstKey - The paging key to start from.
 * @param maxEntries - Hard cap on entries fetched, guarding against unbounded loops.
 * @param concurrency - Maximum number of requests kept in flight at once (effectively 1 in cursor mode).
 * @param signal - Optional `AbortSignal` to cancel the traversal.
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard truncated the run.
 * @throws The rejection from the next unconsumed `fetch` call in entry order,
 *         unless the `signal` aborted (in which case a partial result is returned).
 * @see {@link LookAheadResult}
 */
export async function fetchWithLookAhead<TEntry, TKey>(
    fetch: (key: TKey) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    extractNextKey: ((response: TEntry) => TKey) | undefined,
    firstKey: TKey,
    maxEntries: number,
    concurrency: number,
    signal?: AbortSignal
): Promise<LookAheadResult<TEntry>>;
/**
 * Implementation signature for {@link fetchWithLookAhead}. Not directly
 * callable — callers resolve to one of the two public overloads above. The
 * rest parameter carries each call shape as its own labeled tuple, so the
 * mode is selected structurally: a function in the third slot routes to
 * {@link fetchCursorChain}; a number (or the legacy `undefined` extractor)
 * routes to {@link fetchNumericWithLookAhead}. All scheduling logic lives
 * in those drivers.
 */
export async function fetchWithLookAhead<TEntry, TKey = number>(
    ...args:
        | [
              fetch: (key: number) => Promise<TEntry>,
              extractHasMore: (response: TEntry) => boolean,
              startNumber: number,
              maxEntries: number,
              concurrency: number,
              signal?: AbortSignal,
              extractBound?: (response: TEntry) => number | undefined,
          ]
        | [
              fetch: (key: number) => Promise<TEntry>,
              extractHasMore: (response: TEntry) => boolean,
              extractNextKey: undefined,
              startNumber: number,
              maxEntries: number,
              concurrency: number,
              signal?: AbortSignal,
          ]
        | [
              fetch: (key: TKey) => Promise<TEntry>,
              extractHasMore: (response: TEntry) => boolean,
              extractNextKey: (response: TEntry) => TKey,
              firstKey: TKey,
              maxEntries: number,
              concurrency: number,
              signal?: AbortSignal,
          ]
): Promise<LookAheadResult<TEntry>> {
    if (typeof args[2] === "function") {
        // Cursor shape: (fetch, extractHasMore, extractNextKey, firstKey,
        // maxEntries, concurrency, signal?) — concurrency is structurally
        // impossible in a dependency chain, so it is dropped here.
        const [fetch, extractHasMore, extractNextKey, firstKey, maxEntries, , signal] = args;
        return fetchCursorChain(
            fetch,
            extractHasMore,
            extractNextKey,
            firstKey,
            maxEntries,
            signal
        );
    }
    if (args[2] === undefined) {
        // Legacy numeric call shape:
        // (fetch, extractHasMore, undefined, startNumber, maxEntries,
        // concurrency, signal?)
        const [fetch, extractHasMore, , startNumber, maxEntries, concurrency, signal] = args;
        return fetchNumericWithLookAhead(
            fetch,
            extractHasMore,
            startNumber,
            maxEntries,
            concurrency,
            signal
        );
    }
    // Numeric overload: (fetch, extractHasMore, startNumber, maxEntries,
    // concurrency, signal?, extractBound?)
    const [fetch, extractHasMore, startNumber, maxEntries, concurrency, signal, extractBound] =
        args;
    return fetchNumericWithLookAhead(
        fetch,
        extractHasMore,
        startNumber,
        maxEntries,
        concurrency,
        signal,
        extractBound
    );
}

/**
 * Read the terminal-page bound a fetched page reports — AniList's
 * `pageInfo.lastPage` — so numeric look-ahead scheduling can stop launching
 * pages the server has already said do not exist. AniList page traversals
 * pass this as the look-ahead driver's `extractBound`; chunk traversals
 * supply no bound reader. Returns `undefined` when
 * the response carries no usable bound (a non-object payload, a missing or
 * malformed `pageInfo`, or a `lastPage` that is not a positive finite number,
 * such as the `0` AniList reports when the true count is unknown), leaving
 * scheduling to the existing terminal-entry and guard checks.
 *
 * @param response - A fetched page response of any shape.
 * @returns The positive `lastPage` bound reported by the page, or `undefined` when unknown.
 * @see {@link fetchNumericWithLookAhead}
 */
export function extractLastPageBound(response: unknown): number | undefined {
    if (typeof response !== "object" || response === null) return undefined;
    const pageInfo = (response as { pageInfo?: unknown }).pageInfo;
    if (typeof pageInfo !== "object" || pageInfo === null) return undefined;
    const lastPage = (pageInfo as { lastPage?: unknown }).lastPage;
    if (typeof lastPage !== "number" || !Number.isFinite(lastPage) || lastPage <= 0) {
        return undefined;
    }
    return lastPage;
}

/**
 * Numeric-mode look-ahead driver: keys are computable without any response,
 * so a window of at most `concurrency` launched-but-unconsumed requests
 * overlaps round-trip latency while results are appended strictly in entry
 * order. Scheduling stops as soon as an entry reports "no more data" or the
 * `maxEntries` guard fires; already-launched stragglers are drained and
 * discarded. When `extractBound` is supplied (AniList page traversals pass
 * {@link extractLastPageBound}), scheduling also never launches an entry
 * numbered beyond the smallest positive bound a received entry reported:
 * those requests were going to be drained and discarded anyway, so skipping
 * them keeps their quota spend off the wire. A traversal the bound ends while
 * the last consumed entry still reports more data returns `truncated: true`
 * so the short read is not mistaken for a clean end. Traversals whose entries
 * carry no page numbers (chunks) omit `extractBound` and leave the existing
 * guards in charge. An abort settles in-flight requests and returns the
 * collected prefix as a partial result with `truncated: false`.
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @param fetch - Callback that fetches a single entry given its numeric key.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry.
 * @param startNumber - The 1-based page number to start from.
 * @param maxEntries - Hard cap on entries fetched, guarding against unbounded loops.
 * @param concurrency - Maximum number of requests kept in flight at once.
 * @param signal - Optional `AbortSignal` to cancel the traversal.
 * @param extractBound - Optional reader for the terminal page bound a fetched entry reports (AniList's `pageInfo.lastPage`); omit it for chunk-style traversals whose entries carry no page numbers.
 * @returns The responses in entry order, how many were fetched, and whether the guard or a reported bound truncated the run.
 * @throws The rejection from the next unconsumed `fetch` call in entry order, unless the `signal` aborted.
 * @see {@link LookAheadResult}
 */
export async function fetchNumericWithLookAhead<TEntry>(
    fetch: (page: number) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    startNumber: number,
    maxEntries: number,
    concurrency: number,
    signal?: AbortSignal,
    extractBound?: (response: TEntry) => number | undefined
): Promise<LookAheadResult<TEntry>> {
    const responses: TEntry[] = [];
    const pending: Promise<void>[] = [];
    let launched = 0;
    let count = 0;
    let truncated = false;
    // Optional terminal-page bound reader. Chunk traversals share this
    // driver and their entries carry no page numbers, so they omit it and
    // the bound below stays `Infinity` forever — page semantics belong to
    // the callers that know their entries are pages.
    const readBound = extractBound ?? ((): number | undefined => undefined);
    // Smallest positive bound observed on a received entry; `Infinity` until
    // one reports it. The bound only tightens (min), so a later entry
    // reporting a larger value cannot re-open the window.
    let lastPageBound = Number.POSITIVE_INFINITY;

    while (count < maxEntries) {
        if (signal?.aborted) {
            await Promise.allSettled(pending.slice(count));
            responses.length = count;
            return { responses, count, truncated: false };
        }
        while (
            launched < maxEntries &&
            launched - count < concurrency &&
            startNumber + launched <= lastPageBound
        ) {
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

        if (count >= launched) {
            // With entries still under the guard, only a launch bound can
            // empty the window (the maxEntries and concurrency gates always
            // leave launched ahead of count). Exiting there while the last
            // consumed entry still reports more data means the bound cut the
            // traversal short — surface that like any other truncation
            // instead of a silent clean end.
            if (count > 0 && extractHasMore(responses[count - 1])) {
                truncated = true;
            }
            break;
        }

        try {
            await pending[count];
        } catch (err) {
            if (signal?.aborted) {
                await Promise.allSettled(pending.slice(count + 1));
                responses.length = count;
                return { responses, count, truncated: false };
            }
            throw err;
        }
        count += 1;

        // Tighten the launch bound from the entry just consumed: entries
        // beyond the reported last page would only be drained and discarded.
        const observedBound = readBound(responses[count - 1]);
        if (observedBound !== undefined && observedBound < lastPageBound) {
            lastPageBound = observedBound;
        }

        if (!extractHasMore(responses[count - 1])) {
            // Terminal entry: drain already-launched stragglers so nothing
            // dangles, discard their payloads, and stop.
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
 * Cursor-mode driver: each key is carried by the previous response, so
 * requests form a dependency chain and the traversal is strictly serial —
 * the signature has no `concurrency` parameter because none is possible.
 * The chain ends at a terminal entry, when an entry carries no next key, at
 * the `maxEntries` guard, or on abort (returning the collected prefix as a
 * partial result with `truncated: false`).
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @typeParam TKey - The paging key type: an opaque cursor value.
 * @param fetch - Callback that fetches a single entry given its paging key.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry.
 * @param extractNextKey - Reads the next paging key from a fetched entry.
 * @param firstKey - The paging key to start from.
 * @param maxEntries - Hard cap on entries fetched, guarding against unbounded loops.
 * @param signal - Optional `AbortSignal` to cancel the traversal.
 * @returns The responses in entry order, how many were fetched, and whether the guard truncated the run.
 * @throws The rejection from the current `fetch` call, unless the `signal` aborted.
 * @see {@link LookAheadResult}
 */
export async function fetchCursorChain<TEntry, TKey>(
    fetch: (key: TKey) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    extractNextKey: (response: TEntry) => TKey,
    firstKey: TKey,
    maxEntries: number,
    signal?: AbortSignal
): Promise<LookAheadResult<TEntry>> {
    const responses: TEntry[] = [];
    let key: TKey | undefined = firstKey;

    while (responses.length < maxEntries && key !== undefined) {
        if (signal?.aborted) {
            return { responses, count: responses.length, truncated: false };
        }
        let entry: TEntry;
        try {
            entry = await fetch(key);
        } catch (err) {
            if (signal?.aborted) {
                return { responses, count: responses.length, truncated: false };
            }
            throw err;
        }
        responses.push(entry);
        if (!extractHasMore(entry)) {
            return { responses, count: responses.length, truncated: false };
        }
        key = extractNextKey(entry);
    }

    return {
        responses,
        count: responses.length,
        // A degenerate guard (maxEntries <= 0) fetched nothing and cut
        // nothing short: `truncated` reports whether the guard ended a run
        // that still had data, matching the numeric driver's `while (count <
        // maxEntries)` early exit.
        truncated: responses.length >= maxEntries && maxEntries > 0,
    };
}

/**
 * Options controlling a {@link streamNumericPages} traversal.
 *
 * Every field is the provider-resolved value — defaults applied, caps
 * enforced. The provider adapters own those rules; the engine only
 * consumes the results.
 *
 * @see {@link streamNumericPages}
 */
export interface StreamNumericPagesOptions {
    /** Entries requested per page, forwarded verbatim to every `fetchPage` call. */
    perPage: number;
    /** 1-based page number the traversal starts from. */
    startPage: number;
    /** Hard cap on pages fetched, guarding against unbounded loops. */
    maxPages: number;
    /** Maximum number of page requests kept in flight at once. */
    concurrency: number;
    /** Optional `AbortSignal` to cancel the traversal. */
    signal?: AbortSignal;
}

/**
 * Streaming numeric-page driver: the generator counterpart of
 * {@link fetchNumericWithLookAhead}.
 *
 * Yields pages strictly in page order while keeping a window of at most
 * `concurrency` launched-but-unconsumed requests in flight, so round-trip
 * latency overlaps without reordering results. Scheduling stops as soon as
 * a fetched page is terminal per the caller-supplied `isTerminalPage`, at
 * the `maxPages` guard, or — when `extractBound` is supplied — beyond the
 * smallest launch bound a received page reported; already-launched
 * stragglers are drained and their payloads discarded. On early exit
 * (`break`/`return` by the consumer), the `finally` block disposes the
 * abort bridge so unconsumed in-flight requests are cancelled instead of
 * running to completion for payloads that will be discarded.
 *
 * A page rejection propagates to the consumer unless the traversal signal
 * aborted, in which case the generator ends after the already-yielded
 * prefix. An already-aborted signal yields nothing.
 *
 * @typeParam TPage - The raw response shape of a single page.
 * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and the traversal's `AbortSignal`.
 * @param isTerminalPage - Reads the end-of-list signal from a fetched page; a terminal page is yielded, then the traversal ends.
 * @param options - The provider-resolved traversal options; see {@link StreamNumericPagesOptions}.
 * @param extractBound - Optional reader for the terminal page bound a fetched page reports (AniList's `pageInfo.lastPage`); scheduling never launches a page numbered beyond the smallest reported bound.
 * @yields Each fetched page, in page order.
 * @see {@link fetchNumericWithLookAhead}
 * @see {@link bridgeAbortSignal}
 */
export async function* streamNumericPages<TPage>(
    fetchPage: (page: number, perPage: number, signal?: AbortSignal) => Promise<TPage>,
    isTerminalPage: (response: TPage) => boolean,
    options: StreamNumericPagesOptions,
    extractBound?: (response: TPage) => number | undefined
): AsyncGenerator<TPage> {
    const { perPage, startPage, maxPages, concurrency } = options;

    const { signal, dispose } = bridgeAbortSignal(options.signal);

    if (signal.aborted) {
        dispose();
        return;
    }

    const pending = new Map<number, Promise<TPage>>();
    let nextToLaunch = startPage;
    let nextToYield = startPage;
    let terminal = false;
    // Smallest positive launch bound observed on a received page;
    // `Infinity` until one reports it (or forever when no `extractBound` is
    // supplied). The bound only tightens (min), so a later page reporting a
    // larger value cannot re-open the window.
    let launchBound = Number.POSITIVE_INFINITY;
    const readBound = extractBound ?? ((): number | undefined => undefined);

    const launchWindow = (): void => {
        while (
            !terminal &&
            nextToLaunch - startPage < maxPages &&
            pending.size < concurrency &&
            nextToLaunch <= launchBound
        ) {
            const page = nextToLaunch;
            nextToLaunch += 1;
            const request = fetchPage(page, perPage, signal);
            pending.set(page, request);
            // A sibling may reject before this request is ever awaited; mark
            // that secondary rejection handled so Node does not report it as
            // unhandled. The original rejection still propagates through
            // the awaited `pending.get(page)` when the slot is consumed.
            void request.catch(() => {});
        }
    };

    try {
        while (nextToYield - startPage < maxPages) {
            launchWindow();
            const page = nextToYield;
            const request = pending.get(page);
            if (request === undefined) {
                break;
            }
            let response: TPage;
            try {
                response = await request;
            } catch (err) {
                if (signal.aborted) {
                    break;
                }
                throw err;
            }
            pending.delete(page);
            nextToYield += 1;
            // Tighten the launch bound from the page just consumed: pages
            // beyond the reported last page would only be drained and
            // discarded on the consumer's early exit. Duck-typed so a
            // malformed page leaves the existing guards in charge instead of
            // throwing inside the bound bookkeeping.
            const observedBound = readBound(response);
            if (observedBound !== undefined && observedBound < launchBound) {
                launchBound = observedBound;
            }
            yield response;
            if (isTerminalPage(response)) {
                terminal = true;
                await Promise.allSettled([...pending.values()]);
                break;
            }
        }
    } finally {
        dispose();
        pending.clear();
    }
}
