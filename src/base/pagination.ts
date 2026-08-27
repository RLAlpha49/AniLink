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
 * Two call shapes are supported:
 *
 * 1. Numeric paging (AniList pages and chunks):
 *    `fetchWithLookAhead(fetch, extractHasMore, undefined, startNumber, maxEntries, concurrency)`
 *    or the shorthand five-argument form
 *    `fetchWithLookAhead(fetch, extractHasMore, startNumber, maxEntries, concurrency)`.
 *    Keys advance by slot arithmetic (`startNumber + slot`).
 *
 * 2. Cursor paging (MyAnimeList and any provider whose next key is carried by
 *    the previous response): pass an `extractNextKey` callback as the third
 *    argument. Each consumed entry supplies the key for its successor; the
 *    first key is `firstKey`. Cursor mode never schedules past a terminal
 *    entry even if that entry still carries a stale next key.
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @typeParam TKey - The paging key type: a page number in numeric mode, or an opaque cursor value in cursor mode.
 * @param fetch - Callback that fetches a single entry given its paging key.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry. Return `false` for malformed responses so a broken payload ends the traversal instead of looping forever.
 * @param rest - Positional paging arguments in one of two shapes: numeric paging `[startNumber, maxEntries, concurrency]`, or cursor paging `[extractNextKey, firstKey, maxEntries, concurrency]` where `extractNextKey` reads the next paging key from a fetched entry (`undefined` selects numeric paging). Keys, caps, and the concurrency window are already resolved and validated when this driver is invoked.
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard truncated the run.
 * @throws The rejection from the next unconsumed `fetch` call in entry order.
 * @see {@link LookAheadResult}
 */
export async function fetchWithLookAhead<TEntry, TKey = number>(
    fetch: (key: TKey) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    ...rest:
        | [startNumber: number, maxEntries: number, concurrency: number]
        | [
              extractNextKey: ((response: TEntry) => TKey) | undefined,
              firstKey: TKey,
              maxEntries: number,
              concurrency: number,
          ]
): Promise<LookAheadResult<TEntry>> {
    // Normalize the two call shapes into one internal configuration.
    let extractNextKey: ((response: TEntry) => TKey) | undefined;
    let firstKey: TKey;
    let numericStart: number | undefined;
    let maxEntries: number;
    let concurrency: number;

    if (rest.length === 4) {
        // Six-argument shape: (extractNextKey, firstKey, maxEntries, concurrency).
        // extractNextKey may be undefined here too; firstKey still names the
        // starting key explicitly.
        [extractNextKey, firstKey, maxEntries, concurrency] = rest as [
            ((response: TEntry) => TKey) | undefined,
            TKey,
            number,
            number,
        ];
        if (extractNextKey === undefined) {
            numericStart = firstKey as unknown as number;
        }
    } else {
        // Five-argument numeric shape: (startNumber, maxEntries, concurrency).
        [numericStart, maxEntries, concurrency] = rest as unknown as [number, number, number];
        firstKey = numericStart as unknown as TKey;
    }

    const responses: TEntry[] = [];
    // Requests indexed by slot. Entries are never removed: awaiting an
    // already-settled request must remain possible, because several siblings
    // can settle during the same tick and consumption still happens in order.
    const pending: Promise<void>[] = [];
    let launched = 0;
    let count = 0;
    let truncated = false;
    // The key each not-yet-launched slot will use. In numeric mode this is
    // derived from slot arithmetic; in cursor mode it is updated after each
    // consumed entry.
    let pendingCursorKey: TKey | undefined = extractNextKey === undefined ? undefined : firstKey;

    // In cursor mode the next key is carried by the previous response, so
    // requests form a dependency chain: at most one may be in flight, and the
    // caller-supplied window cannot be honored. Numeric mode keeps the full
    // look-ahead window because keys are computable without any response.
    const effectiveConcurrency = extractNextKey === undefined ? concurrency : 1;

    while (count < maxEntries) {
        // Refill: keep at most `effectiveConcurrency` requests launched but unconsumed.
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
        // the corresponding promise resolves.
        await pending[count];
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
