/**
 * Opt-in polling watchers for the AniList notification and activity feeds.
 *
 * AniList exposes no push transport, so "notify me" workflows are polling
 * workflows. These helpers compose the typed page operations
 * (`query.page.notifications`, `query.page.activities`) with the shared
 * transport (retry, pacing, circuit breaker) into an async generator that
 * yields each feed item exactly once, newest detections first poll and
 * oldest item yielded first within a poll. All watcher state (the seen-id
 * set) is in-memory and per-watcher, consistent with the library's
 * recorded design decision that all state is in-memory.
 */
import type { PageInfo } from "../interfaces/responses/page/PageInfo";
import type { NotificationsPageResponse } from "../interfaces/responses/page/Notifications";
import type { ActivitiesPageResponse } from "../interfaces/responses/page/Activities";
import type { NotificationsVariables } from "../query/page/Notifications";
import type { ActivitiesVariables } from "../query/page/Activities";
import type { NotificationResponse } from "../interfaces/responses/query/Notification";
import type { Activity } from "../interfaces/Activity";
import type { NotificationType } from "../types/Type";
import type { ActivityType } from "../types/ActivityType";
import type { ActivitySort } from "../types/Sort";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { resolveCappedInt, resolvePositiveInt } from "../../../../base/pagination";

/** Default delay between polls, in milliseconds (one minute). */
const DEFAULT_INTERVAL_MS = 60_000;

/**
 * Smallest delay between polls the watcher accepts, in milliseconds. Smaller
 * caller values are clamped up to it, not rejected: AniList allows 90
 * requests per minute, so a tighter loop would spend the whole budget (and
 * the pacing transport's) on polling.
 */
const MIN_INTERVAL_MS = 10_000;

/** Default items requested per poll page. AniList caps `perPage` at 50. */
const DEFAULT_PER_PAGE = 50;

/** Hard cap on items requested per poll page; larger values are clamped down. */
const MAX_PER_PAGE = DEFAULT_PER_PAGE;

/**
 * Hard cap on pages drained per poll. A poll stops at the first page that
 * contains an already-seen item, so the cap only fires when more than
 * `MAX_DRAIN_PAGES * perPage` unseen items arrived at once (or on the first
 * poll after a `since` far in the past); the next poll resumes draining
 * from the page after the cap instead of restarting at page 1, so the
 * unseen remainder is still reported.
 */
const MAX_DRAIN_PAGES = 10;

/**
 * How many polls of lookback the seen-id set retains. Ids are pruned to a
 * watermark (the oldest `createdAt` the last poll still needed to compare
 * against) minus this slack, so the set stays bounded at roughly
 * `lookback * perPage * MAX_DRAIN_PAGES` ids while a late-arriving or
 * reordered item within the window is still deduplicated instead of
 * re-yielded.
 */
const SEEN_RETENTION_POLLS = 3;

/**
 * The fields every watcher reads off a polled feed item. Every
 * {@link NotificationResponse} variant and every {@link Activity} variant
 * carries both.
 *
 * @see https://docs.anilist.co/reference/union/notificationunion
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface WatchedItem {
    /** The AniList id of the item; the watcher's dedupe key. */
    readonly id: number;

    /** The Unix-second timestamp the item was created at; the `since` cursor's comparison field. */
    readonly createdAt: number;
}

/**
 * Options shared by the notification and activity watchers.
 *
 * @see https://docs.anilist.co/reference/union/notificationunion
 * @see https://docs.anilist.co/reference/union/activityunion
 */
export interface WatchOptions {
    /**
     * Unix-second cursor: only items with `createdAt` strictly greater than
     * `since` are yielded, starting with the first poll. When omitted, the
     * first poll establishes the baseline instead — it marks every item
     * currently on the first page as seen and yields nothing, so the watcher
     * reports only items created after it started.
     */
    since?: number;

    /**
     * Delay between polls, in milliseconds. Defaults to `60000` (one
     * minute); values below `10000` are clamped up to it so the watcher
     * cannot spend AniList's rate-limit budget on polling. Non-positive or
     * non-finite values throw a `TypeError`.
     */
    intervalMs?: number;

