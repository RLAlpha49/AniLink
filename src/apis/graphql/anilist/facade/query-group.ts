/**
 * The `query` member (query + page operations) of the `AniListApi` type.
 */
import { type ActivityReply, type Activity } from "../interfaces/Activity";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type MediaTagCollectionVariables } from "../query/MediaTagCollection";
import { type SiteStatisticsVariables } from "../query/SiteStatistics";
import { type ExternalLinkSourceCollectionVariables } from "../query/ExternalLinkSourceCollection";
import { type ActivityVariables } from "../query/Activity";
import { type ActivityReplyVariables } from "../query/ActivityReply";
import { type ActivityRepliesVariables } from "../query/page/ActivityReplies";
import { type ActivitiesVariables } from "../query/page/Activities";
import { type ActivitiesPageResponse } from "../interfaces/responses/page/Activities";
import { type ActivityRepliesPageResponse } from "../interfaces/responses/page/ActivityReplies";
import { type AiringScheduleVariables } from "../query/AiringSchedule";
import { type AiringScheduleResponse } from "../interfaces/responses/query/AiringSchedule";
import { type AiringSchedulesVariables } from "../query/page/AiringSchedules";
import { type AiringSchedulesPageResponse } from "../interfaces/responses/page/AiringSchedules";
import { type AniChartUserResponse } from "../interfaces/responses/query/AniChartUser";
import { type CharacterVariables } from "../query/Character";
import { type CharacterResponse } from "../interfaces/responses/query/Character";
import { type CharactersVariables } from "../query/page/Characters";
import { type CharactersPageResponse } from "../interfaces/responses/page/Characters";
import { type ExternalLinkSourceCollectionResponse } from "../interfaces/responses/query/ExternalLinkSourceCollection";
import { type FollowerVariables } from "../query/Follower";
import { type FollowersVariables } from "../query/page/Followers";
import { type FollowersPageResponse } from "../interfaces/responses/page/Followers";
import { type FollowingVariables } from "../query/Following";
import { type FollowingsVariables } from "../query/page/Followings";
import { type FollowingsPageResponse } from "../interfaces/responses/page/Followings";
import { type LikesVariables } from "../query/page/Likes";
import { type LikesPageResponse } from "../interfaces/responses/page/Likes";
import { type MarkdownVariables } from "../query/Markdown";
import { type MediaListCollectionVariables } from "../query/MediaListCollection";
import { type MediaListCollectionResponse } from "../interfaces/responses/query/MediaListCollectionResponse";
import { type MediaListVariables } from "../query/MediaList";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { type MediaListsVariables } from "../query/page/MediaLists";
import { type MediaListsPageResponse } from "../interfaces/responses/page/MediaLists";
import { type MediaVariables } from "../query/Media";
import { type MediaResponse } from "../interfaces/responses/query/Media";
import { type MediaTagCollectionResponse } from "../interfaces/responses/query/MediaTagCollection";
import { type MediaTrendVariables } from "../query/MediaTrend";
import { type MediaTrendResponse } from "../interfaces/responses/query/MediaTrend";
import { type MediaTrendsVariables } from "../query/page/MediaTrends";
import { type MediasVariables } from "../query/page/Medias";
import { type MediasPageResponse } from "../interfaces/responses/page/Medias";
import { type MediaTrendsPageResponse } from "../interfaces/responses/page/MediaTrends";
import { type NotificationVariables } from "../query/Notification";
import { type NotificationResponse } from "../interfaces/responses/query/Notification";
import { type NotificationsVariables } from "../query/page/Notifications";
import { type NotificationsPageResponse } from "../interfaces/responses/page/Notifications";
import { type RecommendationVariables } from "../query/Recommendation";
import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { type RecommendationsVariables } from "../query/page/Recommendations";
import { type RecommendationsPageResponse } from "../interfaces/responses/page/Recommendations";
import { type ReviewVariables } from "../query/Review";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type ReviewsVariables } from "../query/page/Reviews";
import { type ReviewsPageResponse } from "../interfaces/responses/page/Reviews";
import { type SiteStatisticsResponse } from "../interfaces/responses/query/SiteStatistics";
import { type StaffVariables } from "../query/Staff";
import { type StaffResponse } from "../interfaces/responses/query/Staff";
import { type StaffsVariables } from "../query/page/Staffs";
import { type StaffsPageResponse } from "../interfaces/responses/page/Staffs";
import { type StudioVariables } from "../query/Studio";
import { type StudioResponse } from "../interfaces/responses/query/Studio";
import { type StudiosVariables } from "../query/page/Studios";
import { type StudiosPageResponse } from "../interfaces/responses/page/Studios";
import { type ThreadCommentVariables } from "../query/ThreadComment";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { type ThreadCommentsVariables } from "../query/page/ThreadComments";
import { type ThreadCommentsPageResponse } from "../interfaces/responses/page/ThreadComments";
import { type ThreadVariables } from "../query/Thread";
import { type ThreadResponse } from "../interfaces/responses/query/Thread";
import { type ThreadsVariables } from "../query/page/Threads";
import { type ThreadsPageResponse } from "../interfaces/responses/page/Threads";
import { type UserVariables } from "../query/User";
import { type UserResponse } from "../interfaces/responses/query/User";
import { type UsersVariables } from "../query/page/Users";
import { type UsersPageResponse } from "../interfaces/responses/page/Users";

