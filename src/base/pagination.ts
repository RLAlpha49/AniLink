/**
 * Provider-neutral pagination machinery.
 *
 * This module owns the transport-agnostic parts of walking a paged remote
 * collection: numeric option resolution and clamping, plus the look-ahead
 * request driver that overlaps round-trip latency while collecting results
 * strictly in entry order. Schema-specific contracts — what a page looks
 * like, where the "more data available" flag lives, and per-page size caps —
 * stay with each provider.
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

    /** Whether the traversal stopped at `maxEntries` before the source ran out. */
    truncated: boolean;
}

/**
 * Resolve a numeric option with a fallback, rejecting non-finite or non-positive values.
 * @param value - The caller-supplied value (may be `undefined`).
 * @param fallback - The default to use when `value` is not a usable positive integer.
 * @returns A positive, finite integer.
 * @see {@link resolveCappedInt}
 */
export function resolvePositiveInt(value: number | undefined, fallback: number): number {
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
 * @see {@link resolvePositiveInt}
 */
export function resolveCappedInt(value: number | undefined, max: number, fallback: number): number {
    return Math.min(resolvePositiveInt(value, fallback), max);
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
 * (per the caller-supplied `extractHasMore`) or the `maxEntries` guard fires;
 * `truncated` mirrors the sequential semantics.
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
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard truncated the run.
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
    signal?: AbortSignal
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
 * third argument dispatches the mode: a function (or `undefined`) selects
 * cursor paging; a number selects numeric paging. Because the two overloads
 * have different arities (6 vs 7 params), the numeric overload's optional
 * `signal` lands in the sixth implementation slot.
 */
export async function fetchWithLookAhead<TEntry, TKey = number>(
    fetch: (key: TKey) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    extractNextKeyOrStartNumber: ((response: TEntry) => TKey) | undefined | number,
    firstKeyOrMaxEntries: TKey | number,
    maxEntriesOrConcurrency: number,
    concurrencyOrSignal: number | AbortSignal | undefined,
    maybeSignal?: AbortSignal
): Promise<LookAheadResult<TEntry>> {
    let extractNextKey: ((response: TEntry) => TKey) | undefined;
    let firstKey: TKey;
    let numericStart: number | undefined;
    let maxEntries: number;
    let concurrency: number;
    let signal: AbortSignal | undefined;

    if (
        typeof extractNextKeyOrStartNumber === "function" ||
        extractNextKeyOrStartNumber === undefined
    ) {
        // Cursor mode: (fetch, extractHasMore, extractNextKey, firstKey, maxEntries, concurrency, signal?)
        extractNextKey = extractNextKeyOrStartNumber as ((response: TEntry) => TKey) | undefined;
        firstKey = firstKeyOrMaxEntries as TKey;
        maxEntries = maxEntriesOrConcurrency;
        concurrency = concurrencyOrSignal as number;
        signal = maybeSignal;
        if (extractNextKey === undefined) {
            numericStart = firstKey as unknown as number;
        }
    } else {
        // Numeric mode: (fetch, extractHasMore, startNumber, maxEntries, concurrency, signal?)
        // The numeric overload has 6 params; the implementation has 7, so:
        //   p3 = startNumber, p4 = maxEntries, p5 = concurrency, p6 = signal.
        numericStart = extractNextKeyOrStartNumber as number;
        maxEntries = firstKeyOrMaxEntries as unknown as number;
        concurrency = maxEntriesOrConcurrency;
        signal =
            typeof concurrencyOrSignal === "number"
                ? undefined
                : (concurrencyOrSignal as AbortSignal | undefined);
        firstKey = numericStart as unknown as TKey;
    }

    const responses: TEntry[] = [];
    const pending: Promise<void>[] = [];
    let launched = 0;
    let count = 0;
    let truncated = false;
    let pendingCursorKey: TKey | undefined = extractNextKey === undefined ? undefined : firstKey;

    // In cursor mode the next key is carried by the previous response, so
    // requests form a dependency chain: at most one may be in flight, and the
    // caller-supplied window cannot be honored. Numeric mode keeps the full
    // look-ahead window because keys are computable without any response.
    const effectiveConcurrency = extractNextKey === undefined ? concurrency : 1;

    while (count < maxEntries) {
        if (signal?.aborted) {
            await Promise.allSettled(pending.slice(count));
            responses.length = count;
            return { responses, count, truncated: false };
        }
        while (launched < maxEntries && launched - count < effectiveConcurrency) {
            const slot = launched;
            const key =
                extractNextKey === undefined
                    ? (numericStart as number) + slot
                    : (pendingCursorKey as TKey);
            launched += 1;
            const request = fetch(key as TKey).then((response) => {
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
        // the corresponding promise resolves. An abort that fires while this
        // await is pending rejects the in-flight `fetch`; treat that as a
        // partial-result termination (consistent with the top-of-loop abort
        // check) instead of letting the rejection propagate.
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

        const consumed = responses[count - 1];
        const hasMore = extractHasMore(consumed);
        if (!hasMore) {
            // Terminal entry: drain already-launched stragglers so nothing
            // dangles, discard their payloads, and stop. Entries past a
            // terminal response are never newly scheduled, and a failure in a
            // drained straggler must not fail the traversal.
            await Promise.allSettled(pending.slice(count));
            responses.length = count;
            return { responses, count, truncated: false };
        }
        if (extractNextKey !== undefined) {
            // Cursor mode: the just-consumed entry decides the next key. The
            // refill loop launches at most one successor per consumed entry,
            // so a single pending key is sufficient.
            pendingCursorKey = extractNextKey(consumed);
        }
        if (count >= maxEntries) {
            await Promise.allSettled(pending.slice(count));
            truncated = true;
            break;
        }
    }

    return { responses, count, truncated };
}