    /**
     * Items requested per poll page. AniList caps this at 50; values above
     * 50 are clamped down to 50. Defaults to 50. A burst larger than
     * `perPage` items between two polls is still fully reported as long as
     * each drained page contains at least one unseen item — the watcher
     * drains up to 10 pages per poll until it reaches the seen frontier.
     */
    perPage?: number;

    /**
     * `AbortSignal` that stops the watcher — the authoritative stop
     * mechanism. An abort between polls ends the generator cleanly (the
     * `for await` loop simply finishes); an abort during an in-flight poll
     * rejects it with the transport's `ABORTED` error, matching the rest
     * of the library. A `for await` loop's `break`/`return` also stops the
     * watcher because it happens while the generator is suspended at a
     * yield; a watcher abandoned by any other consumer shape keeps polling
     * until its `signal` aborts, so always pass one for long-running
     * watchers.
     */
    signal?: AbortSignal;

    /**
     * Per-poll transport settings (`timeout`, retry policy, lifecycle
     * hooks, pacing) merged over the instance-level options for every poll
     * request. The watcher's `signal` is always forwarded to the transport
     * regardless of this value. Poll requests always bypass the
     * instance-level `responseCache` — a watcher poll whose freshness is
     * the point must never be served a cached page — so a cache enabled on
     * the client never makes the watcher stale.
     */
    transportOptions?: RequestOptions;
}

/** Filter variables the notification watcher forwards to `Page.notifications`. */
export interface WatchNotificationsFilters {
    /**
     * Include only notifications of this type; a {@link NotificationType}
     * value forwarded as the page query's `type` variable.
     */
    type?: NotificationType;

    /**
     * Include only notifications of these types; {@link NotificationType}
     * values forwarded as the page query's `type_in` variable.
     */
    type_in?: NotificationType[];

    /**
     * Resets the unread notification count to 0. One-shot: forwarded on
     * the watcher's first poll only, so the natural intent — "clear it
     * once, now that my watcher is taking over" — does not silently
     * suppress the unread badge on every subsequent poll.
     */
    resetNotificationCount?: boolean;

    /** Whether notification context strings render as HTML. */
    asHtml?: boolean;
}

/** Filter variables the activity watcher forwards to `Page.activities`. */
export interface WatchActivityFilters {
    /** Include only activities of this user. */
    userId?: number;

    /** Include only message activities with this messenger. */
    messengerId?: number;

    /** Include only activities about this media. */
    mediaId?: number;

    /** Include only activities of this {@link ActivityType}. */
    type?: ActivityType;

    /** Include only activities of the users the authenticated user follows. */
    isFollowing?: boolean;

    /**
     * Sort order forwarded as the page query's `sort` variable. Defaults to
     * `["ID_DESC"]` (newest first) — the watcher's drain logic assumes the
     * newest items are on the first page, so pass a different order only
     * with that caveat in mind.
     */
    sort?: ActivitySort[];
}

/** Options accepted by the notification watcher. */
export interface WatchNotificationsOptions extends WatchOptions, WatchNotificationsFilters {}

/** Options accepted by the activity watcher. */
export interface WatchActivityOptions extends WatchOptions, WatchActivityFilters {}

/**
 * The transport-agnostic page fetch the notification watcher polls: the
 * facade wires it to the lazily-constructed `NotificationsQuery` bound
 * method, so the helper itself stays testable and provider-agnostic.
 */
export type FetchNotificationsPage = (
    variables: NotificationsVariables,
    options?: RequestOptions
) => Promise<NotificationsPageResponse>;

/**
 * The transport-agnostic page fetch the activity watcher polls: the facade
 * wires it to the lazily-constructed `ActivitiesQuery` bound method.
 */
export type FetchActivitiesPage = (
    variables: ActivitiesVariables,
    options?: RequestOptions
) => Promise<ActivitiesPageResponse>;

/**
 * One polled page reduced to the fields the watcher engine reads.
 */
