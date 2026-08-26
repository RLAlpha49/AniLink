/**
 * Provider-neutral pagination machinery.
 *
 * This module owns the transport-agnostic parts of walking a paged remote
 * collection: numeric option resolution and clamping, plus the look-ahead
 * request driver that overlaps round-trip latency while collecting results
 * strictly in entry order. Schema-specific contracts — what a page looks
 * like, where the "more data available" flag lives, and per-page size caps —
 * stay with each provider.
 */

/**
 * Upper bound on caller-supplied look-ahead `concurrency`. Values above this
 * are clamped down so a typo like `concurrency: 1000` cannot hammer an API.
 */
export const MAX_CONCURRENCY = 8;

/** The outcome of a {@link fetchWithLookAhead} traversal. */
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
 */
export function resolveCappedInt(value: number | undefined, max: number, fallback: number): number {
    return Math.min(resolvePositiveInt(value, fallback), max);
}

/**
 * Shared look-ahead driver for paged traversals.
 *
 * Fetches entries through a sliding window of at most `concurrency` launched-
 * but-unconsumed requests so round-trip latency overlaps instead of stacking,
 * while results are appended strictly in entry-number order no matter when each
 * request settles. Scheduling stops as soon as an entry reports "no more data"
 * (per the caller-supplied `extractHasMore`) or the `maxEntries` guard fires;
 * `truncated` mirrors the sequential semantics.
 *
 * Because the window runs ahead of consumption, up to `concurrency - 1`
 * already-launched requests may complete past a terminal entry; their payloads
 * are drained and discarded so the collected prefix matches what a strictly
 * sequential traversal would have returned.
 *
 * @typeParam TEntry - The raw response shape of a single page or chunk.
 * @param fetch - Callback that fetches a single entry given its 1-based number.
 * @param extractHasMore - Reads the "more data available" flag from a fetched entry. Return `false` for malformed responses so a broken payload ends the traversal instead of looping forever.
 * @param startNumber - First entry number to request (already resolved/validated).
 * @param maxEntries - Hard cap on entries fetched (already resolved/validated).
 * @param concurrency - Look-ahead window size (already resolved/clamped).
 * @returns The responses in entry order, how many were fetched, and whether
 *          the guard truncated the run.
 */
export async function fetchWithLookAhead<TEntry>(
    fetch: (entryNumber: number) => Promise<TEntry>,
    extractHasMore: (response: TEntry) => boolean,
    startNumber: number,
    maxEntries: number,
    concurrency: number
): Promise<LookAheadResult<TEntry>> {
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
