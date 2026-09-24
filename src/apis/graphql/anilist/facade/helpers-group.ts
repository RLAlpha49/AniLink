/**
 * The pagination and pure-helper members of the `AniListApi` type.
 */
import type { fuzzyDate } from "../helpers/fuzzyDate";
import type { fuzzyDateInt } from "../helpers/fuzzyDateInt";
import type { flattenMediaListCollection } from "../helpers/flattenMediaListCollection";
import type { crossLink } from "../helpers/crossLink";
import type { mapExternalIds } from "../helpers/mapExternalIds";
import type { paginate, paginatePages, paginateChunks } from "../Paginator";
import type { WatchActivityOptions, WatchNotificationsOptions } from "../helpers/watch";
import type { NotificationResponse } from "../interfaces/responses/query/Notification";
import type { Activity } from "../interfaces/Activity";

/**
 * Pagination and transformation helpers exposed by `AniListApi`.
 *
 * @see https://docs.anilist.co/reference/object/pageinfo
 */
export type AniListHelpers = {
    /**
     * {@link paginate} walks `PageInfo`-based pages until `hasNextPage` is false, the received
     * `lastPage` bound is reached, or `maxPages` is reached, collecting every item across pages.
     * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and the traversal's `AbortSignal` (forwarded from the `signal` option so an aborted traversal cancels the in-flight request).
     * @param itemsKey - The key of the items array on the page response (e.g. `"media"`, `"users"`).
     * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, `signal`, and `onPage` controls; a `PaginateOptions`.
     * @returns The collected items, per-page snapshots, page count, and whether the guard or the server-reported `lastPage` bound truncated the run; a `PaginateResult`.
     * @see https://docs.anilist.co/reference/object/pageinfo
     * @example
     * ```typescript
     * const result = await aniLink.anilist.paginate(
     *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" }),
     *   "media",
     *   { perPage: 50, maxPages: 10 }
     * );
     * ```
     */
    paginate: typeof paginate;

    /**
     * `paginatePages` is an async generator yielding each `PageInfo`-based page until
     * `hasNextPage` is false, the received `lastPage` bound is reached, or `maxPages` is reached.
     * @param fetchPage - Callback that fetches a single page given its 1-based number, `perPage`, and the traversal's `AbortSignal` (forwarded from the `signal` option so an aborted traversal cancels the in-flight request).
     * @param options - Optional `perPage`, `startPage`, `maxPages`, `concurrency`, and `signal` controls; a `PaginateOptions`.
     * @returns An async generator yielding each raw page response in turn.
     * @see https://docs.anilist.co/reference/object/pageinfo
     * @example
     * ```typescript
     * for await (const page of aniLink.anilist.paginatePages(
     *   (page, perPage) => aniLink.anilist.query.page.medias({ page, perPage, type: "ANIME" })
     * )) {
     *   console.log(page.pageInfo.currentPage, page.media.length);
     * }
     * ```
     */
    paginatePages: typeof paginatePages;

    /**
     * {@link paginateChunks} iterates `MediaListCollectionResponse` chunks until `hasNextChunk` is
     * false or `maxChunks` is reached, collecting every item across chunks.
     * @param fetchChunk - Callback that fetches a single chunk given its 1-based number, `perChunk`, and the traversal's `AbortSignal` (forwarded from the `signal` option so an aborted traversal cancels the in-flight request).
     * @param itemsKey - The key of the items array on the chunk response (e.g. `"lists"`).
     * @param options - Optional `perChunk`, `startChunk`, `maxChunks`, `concurrency`, `signal`, and `onChunk` controls; a `ChunkPaginateOptions`.
     * @returns The collected items, per-chunk snapshots, chunk count, and whether the guard truncated the run; a `ChunkPaginateResult`.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @example
     * ```typescript
     * const result = await aniLink.anilist.paginateChunks(
     *   (chunk, perChunk) => aniLink.anilist.query.mediaListCollection(
     *     { userId: 542244, type: "ANIME", chunk, perChunk }
     *   ),
     *   "lists",
     *   { perChunk: 500, maxChunks: 20 }
     * );
     * ```
     */
    paginateChunks: typeof paginateChunks;

    /**
     * {@link fuzzyDate} builds an AniList `FuzzyDateInput` from optional year, month, and day parts.
     * @param options - The year, month, and day to include; a `FuzzyDateOptions`. All fields are optional.
     * @returns A `FuzzyDateInput` object with omitted parts set to `0`, the value AniList uses for an unknown date part.
     * @see https://docs.anilist.co/reference/input/fuzzydateinput
     * @example
     * ```typescript
     * const startedAt = aniLink.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
     * ```
     */
    fuzzyDate: typeof fuzzyDate;
    /**
     * {@link fuzzyDateInt} builds the `YYYYMMDD` integer AniList's `FuzzyDateInt` query arguments expect
     * from optional year, month, and day parts, filling omitted parts with `0`.
     * @param options - The year, month, and day parts to pack. All fields are optional; a `FuzzyDateOptions`.
     * @returns The `YYYYMMDD` integer for `startDate`/`endDate`/`startedAt`/`completedAt` query filter variables.
     * @see https://docs.anilist.co/reference/input/fuzzydateinput
     * @example
     * ```typescript
     * const startDate = aniLink.anilist.fuzzyDateInt({ year: 2024, month: 4, day: 15 });
     * // 20240415
     *
     * const page = await aniLink.anilist.query.page.medias({
     *   page: 1,
     *   perPage: 50,
     *   type: "ANIME",
     *   startDate,
     * });
     * ```
     */
    fuzzyDateInt: typeof fuzzyDateInt;

    /**
     * {@link flattenMediaListCollection} flattens a `MediaListCollectionResponse` into a single array of
     * entries tagged with their list group.
     * @param response - The `MediaListCollectionResponse` returned by `mediaListCollection`.
     * @returns A flat array of `FlattenedMediaListEntry` across all list groups.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @example
     * ```typescript
     * const collection = await aniLink.anilist.query.mediaListCollection({ userId: 542244, type: "ANIME" });
     * const entries = aniLink.anilist.flattenMediaListCollection(collection);
     * console.log(entries.length, entries[0].listNames);
     * ```
     */
    flattenMediaListCollection: typeof flattenMediaListCollection;

    /**
     * {@link crossLink} builds bidirectional AniList↔MyAnimeList id lookup maps from AniList media entries.
     * @param media - AniList media entries carrying `id` and `idMal`; e.g. the `media` array of a `page.medias` response, or a one-element array around a `query.media` result.
     * @returns The `anilistToMal` and `malToAnilist` lookup maps plus the `unmapped` entries without a MAL id; a `CrossLinkResult`.
     * @see https://docs.anilist.co/reference/object/media
     * @example
     * ```typescript
     * const page = await aniLink.anilist.query.page.medias({ page: 1, perPage: 50, type: "ANIME" });
     * const { anilistToMal, unmapped } = aniLink.anilist.crossLink(page.media);
     *
     * const malId = anilistToMal.get(21);
     * if (malId !== undefined) {
     *   const malAnime = await aniLink.mal.anime.get({ id: malId }, { fields: ["id", "title"] });
     * }
     * ```
     */
    crossLink: typeof crossLink;

    /**
     * {@link mapExternalIds} queries ARM for AniList↔MyAnimeList mappings. Unlike `crossLink`, this helper makes an opt-in network request.
     * @param source - The source of the input ids, either `anilist` or `myanimelist`.
     * @param ids - The source ids to map. An empty array returns empty maps without a request.
     * @param options - Optional AniLink transport settings, including timeout, cancellation,
     * retries, and request hooks. Per-call settings override the AniList instance settings.
     * @returns Bidirectional id maps and the input ids without a mapping, as a `MapExternalIdsResult`.
     * @see https://arm.haglund.dev/
     * @example
     * ```typescript
     * const result = await aniLink.anilist.mapExternalIds("anilist", [21, 22]);
     * const malId = result.anilistToMal.get(21);
     * ```
     */
    mapExternalIds: typeof mapExternalIds;

    /**
     * The opt-in polling watchers for the AniList notification and activity
     * feeds. AniList exposes no push transport, so each watcher polls its
     * `Page`-based feed operation every `intervalMs`, deduplicates by `id`,
     * and yields each new item exactly once as an async generator. All
     * watcher state is in-memory and per-watcher.
     * @see https://docs.anilist.co/reference/union/notificationunion
     * @see https://docs.anilist.co/reference/union/activityunion
     */
    watch: {
        /**
         * {@link watch.notifications} polls the authenticated user's notification feed
         * (`Page.notifications`) and yields each new notification exactly once.
         * @param options - The watcher options: `since` (a Unix-second cursor), `intervalMs` (default 60000, clamped to at least 10000), `perPage`, `signal`, `transportOptions`, plus the `type`/`type_in`/`resetNotificationCount`/`asHtml` filters; a `WatchNotificationsOptions`.
         * @returns An async generator yielding each new notification, oldest first within a poll; it ends when the consumer breaks or the `signal` aborts between polls.
         * @see https://docs.anilist.co/reference/union/notificationunion
         * @example
         * ```typescript
         * for await (const notification of aniLink.anilist.watch.notifications({
         *     since: Math.floor(Date.now() / 1000) - 3600,
         * })) {
         *     console.log(notification.type, notification.createdAt);
         * }
         * ```
         */
        notifications: (
            options?: WatchNotificationsOptions
        ) => AsyncGenerator<NotificationResponse>;

        /**
         * {@link watch.activity} polls the AniList activity feed (`Page.activities`, newest
         * first) and yields each new activity exactly once.
         * @param options - The watcher options: `since` (a Unix-second cursor), `intervalMs` (default 60000, clamped to at least 10000), `perPage`, `signal`, `transportOptions`, plus the `userId`/`messengerId`/`mediaId`/`type`/`isFollowing`/`sort` filters; a `WatchActivityOptions`.
         * @returns An async generator yielding each new activity, oldest first within a poll; it ends when the consumer breaks or the `signal` aborts between polls.
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
        activity: (options?: WatchActivityOptions) => AsyncGenerator<Activity>;
    };
};