interface PolledPage<TItem extends WatchedItem> {
    /** The page's pagination metadata; the engine reads `hasNextPage`. */
    readonly pageInfo: PageInfo;

    /** The page's items, in the feed's server order. */
    readonly items: readonly TItem[];
}

/**
 * Resolves after `ms`, or as soon as `signal` aborts — unlike the transport
 * layer's `sleep`, which rejects on abort. The watcher's between-poll wait
 * must end the loop cleanly on abort (the next loop check exits), not throw
 * out of the generator.
 *
 * @param ms - The duration to wait in milliseconds.
 * @param signal - Optional signal that ends the wait early.
 * @returns A promise that resolves after the delay or on abort.
 */
const sleepBetweenPolls = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve) => {
        const timeout: NodeJS.Timeout = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
        }, ms);
        timeout.unref();

        const abort = (): void => {
            clearTimeout(timeout);
            resolve();
        };

        if (signal?.aborted) {
            clearTimeout(timeout);
            resolve();
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
    });

/**
 * Drops keys whose value is `undefined` so the poll request's variable
 * object carries only set filters. Variable validation iterates
 * `Object.entries`, which includes explicitly-`undefined` keys, so a
 * literal `{ type: undefined }` would fail the page operation's type check
 * even though the filter is simply unset.
 *
 * @param variables - The variable object with possibly-`undefined` values.
 * @returns A new object with only the keys that carry a value.
 */
const dropUndefined = <T extends object>(variables: T): T => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(variables)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result as T;
};

/**
 * Mutable state one watcher poll reads and updates, carried across polls.
 *
 * @typeParam TItem - The polled feed item; every {@link NotificationResponse} and every {@link Activity} variant satisfies {@link WatchedItem}.
 */
interface WatchPollContext<TItem extends WatchedItem> {
    /** The transport-agnostic page fetch the poll drains through. */
    readonly fetchPage: (
        page: number,
        perPage: number,
        signal?: AbortSignal
    ) => Promise<PolledPage<TItem>>;
    /** Items requested per poll page (the watcher's resolved `perPage`). */
    readonly perPage: number;
    /** Unix-second cursor; `undefined` for a watcher that baselines instead. */
    readonly since: number | undefined;
    /** The watcher's abort signal, forwarded to every poll request. */
    readonly signal: AbortSignal | undefined;
    /** The seen-id map: item id → `createdAt`, pruned between polls. */
    readonly seen: Map<number, number>;
    /** Whether the first poll still owes the baseline (mark-seen, yield-nothing) drain. */
    baselinePending: boolean;
    /** The page the next poll starts at; above 1 only after a cap-limited drain. */
    resumeFromPage: number;
}

/**
 * One poll's drain outcome: what to yield, where the next poll starts, and
 * the watermark the seen-set prune derives from.
 *
 * @typeParam TItem - The polled feed item.
 */
interface PollDrain<TItem> {
    /** Previously-unseen items, newest detections first; empty on a baseline poll. */
    readonly fresh: TItem[];
    /** The page the next poll resumes from (1 after a complete drain). */
    readonly resumeFromPage: number;
    /** The oldest `createdAt` this poll compared against, or `undefined` when no page drained. */
    readonly watermark: number | undefined;
}

/**
 * Drain one poll: fetch pages from the resume point until the seen
 * frontier, a short page, `hasNextPage: false`, or {@link MAX_DRAIN_PAGES},
 * marking every drained item seen and collecting the previously-unseen ones
 * newest-first.
 *
 * The feed must be newest-first (the notification feed's server default;
 * the activity watcher enforces `ID_DESC`): the drain stops at the first
 * page containing an already-seen item, which is the frontier marker when
 * new items arrive at the front. A resumed poll that hits the frontier on
 * its first page re-arms one page deeper so a shifted remainder is never
 * stranded behind the seen frontier; a drain that ends at the page cap
 * resumes from the page after the cap on the next poll, except after a
 * baseline drain, which resumes from its initial page so the first real
 * poll re-scans the feed's front. The baseline poll (no `since`) marks but
 * never yields, so a burst larger than `perPage` arriving right after start
 * cannot surface pre-start items from page 2 on.
 *
 * The returned watermark is the oldest `createdAt` this poll still had to
 * compare against — the oldest item of the last drained page (newest-first
 * pages put the oldest item last). Ids strictly older than it minus the
 * retention slack can no longer be re-encountered as unseen, which is what
 * keeps the seen-map bounded across polls.
 *
 * @typeParam TItem - The polled feed item; every {@link NotificationResponse} and every {@link Activity} variant satisfies {@link WatchedItem}.
 * @param ctx - The watcher's poll state; `baselinePending` and `resumeFromPage` are updated in place.
 * @returns The items to yield, the resume page for the next poll, and the prune watermark.
 * @see {@link WatchPollContext}
 */
