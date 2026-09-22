/**
 * Watcher engine tests over a stubbed page fetch.
 *
 * `watchFeed` is a pure helper over a fetch closure, so these tests drive
 * the polling loop with an in-memory feed. The between-poll wait is real
 * timer driven and clamped to at least 10 seconds, so the suite installs
 * fake timers: each poll boundary is advanced explicitly with
 * `vi.advanceTimersByTimeAsync`, keeping the tests instant while exercising
 * the real scheduling logic.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
    watchActivity,
    watchNotifications,
    type FetchActivitiesPage,
    type FetchNotificationsPage,
} from "../src/apis/graphql/anilist/helpers/watch";
import type { NotificationsPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/Notifications";
import type { ActivitiesPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/Activities";
import type { NotificationResponse } from "../src/apis/graphql/anilist/interfaces/responses/query/Notification";
import type { Activity } from "../src/apis/graphql/anilist/interfaces/Activity";

/** A minimal notification-shaped item; the engine reads only `id`/`createdAt`. */
const notification = (id: number, createdAt: number): NotificationResponse =>
    ({ id, createdAt }) as unknown as NotificationResponse;

/** A minimal activity-shaped item. */
const activity = (id: number, createdAt: number): Activity =>
    ({ id, createdAt }) as unknown as Activity;

/** Builds a `PageInfo` snapshot for a stubbed page. */
const pageInfo = (hasNextPage: boolean) =>
    ({
        hasNextPage,
        total: 0,
        perPage: 50,
        currentPage: 1,
        lastPage: 1,
    }) as NotificationsPageResponse["pageInfo"];

/**
 * Builds a notification page fetch over a mutable feed: each call slices
 * the feed newest-first by `(page, perPage)`.
 */
const notificationFetchOver =
    (feed: () => NotificationResponse[]) =>
    (variables: Record<string, unknown>): Promise<NotificationsPageResponse> => {
        const page = (variables.page as number) ?? 1;
        const perPage = (variables.perPage as number) ?? 50;
        const all = feed();
        const start = (page - 1) * perPage;
        const items = all.slice(start, start + perPage);
        return Promise.resolve({
            pageInfo: pageInfo(start + perPage < all.length),
            notifications: items,
        });
    };

/**
 * Awaits a watcher step, advancing the fake clock while the generator
 * suspends in the between-poll wait. `intervalMs` is clamped to at least
 * 10 seconds, so each idle suspension is advanced by the clamped interval
 * to release the next poll. A step that settles on its own (a yield, or a
 * fetch resolving) wins without further advancing; a generator that only
 * sleeps (a poll with nothing to yield never settles its `next()`) is
 * aborted after `idlePolls` clock advances so the step completes as `done`.
 */
const step = async <T>(
    watcher: AsyncGenerator<T>,
    abort: () => void,
    idlePolls = 1
): Promise<IteratorResult<T>> => {
    const pending = watcher.next();
    if (idlePolls === 0) {
        // A terminal step: give the generator a microtask turn to finish
        // its poll (fetches resolve as microtasks), then abort before any
        // clock advance so no further poll runs.
        await Promise.resolve();
        await Promise.resolve();
        abort();
        return (await pending) as IteratorResult<T>;
    }
    for (let i = 0; i < 100; i++) {
        const settled = await Promise.race([
            pending.then((value) => value as IteratorResult<T> | null),
            vi.advanceTimersByTimeAsync(10_000).then((): null => null),
        ]);
        if (settled !== null) return settled;
        // The generator slept through this advance. After `idlePolls`
        // sleeps, abort so the pending step completes as `done`.
        if (i + 1 >= idlePolls) {
            abort();
            return (await pending) as IteratorResult<T>;
        }
    }
    throw new Error("watcher step did not settle after advancing the clock");
};

/**
 * Drains a watcher generator to completion (an abort between polls),
 * collecting every yielded item. Each step allows up to `idlePolls` sleep
 * cycles before aborting, so a multi-poll drain (a capped traversal
 * resuming across intervals) completes without real waits.
 */
const drain = async <T>(
    watcher: AsyncGenerator<T>,
    abort: () => void,
    idlePolls = 5,
    maxItems = 500
): Promise<T[]> => {
    const items: T[] = [];
    for (let i = 0; i < maxItems; i++) {
        const result = await step(watcher, abort, idlePolls);
        if (result.done) return items;
        items.push(result.value);
    }
    return items;
};