/**
 * Typed AniList query operations exposed by `AniListApi`.
 *
 * @see https://docs.anilist.co/reference/query
 */
export type AniListQueries = {
    /**
     * Query methods for fetching data from the AniList API.
     * @public
     * @type {Object}
     * @property {Function} user - Fetches user data from the AniList API.
     * @property {Function} media - Fetches media data from the AniList API.
     * @property {Function} mediaTrend - Fetches media trend data from the AniList API.
     * @property {Function} airingSchedule - Fetches airing schedule data from the AniList API.
     * @property {Function} character - Fetches character data from the AniList API.
     * @property {Function} staff - Fetches staff data from the AniList API.
     * @property {Function} mediaList - Fetches media list data from the AniList API.
     * @property {Function} mediaListCollection - Fetches media list collection data from the AniList API.
     * @property {Function} like - Fetches users who liked a model from the AniList API.
     * @property {Function} genreCollection - Fetches genre collection data from the AniList API.
     * @property {Function} mediaTagCollection - Fetches media tag collection data from the AniList API.
     * @property {Function} viewer - Fetches viewer data from the AniList API.
     * @property {Function} notification - Fetches notification data from the AniList API.
     * @property {Function} studio - Fetches studio data from the AniList API.
     * @property {Function} review - Fetches review data from the AniList API.
     * @property {Function} activity - Fetches activity data from the AniList API.
     * @property {Function} activityReply - Fetches activity reply data from the AniList API.
     * @property {Function} following - Fetches following data from the AniList API.
     * @property {Function} follower - Fetches follower data from the AniList API.
     * @property {Function} thread - Fetches thread data from the AniList API.
     * @property {Function} threadComment - Fetches thread comment data from the AniList API.
     * @property {Function} recommendation - Fetches recommendation data from the AniList API.
     * @property {Function} markdown - Fetches markdown data from the AniList API.
     * @property {Function} aniChartUser - Fetches AniChart user data from the AniList API.
     * @property {Function} siteStatistics - Fetches site statistics data from the AniList API.
     * @property {Function} externalLinkSourceCollection - Fetches external link source collection data from the AniList API.
     * @property {Object} page - Fetches pages of data from the AniList API.
     * @see https://docs.anilist.co/reference/query
     */
    query: {
        /**
         * `UserQuery` fetches a single user by `id` or `userName`. Returns a {@link UserResponse}.
         * @param {UserVariables} variables - The {@link UserVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UserResponse>} A promise that resolves to the user's {@link UserResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.user({id: 542244, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         */
        user: (variables: UserVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * `MediaQuery` fetches the media data for a single anime or manga by `id` or `idMal`. Returns a {@link MediaResponse}.
         * @param {MediaVariables} variables - The {@link MediaVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaResponse>} A promise that resolves to the {@link MediaResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.media({id: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/object/media
         */
        media: (variables: MediaVariables, options?: RequestOptions) => Promise<MediaResponse>;

        /**
         * `MediaTrendQuery` fetches the trend entry for a single airing media. Returns a {@link MediaTrendResponse}.
         * @param {MediaTrendVariables} variables - The {@link MediaTrendVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the {@link MediaTrendResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/object/mediatrend
         */
        mediaTrend: (
            variables: MediaTrendVariables,
            options?: RequestOptions
        ) => Promise<MediaTrendResponse>;

        /**
         * `AiringScheduleQuery` fetches a single airing schedule entry by `id` or `mediaId`. Returns an {@link AiringScheduleResponse}.
         * @param {AiringScheduleVariables} variables - The {@link AiringScheduleVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the {@link AiringScheduleResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.airingSchedule({mediaId: 130590});
         * ```
         * Must be querying an airing anime. Returns error if not.
         * @see https://docs.anilist.co/reference/object/airingschedule
         */
        airingSchedule: (
            variables: AiringScheduleVariables,
            options?: RequestOptions
        ) => Promise<AiringScheduleResponse>;

        /**
         * `CharacterQuery` fetches a single character by `id`. Returns a {@link CharacterResponse}.
         * @param {CharacterVariables} variables - The {@link CharacterVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<CharacterResponse>} A promise that resolves to the {@link CharacterResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.character({
         *   id: 1,
         *   asHtml: true,
         *   mediaSort: ['POPULARITY_DESC'],
         *   mediaType: 'ANIME',
         *   mediaOnList: true,
         *   mediaPage: 1,
         *   mediaPerPage: 10
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/character
         */
        character: (
            variables: CharacterVariables,
            options?: RequestOptions
        ) => Promise<CharacterResponse>;

        /**
         * `StaffQuery` fetches a single staff member by `id`. Returns a {@link StaffResponse}.
         * @param {StaffVariables} variables - The {@link StaffVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<StaffResponse>} A promise that resolves to the {@link StaffResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.staff({
         *   id: 132186,
         *   asHtml: true,
         *   staffMediaSort: ['POPULARITY_DESC'],
         *   staffMediaType: 'ANIME',
         *   staffMediaOnList: true,
         *   staffMediaPage: 1,
         *   staffMediaPerPage: 10,
         *   charactersSort: ['ID'],
         *   charactersPage: 1,
         *   charactersPerPage: 10,
         *   characterMediaSort: ['POPULARITY_DESC'],
         *   characterMediaOnList: true,
         *   characterMediaPage: 1,
         *   characterMediaPerPage: 10
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/staff
         */
        staff: (variables: StaffVariables, options?: RequestOptions) => Promise<StaffResponse>;

        /**
         * `MediaListQuery` fetches a single media list entry by `id`, or by `userName`/`userId` plus `mediaId`. Returns a {@link MediaListResponse}.
         * @param {MediaListVariables} variables - The {@link MediaListVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the {@link MediaListResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaList({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         */
        mediaList: (
            variables: MediaListVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse>;

        /**
         * `MediaListCollectionQuery` fetches a user's full list collection, chunked via `chunk`/`perChunk`. Returns a {@link MediaListCollectionResponse}; flatten it with `AniListHelpers.flattenMediaListCollection`.
         * @param {MediaListCollectionVariables} variables - The {@link MediaListCollectionVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaListCollectionResponse>} A promise that resolves to the {@link MediaListCollectionResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaListCollection({
         *   userId: 542244,
         *   type: 'ANIME',
         *   status: 'COMPLETED',
         *   chunk: 1,
         *   perChunk: 10000
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/medialistcollection
         */
        mediaListCollection: (
            variables: MediaListCollectionVariables,
            options?: RequestOptions
        ) => Promise<MediaListCollectionResponse>;

        /**
         * `GenreCollectionQuery` returns the list of all genres recognized by AniList. No variables are required.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<string>} A promise that resolves to the genre collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.genreCollection()
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        genreCollection: (options?: RequestOptions) => Promise<string>;

        /**
         * `MediaTagCollectionQuery` returns all media tags recognized by AniList, optionally filtered by `variables`. Returns a {@link MediaTagCollectionResponse}.
         * @param {MediaTagCollectionVariables} variables - Optional {@link MediaTagCollectionVariables} filters for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<MediaTagCollectionResponse>} A promise that resolves to the {@link MediaTagCollectionResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTagCollection()
         * ```
         * @see https://docs.anilist.co/reference/object/mediatag
         */
        mediaTagCollection: (
            variables?: MediaTagCollectionVariables,
            options?: RequestOptions
        ) => Promise<MediaTagCollectionResponse>;

        /**
         * `ViewerQuery` fetches the currently authenticated user. Returns a {@link UserResponse}.
         * @param {UserVariables} variables - The {@link UserVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UserResponse>} A promise that resolves to the {@link UserResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.viewer({asHtml: true});
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/object/user
         */
        viewer: (variables?: UserVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * `NotificationQuery` fetches a single notification by `id`. Returns a {@link NotificationResponse}. Must be authenticated.
         * @param {NotificationVariables} variables - The {@link NotificationVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<NotificationResponse>} A promise that resolves to the {@link NotificationResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.notification({asHtml: true});
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/union/notificationunion
         */
        notification: (
            variables: NotificationVariables,
            options?: RequestOptions
        ) => Promise<NotificationResponse>;

        /**
         * `StudioQuery` fetches a single studio by `id`. Returns a {@link StudioResponse}.
         * @param {StudioVariables} variables - The {@link StudioVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<StudioResponse>} A promise that resolves to the {@link StudioResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.studio({id: 561, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/studio
         */
        studio: (variables: StudioVariables, options?: RequestOptions) => Promise<StudioResponse>;

        /**
         * `ReviewQuery` fetches a single review by `id`. Returns a {@link ReviewResponse}.
         * @param {ReviewVariables} variables - The {@link ReviewVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the {@link ReviewResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.review({id: 8008, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         */
        review: (variables: ReviewVariables, options?: RequestOptions) => Promise<ReviewResponse>;

        /**
         * `ActivityQuery` fetches a single activity by `id`. Returns an {@link Activity} (a union of text, message, and list activities).
         * @param {ActivityVariables} variables - The {@link ActivityVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<Activity>} A promise that resolves to the {@link Activity} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activity({id: 723235883, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         */
        activity: (variables: ActivityVariables, options?: RequestOptions) => Promise<Activity>;

        /**
         * `ActivityReplyQuery` fetches a single activity reply by `id`. Returns an {@link ActivityReply}.
         * @param {ActivityReplyVariables} variables - The {@link ActivityReplyVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ActivityReply>} A promise that resolves to the {@link ActivityReply} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/activityreply
         */
        activityReply: (
            variables: ActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<ActivityReply>;

        /**
         * `FollowingQuery` fetches a single user that the given `userId` follows. Returns a {@link UserResponse}.
         * @param {FollowingVariables} variables - The {@link FollowingVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UserResponse>} A promise that resolves to the {@link UserResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.following({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         */
        following: (
            variables: FollowingVariables,
            options?: RequestOptions
        ) => Promise<UserResponse>;

        /**
         * `FollowerQuery` fetches a single follower of the given `userId`. Returns a {@link UserResponse}.
         * @param {FollowerVariables} variables - The {@link FollowerVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<UserResponse>} A promise that resolves to the {@link UserResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.follower({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         */
        follower: (variables: FollowerVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * `ThreadQuery` fetches a single forum thread by `id`. Returns a {@link ThreadResponse}.
         * @param {ThreadVariables} variables - The {@link ThreadVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the {@link ThreadResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.thread({id: 71881, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         */
        thread: (variables: ThreadVariables, options?: RequestOptions) => Promise<ThreadResponse>;

        /**
         * `ThreadCommentQuery` fetches a single thread comment by `id`. Returns a {@link ThreadCommentResponse}.
         * @param {ThreadCommentVariables} variables - The {@link ThreadCommentVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the {@link ThreadCommentResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/threadcomment
         */
        threadComment: (
            variables: ThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<ThreadCommentResponse>;

        /**
         * `RecommendationQuery` fetches a single recommendation by `id` or `mediaId`. Returns a {@link RecommendationResponse}.
         * @param {RecommendationVariables} variables - The {@link RecommendationVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the {@link RecommendationResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/recommendation
         */
        recommendation: (
            variables: RecommendationVariables,
            options?: RequestOptions
        ) => Promise<RecommendationResponse>;

        /**
         * `MarkdownQuery` parses AniList markdown into HTML. Returns the rendered HTML string.
         * @param {MarkdownVariables} variables - The {@link MarkdownVariables} for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<string>} A promise that resolves to the markdown data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.markdown({markdown: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/parsedmarkdown
         */
        markdown: (variables: MarkdownVariables, options?: RequestOptions) => Promise<string>;

        /**
         * `AniChartUserQuery` fetches the AniChart settings for the authenticated user. Returns an {@link AniChartUserResponse}. Must be authenticated.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<AniChartUserResponse>} A promise that resolves to the {@link AniChartUserResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.aniChartUser();
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/object/anichartuser
         */
        aniChartUser: (options?: RequestOptions) => Promise<AniChartUserResponse>;

        /**
         * `SiteStatisticsQuery` fetches aggregate AniList site statistics, optionally filtered by `variables`. Returns a {@link SiteStatisticsResponse}.
         * @param {SiteStatisticsVariables} variables - Optional {@link SiteStatisticsVariables} filters for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<SiteStatisticsResponse>} A promise that resolves to the {@link SiteStatisticsResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.siteStatistics();
         * ```
         * @see https://docs.anilist.co/reference/object/sitestatistics
         */
        siteStatistics: (
            variables?: SiteStatisticsVariables,
            options?: RequestOptions
        ) => Promise<SiteStatisticsResponse>;

        /**
         * `ExternalLinkSourceCollectionQuery` returns the available external link sources, optionally filtered by `variables`. Returns an {@link ExternalLinkSourceCollectionResponse}.
         * @param {ExternalLinkSourceCollectionVariables} variables - Optional {@link ExternalLinkSourceCollectionVariables} filters for the query.
         * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
         * @returns {Promise<ExternalLinkSourceCollectionResponse>} A promise that resolves to the {@link ExternalLinkSourceCollectionResponse} data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.externalLinkSourceCollection();
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        externalLinkSourceCollection: (
            variables?: ExternalLinkSourceCollectionVariables,
            options?: RequestOptions
        ) => Promise<ExternalLinkSourceCollectionResponse>;

        /**
         * {@link AniListQueries} groups the paginated query operations. All page queries mirror the single-object queries above
         * with the addition of `page` and `perPage` variables, and return a `*PageResponse` carrying the items
         * plus `PageInfo` pagination metadata. Drive them with `paginate` or
         * `paginatePages` to walk all pages automatically.
         *
         * @public
         * @type {Object}
         * @property {Function} users - Fetches users data from the AniList API.
         * @property {Function} medias - Fetches medias data from the AniList API.
         * @property {Function} characters - Fetches characters data from the AniList API.
         * @property {Function} staffs - Fetches staffs data from the AniList API.
         * @property {Function} studios - Fetches studios data from the AniList API.
         * @property {Function} mediaLists - Fetches media lists data from the AniList API.
         * @property {Function} airingSchedules - Fetches airing schedules data from the AniList API.
         * @property {Function} mediaTrends - Fetches media trends data from the AniList API.
         * @property {Function} notifications - Fetches notifications data from the AniList API.
         * @property {Function} followers - Fetches followers data from the AniList API.
         * @property {Function} following - Fetches following data from the AniList API.
         * @property {Function} activities - Fetches activities data from the AniList API.
         * @property {Function} activityReplies - Fetches activity replies data from the AniList API.
         * @property {Function} threads - Fetches threads data from the AniList API.
         * @property {Function} threadComments - Fetches thread comments data from the AniList API.
         * @property {Function} reviews - Fetches reviews data from the AniList API.
         * @property {Function} recommendations - Fetches recommendations data from the AniList API.
         * @property {Function} likes - Fetches likes data from the AniList API.
         */
        page: {
            /**
             * `UsersQuery` fetches a page of users. Returns a {@link UsersPageResponse} with the items and `PageInfo`.
             * @param {UsersVariables} variables - The {@link UsersVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<UsersPageResponse>} A promise that resolves to the {@link UsersPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.users({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             */
            users: (
                variables: UsersVariables,
                options?: RequestOptions
            ) => Promise<UsersPageResponse>;

            /**
             * `MediasQuery` fetches a page of anime/manga. Returns a {@link MediasPageResponse} with the items and `PageInfo`.
             * @param {MediasVariables} variables - The {@link MediasVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<MediasPageResponse>} A promise that resolves to the {@link MediasPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.medias({page: 1, perPage: 10, type: 'ANIME'});
             * ```
             * @see https://docs.anilist.co/reference/object/media
             */
            medias: (
                variables: MediasVariables,
                options?: RequestOptions
            ) => Promise<MediasPageResponse>;

            /**
             * `CharactersQuery` fetches a page of characters. Returns a {@link CharactersPageResponse} with the items and `PageInfo`.
             * @param {CharactersVariables} variables - The {@link CharactersVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<CharactersPageResponse>} A promise that resolves to the {@link CharactersPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.characters({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/character
             */
            characters: (
                variables: CharactersVariables,
                options?: RequestOptions
            ) => Promise<CharactersPageResponse>;

            /**
             * `StaffsQuery` fetches a page of staff members. Returns a {@link StaffsPageResponse} with the items and `PageInfo`.
             * @param {StaffsVariables} variables - The {@link StaffsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<StaffsPageResponse>} A promise that resolves to the {@link StaffsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.staffs({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/staff
             */
            staffs: (
                variables: StaffsVariables,
                options?: RequestOptions
            ) => Promise<StaffsPageResponse>;

            /**
             * `StudiosQuery` fetches a page of studios. Returns a {@link StudiosPageResponse} with the items and `PageInfo`.
             * @param {StudiosVariables} variables - The {@link StudiosVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<StudiosPageResponse>} A promise that resolves to the {@link StudiosPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.studios({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/studio
             */
            studios: (
                variables: StudiosVariables,
                options?: RequestOptions
            ) => Promise<StudiosPageResponse>;

            /**
             * `MediaListsQuery` fetches a page of media list entries. Returns a {@link MediaListsPageResponse} with the items and `PageInfo`.
             * @param {MediaListsVariables} variables - The {@link MediaListsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<MediaListsPageResponse>} A promise that resolves to the {@link MediaListsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.mediaLists({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/medialist
             */
            mediaLists: (
                variables: MediaListsVariables,
                options?: RequestOptions
            ) => Promise<MediaListsPageResponse>;

            /**
             * `AiringSchedulesQuery` fetches a page of airing schedule entries. Returns an {@link AiringSchedulesPageResponse} with the items and `PageInfo`.
             * @param {AiringSchedulesVariables} variables - The {@link AiringSchedulesVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<AiringSchedulesPageResponse>} A promise that resolves to the {@link AiringSchedulesPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.airingSchedules({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/airingschedule
             */
            airingSchedules: (
                variables: AiringSchedulesVariables,
                options?: RequestOptions
            ) => Promise<AiringSchedulesPageResponse>;

            /**
             * `MediaTrendsQuery` fetches a page of media trend entries. Returns a {@link MediaTrendsPageResponse} with the items and `PageInfo`.
             * @param {MediaTrendsVariables} variables - The {@link MediaTrendsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<MediaTrendsPageResponse>} A promise that resolves to the {@link MediaTrendsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.mediaTrends({page: 1, perPage: 10, type: 'ANIME'});
             * ```
             * Must be querying an airing anime. Returns error if not.
             * @see https://docs.anilist.co/reference/object/mediatrend
             */
            mediaTrends: (
                variables: MediaTrendsVariables,
                options?: RequestOptions
            ) => Promise<MediaTrendsPageResponse>;

            /**
             * `NotificationsQuery` fetches a page of the authenticated user's notifications. Returns a {@link NotificationsPageResponse} with the items and `PageInfo`. Must be authenticated.
             * @param {NotificationsVariables} variables - The {@link NotificationsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<NotificationsPageResponse>} A promise that resolves to the {@link NotificationsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.notifications({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/union/notificationunion
             */
            notifications: (
                variables: NotificationsVariables,
                options?: RequestOptions
            ) => Promise<NotificationsPageResponse>;

            /**
             * `FollowersQuery` fetches a page of a user's followers. Returns a {@link FollowersPageResponse} with the items and `PageInfo`.
             * @param {FollowersVariables} variables - The {@link FollowersVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<FollowersPageResponse>} A promise that resolves to the {@link FollowersPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.followers({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             */
            followers: (
                variables: FollowersVariables,
                options?: RequestOptions
            ) => Promise<FollowersPageResponse>;

            /**
             * `FollowingsQuery` fetches a page of users that the given `userId` follows. Returns a {@link FollowingsPageResponse} with the items and `PageInfo`.
             * @param {FollowingsVariables} variables - The {@link FollowingsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<FollowingsPageResponse>} A promise that resolves to the {@link FollowingsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.following({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             */
            following: (
                variables: FollowingsVariables,
                options?: RequestOptions
            ) => Promise<FollowingsPageResponse>;

            /**
             * `ActivitiesQuery` fetches a page of activities. Returns an {@link ActivitiesPageResponse} with the items and `PageInfo`.
             * @param {ActivitiesVariables} variables - The {@link ActivitiesVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<ActivitiesPageResponse>} A promise that resolves to the {@link ActivitiesPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activities({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/union/activityunion
             */
            activities: (
                variables: ActivitiesVariables,
                options?: RequestOptions
            ) => Promise<ActivitiesPageResponse>;

            /**
             * `ActivityRepliesQuery` fetches a page of replies for an activity. Returns an {@link ActivityRepliesPageResponse} with the items and `PageInfo`.
             * @param {ActivityRepliesVariables} variables - The {@link ActivityRepliesVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<ActivityRepliesPageResponse>} A promise that resolves to the {@link ActivityRepliesPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activityReplies({page: 1, perPage: 10, activityId: 723235883});
             * ```
             * @see https://docs.anilist.co/reference/object/activityreply
             */
            activityReplies: (
                variables: ActivityRepliesVariables,
                options?: RequestOptions
            ) => Promise<ActivityRepliesPageResponse>;

            /**
             * `ThreadsQuery` fetches a page of forum threads. Returns a {@link ThreadsPageResponse} with the items and `PageInfo`.
             * @param {ThreadsVariables} variables - The {@link ThreadsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<ThreadsPageResponse>} A promise that resolves to the {@link ThreadsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.threads({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/thread
             */
            threads: (
                variables: ThreadsVariables,
                options?: RequestOptions
            ) => Promise<ThreadsPageResponse>;

            /**
             * `ThreadCommentsQuery` fetches a page of comments for a thread. Returns a {@link ThreadCommentsPageResponse} with the items and `PageInfo`.
             * @param {ThreadCommentsVariables} variables - The {@link ThreadCommentsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<ThreadCommentsPageResponse>} A promise that resolves to the {@link ThreadCommentsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.threadComments({page: 1, perPage: 10, threadId: 71881});
             * ```
             * @see https://docs.anilist.co/reference/object/threadcomment
             */
            threadComments: (
                variables: ThreadCommentsVariables,
                options?: RequestOptions
            ) => Promise<ThreadCommentsPageResponse>;

            /**
             * `ReviewsQuery` fetches a page of reviews. Returns a {@link ReviewsPageResponse} with the items and `PageInfo`.
             * @param {ReviewsVariables} variables - The {@link ReviewsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<ReviewsPageResponse>} A promise that resolves to the {@link ReviewsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.reviews({page: 1, perPage: 10, mediaId: 1});
             * ```
             * @see https://docs.anilist.co/reference/object/review
             */
            reviews: (
                variables: ReviewsVariables,
                options?: RequestOptions
            ) => Promise<ReviewsPageResponse>;

            /**
             * `RecommendationsQuery` fetches a page of recommendations. Returns a {@link RecommendationsPageResponse} with the items and `PageInfo`.
             * @param {RecommendationsVariables} variables - The {@link RecommendationsVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<RecommendationsPageResponse>} A promise that resolves to the {@link RecommendationsPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.recommendations({page: 1, perPage: 10, mediaId: 1});
             * ```
             * @see https://docs.anilist.co/reference/object/recommendation
             */
            recommendations: (
                variables: RecommendationsVariables,
                options?: RequestOptions
            ) => Promise<RecommendationsPageResponse>;

            /**
             * `LikesQuery` fetches a page of users who liked a likeable entity. Returns a {@link LikesPageResponse} with the items and `PageInfo`.
             * @param {LikesVariables} variables - The {@link LikesVariables} for the query.
             * @param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.
             * @returns {Promise<LikesPageResponse>} A promise that resolves to the {@link LikesPageResponse} data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.likes({page: 1, perPage: 10, likeAbleId: 1});
             * ```
             * @see https://docs.anilist.co/reference/union/likeableunion
             */
            likes: (
                variables: LikesVariables,
                options?: RequestOptions
            ) => Promise<LikesPageResponse>;
        };
    };
};