async function drainPoll<TItem extends WatchedItem>(
    ctx: WatchPollContext<TItem>
): Promise<PollDrain<TItem>> {
    const { fetchPage, perPage, since, signal, seen } = ctx;
    const fresh: TItem[] = [];
    const startPage = ctx.resumeFromPage;
    const resuming = startPage > 1;
    const baselineDrain = ctx.baselinePending;
    ctx.resumeFromPage = 1;
    let hitSeenFrontier = false;
    let drainedToCap = false;
    let page = startPage;
    let lastDrainedItems: readonly TItem[] = [];
    let lastDrainedHasNext = false;
    for (; page < startPage + MAX_DRAIN_PAGES; page++) {
        const { pageInfo, items } = await fetchPage(page, perPage, signal);
        lastDrainedItems = items;
        lastDrainedHasNext = pageInfo.hasNextPage;
        for (const item of items) {
            if (seen.has(item.id) || (since !== undefined && item.createdAt <= since)) {
                hitSeenFrontier = true;
                continue;
            }
            if (!ctx.baselinePending) {
                fresh.push(item);
            }
        }
        for (const item of items) {
            seen.set(item.id, item.createdAt);
        }
        // The baseline poll drains without yielding: it marks every
        // page up to the frontier (or the cap) seen so a burst larger
        // than `perPage` right after start cannot surface pre-start
        // items from page 2 onward.
        if (hitSeenFrontier || items.length < perPage) break;
        if (!pageInfo.hasNextPage) break;
        if (page === startPage + MAX_DRAIN_PAGES - 1) {
            drainedToCap = true;
        }
    }
    if (drainedToCap) {
        // The baseline marked the capped pages seen without yielding:
        // resume from this drain's initial page so the first real poll
        // re-scans the feed's front instead of leaping past the cap and
        // missing items that arrived there after the baseline snapshot.
        ctx.resumeFromPage = baselineDrain ? startPage : page;
    } else if (resuming && hitSeenFrontier && page === startPage && lastDrainedHasNext) {
        // The resumed page was already seen and the feed continues:
        // new items shifted the feed down between the capped poll and
        // this one, so the unseen remainder now sits one page deeper.
        // Re-arm the resume instead of resetting to 1, which would
        // strand the remainder behind the seen frontier forever.
        ctx.resumeFromPage = startPage + 1;
    }
    ctx.baselinePending = false;

    const oldestDrained = lastDrainedItems[lastDrainedItems.length - 1];
    return {
        fresh,
        resumeFromPage: ctx.resumeFromPage,
        watermark: oldestDrained?.createdAt,
    };
}

/**
 * The shared watcher engine: polls `fetchPage` every `intervalMs`, drains
 * each poll through {@link drainPoll} (which owns the frontier, resume,
 * and baseline rules), prunes the seen-id set to a bounded window, and
 * yields each unseen item exactly once in chronological order (oldest
 * first) within a poll.
 *
 * @typeParam TItem - The polled feed item; every {@link NotificationResponse} and {@link Activity} variant satisfies {@link WatchedItem}.
 * @param fetchPage - Callback that fetches one page given its 1-based number, `perPage`, and the watcher's `AbortSignal`.
 * @param options - The shared watcher options (`since`, `intervalMs`, `perPage`, `signal`, `transportOptions`).
 * @yields Each previously-unseen feed item, oldest first within a poll.
 * @see https://docs.anilist.co/reference/object/pageinfo
 */