describe("watchFeed engine", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("an aborted signal before the first poll fetches nothing", async () => {
        const feed: NotificationResponse[] = [notification(1, 100)];
        const fetch = vi.fn(notificationFetchOver(() => feed));
        const controller = new AbortController();
        controller.abort();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            intervalMs: 10,
            signal: controller.signal,
        });
        const items = await drain(watcher, () => controller.abort());
        expect(items).toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
    });

    test("baseline poll drains the front pages, marks them seen, and yields nothing", async () => {
        const feed: NotificationResponse[] = [
            notification(3, 300),
            notification(2, 200),
            notification(1, 100),
        ];
        const fetch = vi.fn(notificationFetchOver(() => feed));
        const controller = new AbortController();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            intervalMs: 10,
            perPage: 2,
            signal: controller.signal,
        });
        // Baseline poll: drains both pages (3 items at perPage 2), marks
        // everything seen, yields nothing — the step aborts right after the
        // baseline poll so it completes as `done` without a second poll.
        const baseline = await step(watcher, () => controller.abort(), 0);
        expect(baseline.done).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test("since cursor yields only strictly-newer items, oldest first", async () => {
        const feed: NotificationResponse[] = [
            notification(3, 300),
            notification(2, 200),
            notification(1, 100),
        ];
        const fetch = vi.fn(notificationFetchOver(() => feed));
        const controller = new AbortController();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            since: 150,
            intervalMs: 10,
            perPage: 2,
            signal: controller.signal,
        });
        const items = await drain(watcher, () => controller.abort());
        expect(items.map((item) => (item as NotificationResponse).id)).toEqual([2, 3]);
    });

    test("a cap-limited drain resumes from the page after the cap", async () => {
        // 30 items at perPage 2 = 15 pages; the drain cap is 10 pages, so
        // the first poll drains pages 1-10 and the next resumes at page 11.
        const feed: NotificationResponse[] = Array.from({ length: 30 }, (_, i) =>
            notification(30 - i, 1000 - i * 10)
        );
        const fetch = vi.fn(notificationFetchOver(() => feed));
        const controller = new AbortController();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            since: 0,
            intervalMs: 10,
            perPage: 2,
            signal: controller.signal,
        });
        const items = await drain(watcher, () => controller.abort());
        // Every item newer than `since: 0` is yielded exactly once, across
        // the capped poll and the resumed one.
        expect(items).toHaveLength(30);
        expect(new Set(items.map((i) => (i as NotificationResponse).id)).size).toBe(30);
    });

    test("a resumed poll that hits the seen frontier re-arms one page deeper", async () => {
        // 30 items at perPage 2: the first poll caps at page 10 (20 items
        // yielded). Between polls, two new items arrive at the front,
        // shifting every page down — the resumed page 11 now holds
        // already-seen items. The re-arm walks one page deeper each frontier
        // hit until the unseen remainder is reached.
        const feed: NotificationResponse[] = Array.from({ length: 30 }, (_, i) =>
            notification(30 - i, 1000 - i * 10)
        );
        const fetch = vi.fn(notificationFetchOver(() => feed));
        const controller = new AbortController();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            since: 0,
            intervalMs: 10,
            perPage: 2,
            signal: controller.signal,
        });
        // First poll: 10 pages drained, 20 items yielded.
        for (let i = 0; i < 20; i++) {
            const result = await step(watcher, () => controller.abort());
            expect(result.done).toBe(false);
        }
        // The generator is now waiting between polls; shift the feed.
        feed.unshift(notification(32, 1100), notification(31, 1050));
        const items = await drain(watcher, () => controller.abort());
        const ids = items.map((item) => (item as NotificationResponse).id);
        // The shifted remainder (the old pages 11-15) plus the two new
        // items are all eventually reported.
        expect(ids).toContain(32);
        expect(ids).toContain(31);
        expect(ids).toHaveLength(12);
    });

    test("forwards bypassResponseCache on every poll request", async () => {
        const seenOptions: Array<{ bypassResponseCache?: boolean } | undefined> = [];
        const fetch = vi.fn(
            async (
                _variables: Record<string, unknown>,
                options?: { bypassResponseCache?: boolean }
            ): Promise<NotificationsPageResponse> => {
                seenOptions.push(options);
                return {
                    pageInfo: pageInfo(false),
                    notifications: [notification(1, 100)],
                } as NotificationsPageResponse;
            }
        );
        const controller = new AbortController();
        const watcher = watchNotifications(fetch as unknown as FetchNotificationsPage, {
            intervalMs: 10,
            signal: controller.signal,
        });
        await step(watcher, () => controller.abort(), 0); // baseline poll
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(seenOptions[0]?.bypassResponseCache).toBe(true);
    });

    test("resetNotificationCount is forwarded on the first poll only", async () => {
        const seenResetValues: Array<boolean | undefined> = [];
        const makeFetch = () =>
            vi.fn(
                async (variables: Record<string, unknown>): Promise<NotificationsPageResponse> => {
                    seenResetValues.push(variables.resetNotificationCount as boolean | undefined);
                    return {
                        pageInfo: pageInfo(false),
                        notifications: [notification(1, 100)],
                    } as NotificationsPageResponse;
                }
            );
        const controller = new AbortController();
        const watcher = watchNotifications(makeFetch() as unknown as FetchNotificationsPage, {
            intervalMs: 10,
            resetNotificationCount: true,
            signal: controller.signal,
        });
        // One step drives both polls: the baseline forwards the reset,
        // then the one-shot is spent, so the second poll on the same
        // watcher must not forward it as true again.
        await step(watcher, () => controller.abort(), 1);
        expect(seenResetValues[0]).toBe(true);
        expect(seenResetValues).toHaveLength(2);
        expect(seenResetValues[1]).not.toBe(true);

        // A second watcher forwards it again on its own first poll —
        // one-shot per watcher, not per poll. The recorded values start
        // fresh so that poll is verified independently of watcher one's.
        seenResetValues.length = 0;
        const controller2 = new AbortController();
        const watcher2 = watchNotifications(makeFetch() as unknown as FetchNotificationsPage, {
            intervalMs: 10,
            resetNotificationCount: true,
            signal: controller2.signal,
        });
        await step(watcher2, () => controller2.abort(), 0);
        expect(seenResetValues[0]).toBe(true);
    });

    test("activity watcher enforces the ID_DESC sort default", async () => {
        const sorts: unknown[] = [];
        const fetch = vi.fn(
            async (variables: Record<string, unknown>): Promise<ActivitiesPageResponse> => {
                sorts.push(variables.sort);
                return {
                    pageInfo: pageInfo(false),
                    activities: [activity(1, 100)],
                } as unknown as ActivitiesPageResponse;
            }
        );
        const controller = new AbortController();
        const watcher = watchActivity(fetch as unknown as FetchActivitiesPage, {
            intervalMs: 10,
            signal: controller.signal,
        });
        await step(watcher, () => controller.abort(), 0);
        expect(sorts[0]).toEqual(["ID_DESC"]);
    });
});