async function* watchFeed<TItem extends WatchedItem>(
    fetchPage: (page: number, perPage: number, signal?: AbortSignal) => Promise<PolledPage<TItem>>,
    options: WatchOptions
): AsyncGenerator<TItem> {
    const intervalMs = Math.max(
        resolvePositiveInt(options.intervalMs, DEFAULT_INTERVAL_MS, "intervalMs"),
        MIN_INTERVAL_MS
    );
    const perPage = resolveCappedInt(options.perPage, MAX_PER_PAGE, DEFAULT_PER_PAGE, "perPage");
    const { since, signal } = options;

    // The seen-id map is the watcher's whole state: in-memory,
    // per-watcher, mapping each seen item's id to its `createdAt` so
    // {@link drainPoll} can prune it by time instead of it growing without
    // bound. With no `since` cursor the first poll is a baseline: it marks
    // the feed's current front pages seen and yields nothing, so the
    // watcher reports only items created after it started even when a
    // burst larger than `perPage` arrives before the second poll.
    const ctx: WatchPollContext<TItem> = {
        fetchPage,
        perPage,
        since,
        signal,
        seen: new Map<number, number>(),
        baselinePending: since === undefined,
        resumeFromPage: 1,
    };

    while (!signal?.aborted) {
        const { fresh, resumeFromPage, watermark } = await drainPoll(ctx);
        ctx.resumeFromPage = resumeFromPage;

        // Prune ids older than this poll's watermark minus the retention
        // slack: they can no longer be re-encountered as unseen, so a
        // watcher running for months holds a bounded window of ids instead
        // of the account's whole feed history. The slack is measured in
        // polls and converted from the `intervalMs` milliseconds to the
        // items' Unix seconds; it keeps late-arriving or reordered items
        // inside the window deduplicated instead of re-yielded.
        if (watermark !== undefined) {
            const pruneBefore = watermark - (intervalMs / 1000) * SEEN_RETENTION_POLLS;
            for (const [id, createdAt] of ctx.seen) {
                if (createdAt < pruneBefore) {
                    ctx.seen.delete(id);
                }
            }
        }

        // Pages are newest-first, so the drain collected `fresh` newest
        // first; yield it reversed so the consumer receives items in the
        // order they were created.
        for (let index = fresh.length - 1; index >= 0; index--) {
            yield fresh[index];
        }

        await sleepBetweenPolls(intervalMs, signal);
    }
}

/**
 * Polls the authenticated user's notification feed and yields each new
 * notification exactly once.
 *
 * The watcher polls `Page.notifications` (the notification feed's list
 * source — the root `Notification` query returns a single notification, not
 * a list) every `intervalMs`, deduplicates by `id`, and yields items created
 * after `since` — or, without a `since`, only items created after the watcher
 * started. Each poll drains pages until it reaches the seen frontier, so a
 * burst between polls is fully reported up to the drain cap. Every poll runs
 * through the shared transport, so retry, rate-limit pacing, and the
 * circuit breaker apply to each request.
 *
 * @param fetch - The page fetch to poll; the facade wires the authenticated `query.page.notifications` operation.
 * @param options - The watcher options: `since`, `intervalMs`, `perPage`, `signal`, `transportOptions`, plus the `type`/`type_in`/`resetNotificationCount` (first poll only)/`asHtml` filters.
 * @returns An async generator yielding each new notification, oldest first within a poll. The generator ends when the consumer breaks or the `signal` aborts between polls.
 * @throws An `AniLinkError` when a poll request fails (after the transport's retries), or the transport's `ABORTED` error when the `signal` aborts a poll mid-flight.
 * @see https://docs.anilist.co/reference/union/notificationunion
 * @example
 * ```typescript
 * const controller = new AbortController();
 * for await (const notification of aniLink.anilist.watch.notifications({
 *     since: Math.floor(Date.now() / 1000) - 3600,
 *     intervalMs: 60_000,
 *     signal: controller.signal,
 * })) {
 *     console.log(notification.type, notification.createdAt);
 * }
 * ```
 */
export function watchNotifications(
    fetch: FetchNotificationsPage,
    options: WatchNotificationsOptions = {}
): AsyncGenerator<NotificationResponse> {
    const { type, type_in, resetNotificationCount, asHtml, ...shared } = options;
    // `resetNotificationCount` is one-shot: it is forwarded on the first poll
    // only. Forwarding it on every poll would reset the unread count each
    // time — permanently suppressing the badge for notifications the user
    // never saw — when the natural caller intent is "clear it once, now
    // that my watcher is taking over". The flag is spent only after the
    // poll settles, so a first poll that never reaches the server does not
    // silently consume the one-shot.
    let resetPending = resetNotificationCount === true;
    return watchFeed<NotificationResponse>(async (page, perPage, signal) => {
        const resetNow = resetPending;
        const response = await fetch(
            dropUndefined({
                page,
                perPage,
                type,
                type_in,
                resetNotificationCount: resetNow,
                asHtml,
            }),
            // Poll requests always bypass the response cache: a watcher
            // poll whose freshness is the point must never be served a
            // cached page, so a cache enabled on the client cannot make
            // the watcher stale.
            { ...shared.transportOptions, signal, bypassResponseCache: true }
        );
        resetPending = false;
        return { pageInfo: response.pageInfo, items: response.notifications };
    }, shared);
}

/**
 * Polls the AniList activity feed and yields each new activity exactly once.
 *
 * The watcher polls `Page.activities` (the activity feed's list source —
 * the root `Activity` query returns a single activity, not a list) every
 * `intervalMs`, sorted newest-first (`ID_DESC` by default), deduplicates by
 * `id`, and yields items created after `since` — or, without a `since`, only
 * items created after the watcher started. Each poll drains pages until it
 * reaches the seen frontier, so a burst between polls is fully reported up
 * to the drain cap. Every poll runs through the shared transport, so retry,
 * rate-limit pacing, and the circuit breaker apply to each request.
 *
 * @param fetch - The page fetch to poll; the facade wires the `query.page.activities` operation.
 * @param options - The watcher options: `since`, `intervalMs`, `perPage`, `signal`, `transportOptions`, plus the `userId`/`messengerId`/`mediaId`/`type`/`isFollowing`/`sort` filters.
 * @returns An async generator yielding each new activity, oldest first within a poll. The generator ends when the consumer breaks or the `signal` aborts between polls.
 * @throws An `AniLinkError` when a poll request fails (after the transport's retries), or the transport's `ABORTED` error when the `signal` aborts a poll mid-flight.
 * @see https://docs.anilist.co/reference/union/activityunion
 * @example
 * ```typescript
 * for await (const activity of aniLink.anilist.watch.activity({
 *     userId: 542244,
 *     intervalMs: 120_000,
 * })) {
 *     console.log(activity.type, activity.createdAt);
 * }
 * ```
 */
export function watchActivity(
    fetch: FetchActivitiesPage,
    options: WatchActivityOptions = {}
): AsyncGenerator<Activity> {
    const { userId, messengerId, mediaId, type, isFollowing, sort, ...shared } = options;
    return watchFeed<Activity>(async (page, perPage, signal) => {
        const response = await fetch(
            // ID_DESC (newest first) is the watcher's working order:
            // new items enter at the front, so page 1 is always the
            // window that contains them. A caller-provided sort
            // overrides it — see the option's caveat.
            dropUndefined({
                page,
                perPage,
                userId,
                messengerId,
                mediaId,
                type,
                isFollowing,
                sort: sort ?? ["ID_DESC"],
            }),
            // Poll requests always bypass the response cache: a watcher
            // poll whose freshness is the point must never be served a
            // cached page, so a cache enabled on the client cannot make
            // the watcher stale.
            { ...shared.transportOptions, signal, bypassResponseCache: true }
        );
        return { pageInfo: response.pageInfo, items: response.activities };
    }, shared);
}
