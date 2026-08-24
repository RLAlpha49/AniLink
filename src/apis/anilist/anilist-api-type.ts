/**
 * The `AniListApi` type: the typed surface of the `anilist` namespace
 * exposed by the `AniLink` client.
 */
import { type ActivityReply, type Activity } from "./interfaces/Activity";
import { type Likeable } from "./interfaces/Likeable";
import type { RequestOptions } from "../../base/RequestHandler";
import { type MediaTagCollectionVariables } from "./query/MediaTagCollection";
import { type SiteStatisticsVariables } from "./query/SiteStatistics";
import { type ExternalLinkSourceCollectionVariables } from "./query/ExternalLinkSourceCollection";
import { type ActivityVariables } from "./query/Activity";
import { type ActivityReplyVariables } from "./query/ActivityReply";
import { type ActivityRepliesVariables } from "./query/page/ActivityReplies";
import { type ActivitiesVariables } from "./query/page/Activities";
import { type ActivitiesPageResponse } from "./interfaces/responses/page/Activities";
import { type ActivityRepliesPageResponse } from "./interfaces/responses/page/ActivityReplies";
import { type AiringScheduleVariables } from "./query/AiringSchedule";
import { type AiringScheduleResponse } from "./interfaces/responses/query/AiringSchedule";
import { type AiringSchedulesVariables } from "./query/page/AiringSchedules";
import { type AiringSchedulesPageResponse } from "./interfaces/responses/page/AiringSchedules";
import { type AniChartUserResponse } from "./interfaces/responses/query/AniChartUser";
import { type CharacterVariables } from "./query/Character";
import { type CharacterResponse } from "./interfaces/responses/query/Character";
import { type CharactersVariables } from "./query/page/Characters";
import { type CharactersPageResponse } from "./interfaces/responses/page/Characters";
import { type ExternalLinkSourceCollectionResponse } from "./interfaces/responses/query/ExternalLinkSourceCollection";
import { type FollowerVariables } from "./query/Follower";
import { type FollowersVariables } from "./query/page/Followers";
import { type FollowersPageResponse } from "./interfaces/responses/page/Followers";
import { type FollowingVariables } from "./query/Following";
import { type FollowingsVariables } from "./query/page/Followings";
import { type FollowingsPageResponse } from "./interfaces/responses/page/Followings";
import { type LikesVariables } from "./query/page/Likes";
import { type LikesPageResponse } from "./interfaces/responses/page/Likes";
import { type MarkdownVariables } from "./query/Markdown";
import { type MediaListCollectionVariables } from "./query/MediaListCollection";
import { type MediaListCollectionResponse } from "./interfaces/responses/query/MediaListCollectionResponse";
import { type MediaListVariables } from "./query/MediaList";
import { type MediaListResponse } from "./interfaces/responses/query/MediaList";
import { type MediaListsVariables } from "./query/page/MediaLists";
import { type MediaListsPageResponse } from "./interfaces/responses/page/MediaLists";
import { type MediaVariables } from "./query/Media";
import { type MediaResponse } from "./interfaces/responses/query/Media";
import { type MediaTagCollectionResponse } from "./interfaces/responses/query/MediaTagCollection";
import { type MediaTrendVariables } from "./query/MediaTrend";
import { type MediaTrendResponse } from "./interfaces/responses/query/MediaTrend";
import { type MediaTrendsVariables } from "./query/page/MediaTrends";
import { type MediasVariables } from "./query/page/Medias";
import { type MediasPageResponse } from "./interfaces/responses/page/Medias";
import { type MediaTrendsPageResponse } from "./interfaces/responses/page/MediaTrends";
import { type NotificationVariables } from "./query/Notification";
import { type NotificationResponse } from "./interfaces/responses/query/Notification";
import { type NotificationsVariables } from "./query/page/Notifications";
import { type NotificationsPageResponse } from "./interfaces/responses/page/Notifications";
import { type RecommendationVariables } from "./query/Recommendation";
import { type RecommendationResponse } from "./interfaces/responses/query/Recommendation";
import { type RecommendationsVariables } from "./query/page/Recommendations";
import { type RecommendationsPageResponse } from "./interfaces/responses/page/Recommendations";
import { type ReviewVariables } from "./query/Review";
import { type ReviewResponse } from "./interfaces/responses/query/Review";
import { type ReviewsVariables } from "./query/page/Reviews";
import { type ReviewsPageResponse } from "./interfaces/responses/page/Reviews";
import { type SaveMediaListEntryVariables } from "./mutation/SaveMediaListEntry";
import { type SiteStatisticsResponse } from "./interfaces/responses/query/SiteStatistics";
import { type StaffVariables } from "./query/Staff";
import { type StaffResponse } from "./interfaces/responses/query/Staff";
import { type StaffsVariables } from "./query/page/Staffs";
import { type StaffsPageResponse } from "./interfaces/responses/page/Staffs";
import { type StudioVariables } from "./query/Studio";
import { type StudioResponse } from "./interfaces/responses/query/Studio";
import { type StudiosVariables } from "./query/page/Studios";
import { type StudiosPageResponse } from "./interfaces/responses/page/Studios";
import { type ThreadCommentVariables } from "./query/ThreadComment";
import { type ThreadCommentResponse } from "./interfaces/responses/query/ThreadComment";
import { type ThreadCommentsVariables } from "./query/page/ThreadComments";
import { type ThreadCommentsPageResponse } from "./interfaces/responses/page/ThreadComments";
import { type ThreadVariables } from "./query/Thread";
import { type ThreadResponse } from "./interfaces/responses/query/Thread";
import { type ThreadsVariables } from "./query/page/Threads";
import { type ThreadsPageResponse } from "./interfaces/responses/page/Threads";
import { type UpdateMediaListEntriesVariables } from "./mutation/UpdateMediaListEntries";
import { type UpdateUserResponse, type UpdateUserVariables } from "./mutation/UpdateUser";
import { type UserVariables } from "./query/User";
import { type UserResponse } from "./interfaces/responses/query/User";
import { type UsersVariables } from "./query/page/Users";
import { type UsersPageResponse } from "./interfaces/responses/page/Users";
import { type DeleteMediaListEntryVariables } from "./mutation/DeleteMediaListEntry";
import { type DeleteMediaListEntryResponse } from "./interfaces/responses/mutation/DeleteMediaListEntry";
import { type DeleteCustomListVariables } from "./mutation/DeleteCustomList";
import { type SaveTextActivityVariables } from "./mutation/SaveTextActivity";
import { type SaveMessageActivityVariables } from "./mutation/SaveMessageActivity";
import { type SaveListActivityVariables } from "./mutation/SaveListActivity";
import { type DeleteActivityVariables } from "./mutation/DeleteActivity";
import { type ToggleActivitySubscriptionVariables } from "./mutation/ToggleActivitySubscription";
import { type ToggleActivityPinVariables } from "./mutation/ToggleActivityPin";
import { type SaveActivityReplyVariables } from "./mutation/SaveActivityReply";
import { type DeleteActivityReplyVariables } from "./mutation/DeleteActivityReply";
import { type ToggleLikeVariables } from "./mutation/ToggleLike";
import { type BasicUser } from "./interfaces/Basic";
import { type ToggleFollowVariables } from "./mutation/ToggleFollow";
import { type ToggleFavouriteVariables } from "./mutation/ToggleFavourite";
import { type Favourites } from "./interfaces/responses/mutation/Favourites";
import { type UpdateFavouriteOrderVariables } from "./mutation/UpdateFavouriteOrder";
import { type SaveReviewVariables } from "./mutation/SaveReview";
import { type RateReviewVariables } from "./mutation/RateReview";
import { type DeleteReviewVariables } from "./mutation/DeleteReview";
import { type SaveRecommendationVariables } from "./mutation/SaveRecommendation";
import { type SaveThreadVariables } from "./mutation/SaveThread";
import { type DeleteThreadVariables } from "./mutation/DeleteThread";
import { type ToggleThreadSubscriptionVariables } from "./mutation/ToggleThreadSubscription";
import { type SaveThreadCommentVariables } from "./mutation/SaveThreadComment";
import { type DeleteThreadCommentVariables } from "./mutation/DeleteThreadComment";
import { type UpdateAniChartSettingsVariables } from "./mutation/UpdateAniChartSettings";
import { type UpdateAniChartHighlightsVariables } from "./mutation/UpdateAniChartHighlights";
import { type FuzzyDateOptions } from "./helpers/fuzzyDate";
import { type FlattenedMediaListEntry } from "./helpers/flattenMediaListCollection";
import {
    type PaginateOptions,
    type PaginateResult,
    type ChunkPaginateOptions,
    type ChunkPaginateResult,
} from "../../base/Paginator";
import { type PageInfo } from "./interfaces/responses/page/PageInfo";
import { type DeleteResult } from "./types/DeleteResult";
import { type FuzzyDateInput } from "./types/FuzzyDate";

/** Callback that fetches a single `PageInfo`-based page. */
type PageFetcher<TPage extends { pageInfo: PageInfo }> = (
    page: number,
    perPage: number
) => Promise<TPage>;

/** Callback that fetches a single `MediaListCollection` chunk. */
type ChunkFetcher<TChunk extends { hasNextChunk: boolean }> = (
    chunk: number,
    perChunk: number
) => Promise<TChunk>;

/**
 * The AniList API surface exposed at `aniLink.anilist`.
 */
export type AniListApi = {
    /**
     * Custom query or mutation.
     * @param query - The query for the request.
     * @param variables - The variables for the request. This parameter is optional.
     * @returns {Promise<any>} A promise that resolves to the response from the request.
     *
     * @example
     * ```typescript
     * const viewer = await aniLink.anilist.custom('query {Viewer {id}}');
     *
     * const mutation = 'mutation ($about: String) {UpdateUser (about: $about) {id}}';
     * const variables = { about: "New about text" };
     * const response = await aniLink.anilist.custom(mutation, variables);
     * ```
     */
    custom: <T = unknown>(
        query: string,
        variables?: Record<string, unknown>,
        options?: RequestOptions
    ) => Promise<T>;

    /**
     * Query methods for fetching data from the Anilist API.
     * @public
     * @type {Object}
     * @property {Function} user - Fetches user data from the Anilist API.
     * @property {Function} media - Fetches media data from the Anilist API.
     * @property {Function} mediaTrend - Fetches media trend data from the Anilist API.
     * @property {Function} airingSchedule - Fetches airing schedule data from the Anilist API.
     * @property {Function} character - Fetches character data from the Anilist API.
     * @property {Function} staff - Fetches staff data from the Anilist API.
     * @property {Function} mediaList - Fetches media list data from the Anilist API.
     * @property {Function} mediaListCollection - Fetches media list collection data from the Anilist API.
     * @property {Function} like - Fetches users who liked a model from the Anilist API.
     * @property {Function} genreCollection - Fetches genre collection data from the Anilist API.
     * @property {Function} mediaTagCollection - Fetches media tag collection data from the Anilist API.
     * @property {Function} viewer - Fetches viewer data from the Anilist API.
     * @property {Function} notification - Fetches notification data from the Anilist API.
     * @property {Function} studio - Fetches studio data from the Anilist API.
     * @property {Function} review - Fetches review data from the Anilist API.
     * @property {Function} activity - Fetches activity data from the Anilist API.
     * @property {Function} activityReply - Fetches activity reply data from the Anilist API.
     * @property {Function} following - Fetches following data from the Anilist API.
     * @property {Function} follower - Fetches follower data from the Anilist API.
     * @property {Function} thread - Fetches thread data from the Anilist API.
     * @property {Function} threadComment - Fetches thread comment data from the Anilist API.
     * @property {Function} recommendation - Fetches recommendation data from the Anilist API.
     * @property {Function} markdown - Fetches markdown data from the Anilist API.
     * @property {Function} aniChartUser - Fetches aniChart user data from the Anilist API.
     * @property {Function} siteStatistics - Fetches site statistics data from the Anilist API.
     * @property {Function} externalLinkSourceCollection - Fetches external link source collection data from the Anilist API.
     * @property {Object} page - Fetches pages of data from the Anilist API.
     */
    query: {
        /**
         * Fetches user data from the Anilist API.
         * @param {UserVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the user's data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.user({id: 542244, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        user: (variables: UserVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * Fetches media data from the Anilist API.
         * @param {MediaVariables} variables - The variables for the query.
         * @returns {Promise<MediaResponse>} A promise that resolves to the media data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.media({id: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/object/media
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        media: (variables: MediaVariables, options?: RequestOptions) => Promise<MediaResponse>;

        /**
         * Fetches media trend data from the Anilist API.
         * @param {MediaTrendVariables} variables - The variables for the query.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trend data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/object/mediatrend
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        mediaTrend: (
            variables: MediaTrendVariables,
            options?: RequestOptions
        ) => Promise<MediaTrendResponse>;

        /**
         * Fetches airing schedule data from the Anilist API.
         * @param {AiringScheduleVariables} variables - The variables for the query.
         * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedule data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.airingSchedule({mediaId: 130590});
         * ```
         * Must be quering an airing anime. Returns error if not.
         * @see https://docs.anilist.co/reference/object/airingschedule
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        airingSchedule: (
            variables: AiringScheduleVariables,
            options?: RequestOptions
        ) => Promise<AiringScheduleResponse>;

        /**
         * Fetches character data from the Anilist API.
         * @param {CharacterVariables} variables - The variables for the query.
         * @returns {Promise<CharacterResponse>} A promise that resolves to the character data.
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
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        character: (
            variables: CharacterVariables,
            options?: RequestOptions
        ) => Promise<CharacterResponse>;

        /**
         * Fetches staff data from the Anilist API.
         * @param {StaffVariables} variables - The variables for the query.
         * @returns {Promise<StaffResponse>} A promise that resolves to the staff data.
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
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        staff: (variables: StaffVariables, options?: RequestOptions) => Promise<StaffResponse>;

        /**
         * Fetches media list data from the Anilist API.
         * @param {MediaListVariables} variables - The variables for the query.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the media list data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaList({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        mediaList: (
            variables: MediaListVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse>;

        /**
         * Fetches media list collection data from the Anilist API.
         * @param {MediaListCollectionVariables} variables - The variables for the query.
         * @returns {Promise<MediaListCollectionResponse>} A promise that resolves to the media list collection data.
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
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        mediaListCollection: (
            variables: MediaListCollectionVariables,
            options?: RequestOptions
        ) => Promise<MediaListCollectionResponse>;

        /**
         * Fetches genre collection data from the Anilist API.
         * @returns {Promise<String>} A promise that resolves to the genre collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.genreCollection()
         * ```
         * @see https://docs.anilist.co/reference/query
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        genreCollection: (options?: RequestOptions) => Promise<string>;

        /**
         * Fetches media tag collection data from the Anilist API.
         * @returns {Promise<MediaTagCollectionResponse>} A promise that resolves to the media tag collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTagCollection()
         * ```
         * @see https://docs.anilist.co/reference/object/mediatag
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        mediaTagCollection: (
            variables?: MediaTagCollectionVariables,
            options?: RequestOptions
        ) => Promise<MediaTagCollectionResponse>;

        /**
         * Fetches viewer data from the Anilist API.
         * @param {UserVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the viewer data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.viewer({asHtml: true});
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        viewer: (variables: UserVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * Fetches notification data from the Anilist API.
         * @param {NotificationVariables} variables - The variables for the query.
         * @returns {Promise<NotificationResponse>} A promise that resolves to the notification data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.notification({asHtml: true});
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/union/notificationunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        notification: (
            variables: NotificationVariables,
            options?: RequestOptions
        ) => Promise<NotificationResponse>;

        /**
         * Fetches studio data from the Anilist API.
         * @param {StudioVariables} variables - The variables for the query.
         * @returns {Promise<StudioResponse>} A promise that resolves to the studio data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.studio({id: 561, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/studio
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        studio: (variables: StudioVariables, options?: RequestOptions) => Promise<StudioResponse>;

        /**
         * Fetches review data from the Anilist API.
         * @param {ReviewVariables} variables - The variables for the query.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the review data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.review({id: 8008, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        review: (variables: ReviewVariables, options?: RequestOptions) => Promise<ReviewResponse>;

        /**
         * Fetches activity data from the Anilist API.
         * @param {ActivityVariables} variables - The variables for the query.
         * @returns {Promise<Activity>} A promise that resolves to the activity data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activity({id: 723235883, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        activity: (variables: ActivityVariables, options?: RequestOptions) => Promise<Activity>;

        /**
         * Fetches activity reply data from the Anilist API.
         * @param {ActivityReplyVariables} variables - The variables for the query.
         * @returns {Promise<ActivityReply>} A promise that resolves to the activity reply data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/activityreply
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        activityReply: (
            variables: ActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<ActivityReply>;

        /**
         * Fetches following data from the Anilist API.
         * @param {FollowingVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the following data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.following({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        following: (
            variables: FollowingVariables,
            options?: RequestOptions
        ) => Promise<UserResponse>;

        /**
         * Fetches follower data from the Anilist API.
         * @param {FollowerVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the follower data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.follower({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        follower: (variables: FollowerVariables, options?: RequestOptions) => Promise<UserResponse>;

        /**
         * Fetches thread data from the Anilist API.
         * @param {ThreadVariables} variables - The variables for the query.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the thread data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.thread({id: 71881, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        thread: (variables: ThreadVariables, options?: RequestOptions) => Promise<ThreadResponse>;

        /**
         * Fetches thread comment data from the Anilist API.
         * @param {ThreadCommentVariables} variables - The variables for the query.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comment data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/threadcomment
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        threadComment: (
            variables: ThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<ThreadCommentResponse>;

        /**
         * Fetches recommendation data from the Anilist API.
         * @param {RecommendationVariables} variables - The variables for the query.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendation data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/object/recommendation
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        recommendation: (
            variables: RecommendationVariables,
            options?: RequestOptions
        ) => Promise<RecommendationResponse>;

        /**
         * Fetches markdown data from the Anilist API.
         * @param {MarkdownVariables} variables - The variables for the query.
         * @returns {Promise<string>} A promise that resolves to the markdown data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.markdown({markdown: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/parsedmarkdown
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        markdown: (variables: MarkdownVariables, options?: RequestOptions) => Promise<string>;

        /**
         * Fetches aniChart user data from the Anilist API.
         * @returns {Promise<AniChartUserResponse>} A promise that resolves to the aniChart user data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.aniChartUser();
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/object/anichartuser
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        aniChartUser: (options?: RequestOptions) => Promise<AniChartUserResponse>;

        /**
         * Fetches site statistics data from the Anilist API.
         * @returns {Promise<SiteStatisticsResponse>} A promise that resolves to the site statistics data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.siteStatistics();
         * ```
         * @see https://docs.anilist.co/reference/object/sitestatistics
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        siteStatistics: (
            variables?: SiteStatisticsVariables,
            options?: RequestOptions
        ) => Promise<SiteStatisticsResponse>;

        /**
         * Fetches external link source collection data from the Anilist API.
         * @returns {Promise<ExternalLinkSourceCollectionResponse>} A promise that resolves to the external link source collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.externalLinkSourceCollection();
         * ```
         * @see https://docs.anilist.co/reference/query
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        externalLinkSourceCollection: (
            variables?: ExternalLinkSourceCollectionVariables,
            options?: RequestOptions
        ) => Promise<ExternalLinkSourceCollectionResponse>;

        /**
         * Fetches pages of data from the Anilist API.
         * All page queries have the same structure as original queries with the addition of `page` and `perPage` variables.
         *
         * @public
         * @type {Object}
         * @property {Function} users - Fetches users data from the Anilist API.
         * @property {Function} medias - Fetches medias data from the Anilist API.
         * @property {Function} characters - Fetches characters data from the Anilist API.
         * @property {Function} staffs - Fetches staffs data from the Anilist API.
         * @property {Function} studios - Fetches studios data from the Anilist API.
         * @property {Function} mediaLists - Fetches media lists data from the Anilist API.
         * @property {Function} airingSchedules - Fetches airing schedules data from the Anilist API.
         * @property {Function} mediaTrends - Fetches media trends data from the Anilist API.
         * @property {Function} notifications - Fetches notifications data from the Anilist API.
         * @property {Function} followers - Fetches followers data from the Anilist API.
         * @property {Function} following - Fetches following data from the Anilist API.
         * @property {Function} activities - Fetches activities data from the Anilist API.
         * @property {Function} activityReplies - Fetches activity replies data from the Anilist API.
         * @property {Function} threads - Fetches threads data from the Anilist API.
         * @property {Function} threadComments - Fetches thread comments data from the Anilist API.
         * @property {Function} reviews - Fetches reviews data from the Anilist API.
         * @property {Function} recommendations - Fetches recommendations data from the Anilist API.
         * @property {Function} likes - Fetches likes data from the Anilist API.
         */
        page: {
            /**
             * Fetches users data from the Anilist API.
             * @param {UsersVariables} variables - The variables for the query.
             * @returns {Promise<UsersPageResponse>} A promise that resolves to the users data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.users({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            users: (
                variables: UsersVariables,
                options?: RequestOptions
            ) => Promise<UsersPageResponse>;

            /**
             * Fetches medias data from the Anilist API.
             * @param {MediasVariables} variables - The variables for the query.
             * @returns {Promise<MediasPageResponse>} A promise that resolves to the medias data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.medias({page: 1, perPage: 10, type: 'ANIME'});
             * ```
             * @see https://docs.anilist.co/reference/object/media
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            medias: (
                variables: MediasVariables,
                options?: RequestOptions
            ) => Promise<MediasPageResponse>;

            /**
             * Fetches characters data from the Anilist API.
             * @param {CharactersVariables} variables - The variables for the query.
             * @returns {Promise<CharactersPageResponse>} A promise that resolves to the characters data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.characters({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/character
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            characters: (
                variables: CharactersVariables,
                options?: RequestOptions
            ) => Promise<CharactersPageResponse>;

            /**
             * Fetches staffs data from the Anilist API.
             * @param {StaffsVariables} variables - The variables for the query.
             * @returns {Promise<StaffsPageResponse>} A promise that resolves to the staffs data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.staffs({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/staff
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            staffs: (
                variables: StaffsVariables,
                options?: RequestOptions
            ) => Promise<StaffsPageResponse>;

            /**
             * Fetches studios data from the Anilist API.
             * @param {StudiosVariables} variables - The variables for the query.
             * @returns {Promise<StudiosPageResponse>} A promise that resolves to the studios data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.studios({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/studio
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            studios: (
                variables: StudiosVariables,
                options?: RequestOptions
            ) => Promise<StudiosPageResponse>;

            /**
             * Fetches media lists data from the Anilist API.
             * @param {MediaListsVariables} variables - The variables for the query.
             * @returns {Promise<MediaListsPageResponse>} A promise that resolves to the media lists data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.mediaLists({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/medialist
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            mediaLists: (
                variables: MediaListsVariables,
                options?: RequestOptions
            ) => Promise<MediaListsPageResponse>;

            /**
             * Fetches airing schedules data from the Anilist API.
             * @param {AiringSchedulesVariables} variables - The variables for the query.
             * @returns {Promise<AiringSchedulesPageResponse>} A promise that resolves to the airing schedules data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.airingSchedules({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/airingschedule
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            airingSchedules: (
                variables: AiringSchedulesVariables,
                options?: RequestOptions
            ) => Promise<AiringSchedulesPageResponse>;

            /**
             * Fetches media trends data from the Anilist API.
             * @param {MediaTrendsVariables} variables - The variables for the query.
             * @returns {Promise<MediaTrendsPageResponse>} A promise that resolves to the media trends data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.mediaTrends({page: 1, perPage: 10, type: 'ANIME'});
             * ```
             * Must be quering an airing anime. Returns error if not.
             * @see https://docs.anilist.co/reference/object/mediatrend
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            mediaTrends: (
                variables: MediaTrendsVariables,
                options?: RequestOptions
            ) => Promise<MediaTrendsPageResponse>;

            /**
             * Fetches notifications data from the Anilist API.
             * @param {NotificationsVariables} variables - The variables for the query.
             * @returns {Promise<NotificationsPageResponse>} A promise that resolves to the notifications data and pagination metadata.\
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.notifications({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/union/notificationunion
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            notifications: (
                variables: NotificationsVariables,
                options?: RequestOptions
            ) => Promise<NotificationsPageResponse>;

            /**
             * Fetches followers data from the Anilist API.
             * @param {FollowersVariables} variables - The variables for the query.
             * @returns {Promise<FollowersPageResponse>} A promise that resolves to the followers data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.followers({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            followers: (
                variables: FollowersVariables,
                options?: RequestOptions
            ) => Promise<FollowersPageResponse>;

            /**
             * Fetches following data from the Anilist API.
             * @param {FollowingsVariables} variables - The variables for the query.
             * @returns {Promise<FollowingsPageResponse>} A promise that resolves to the following data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.following({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/object/user
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            following: (
                variables: FollowingsVariables,
                options?: RequestOptions
            ) => Promise<FollowingsPageResponse>;

            /**
             * Fetches activities data from the Anilist API.
             * @param {ActivitiesVariables} variables - The variables for the query.
             * @returns {Promise<ActivitiesPageResponse>} A promise that resolves to the activities data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activities({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/union/activityunion
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            activities: (
                variables: ActivitiesVariables,
                options?: RequestOptions
            ) => Promise<ActivitiesPageResponse>;

            /**
             * Fetches activity replies data from the Anilist API.
             * @param {ActivityRepliesVariables} variables - The variables for the query.
             * @returns {Promise<ActivityRepliesPageResponse>} A promise that resolves to the activity replies data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activityReplies({page: 1, perPage: 10, activityId: 723235883});
             * ```
             * @see https://docs.anilist.co/reference/object/activityreply
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            activityReplies: (
                variables: ActivityRepliesVariables,
                options?: RequestOptions
            ) => Promise<ActivityRepliesPageResponse>;

            /**
             * Fetches threads data from the Anilist API.
             * @param {ThreadsVariables} variables - The variables for the query.
             * @returns {Promise<ThreadsPageResponse>} A promise that resolves to the threads data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.threads({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/object/thread
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            threads: (
                variables: ThreadsVariables,
                options?: RequestOptions
            ) => Promise<ThreadsPageResponse>;

            /**
             * Fetches thread comments data from the Anilist API.
             * @param {ThreadCommentsVariables} variables - The variables for the query.
             * @returns {Promise<ThreadCommentsPageResponse>} A promise that resolves to the thread comments data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.threadComments({page: 1, perPage: 10, threadId: 71881});
             * ```
             * @see https://docs.anilist.co/reference/object/threadcomment
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            threadComments: (
                variables: ThreadCommentsVariables,
                options?: RequestOptions
            ) => Promise<ThreadCommentsPageResponse>;

            /**
             * Fetches reviews data from the Anilist API.
             * @param {ReviewsVariables} variables - The variables for the query.
             * @returns {Promise<ReviewsPageResponse>} A promise that resolves to the reviews data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.reviews({page: 1, perPage: 10, mediaId: 1});
             * ```
             * @see https://docs.anilist.co/reference/object/review
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            reviews: (
                variables: ReviewsVariables,
                options?: RequestOptions
            ) => Promise<ReviewsPageResponse>;

            /**
             * Fetches recommendations data from the Anilist API.
             * @param {RecommendationsVariables} variables - The variables for the query.
             * @returns {Promise<RecommendationsPageResponse>} A promise that resolves to the recommendations data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.recommendations({page: 1, perPage: 10, mediaId: 1});
             * ```
             * @see https://docs.anilist.co/reference/object/recommendation
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            recommendations: (
                variables: RecommendationsVariables,
                options?: RequestOptions
            ) => Promise<RecommendationsPageResponse>;

            /**
             * Fetches likes data from the Anilist API.
             * @param {LikesVariables} variables - The variables for the query.
             * @returns {Promise<LikesPageResponse>} A promise that resolves to the likes data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.likes({page: 1, perPage: 10, likeAbleId: 1});
             * @see https://docs.anilist.co/reference/union/likeableunion
             * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
             */
            likes: (
                variables: LikesVariables,
                options?: RequestOptions
            ) => Promise<LikesPageResponse>;
        };
    };
    /**
     * Mutation methods for updating data on the Anilist API.
     * @public
     * @type {Object}
     * @property {Function} updateUser - Updates a user on the Anilist API.
     * @property {Function} saveMediaListEntry - Saves a media list entry on the Anilist API.
     * @property {Function} updateMediaListEntries - Updates media list entries on the Anilist API.
     * @property {Function} deleteMediaListEntry - Deletes a media list entry on the Anilist API.
     * @property {Function} deleteCustomList - Deletes a custom list on the Anilist API.
     * @property {Function} saveTextActivity - Saves a text activity on the Anilist API.
     * @property {Function} saveMessageActivity - Saves a message activity on the Anilist API.
     * @property {Function} saveListActivity - Saves a list activity on the Anilist API.
     * @property {Function} deleteActivity - Deletes an activity on the Anilist API.
     * @property {Function} toggleActivityPin - Toggles an activity's pin status on the Anilist API.
     * @property {Function} toggleActivitySubscription - Toggles an activity's subscription status on the Anilist API.
     * @property {Function} saveActivityReply - Saves an activity reply on the Anilist API.
     * @property {Function} deleteActivityReply - Deletes an activity reply on the Anilist API.
     * @property {Function} toggleLike - Toggles a like on the Anilist API.
     * @property {Function} toggleLikeV2 - Toggles a like on the Anilist API.
     * @property {Function} toggleFollow - Toggles a follow on the Anilist API.
     * @property {Function} toggleFavourite - Toggles a favorite on the Anilist API.
     * @property {Function} updateFavouriteOrder - Updates a favorite order on the Anilist API.
     * @property {Function} saveReview - Saves a review on the Anilist API.
     * @property {Function} rateReview - Rates a review on the Anilist API.
     * @property {Function} deleteReview - Deletes a review on the Anilist API.
     * @property {Function} saveRecommendation - Saves a recommendation on the Anilist API.
     * @property {Function} saveThread - Saves a thread on the Anilist API.
     * @property {Function} deleteThread - Deletes a thread on the Anilist API.
     * @property {Function} toggleThreadSubscription - Toggles a thread's subscription status on the Anilist API.
     * @property {Function} saveThreadComment - Saves a thread comment on the Anilist API.
     * @property {Function} deleteThreadComment - Deletes a thread comment on the Anilist API.
     * @property {Function} updateAniChartSettings - Updates aniChart settings on the Anilist API.
     * @property {Function} updateAniChartHighlights - Updates aniChart highlights on the Anilist API.
     *
     * Must be authenticated for all mutations.
     */
    mutation: {
        /**
         * Updates a user on the Anilist API.
         * @param {UpdateUserVariables} variables - The variables for the mutation.
         * @returns {Promise<UpdateUserResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateUser({
         *   about: 'New about text',
         *   titleLanguage: 'ENGLISH',
         *   displayAdultContent: true,
         *   airingNotifications: true,
         *   scoreFormat: 'POINT_10',
         *   rowOrder: 'title',
         *   profileColor: 'blue',
         *   donatorBadge: 'Supporter',
         *   notificationOptions: [{type: 'AIRING', enabled: true}],
         *   timezone: '-06:00',
         *   activityMergeTime: 30,
         *   animeListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
         *   mangaListOptions: {sectionOrder: ['title'], customLists: ['test'], advancedScoring: [], advancedScoringEnabled: false},
         *   staffNameLanguage: 'ROMAJI',
         *   restrictMessagesToFollowing: false,
         *   disabledListActivity: [{type: 'CURRENT', disabled: false}]
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateUser: (
            variables: UpdateUserVariables,
            options?: RequestOptions
        ) => Promise<UpdateUserResponse>;

        /**
         * Saves a media list entry on the Anilist API.
         * @param {SaveMediaListEntryVariables} variables - The variables for the mutation.
         * @returns {Promise<MediaListResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveMediaListEntry: (
            variables: SaveMediaListEntryVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse>;

        /**
         * Updates media list entries on the Anilist API.
         * @param {UpdateMediaListEntriesVariables} variables - The variables for the mutation.
         * @returns {Promise<MediaListResponse[]>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateMediaListEntries({
         *   status: 'CURRENT',
         *   score: 8.5,
         *   progress: 3,
         *   ids: [143271, 156822, 170890],
         * });
         * ```
         * @see https://docs.anilist.co/reference/object/medialist
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateMediaListEntries: (
            variables: UpdateMediaListEntriesVariables,
            options?: RequestOptions
        ) => Promise<MediaListResponse[]>;

        /**
         * Deletes a media list entry on the Anilist API.
         * @param {DeleteMediaListEntryVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteMediaListEntryResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * You cannot delete a media list entry without first fetching the entry's id. The entry's id is not the same as the mediaId. It is specific to each user and media.
         * ```typescript
         * await aniLink.anilist.mutation.deleteMediaListEntry({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteMediaListEntry: (
            variables: DeleteMediaListEntryVariables,
            options?: RequestOptions
        ) => Promise<DeleteMediaListEntryResponse>;

        /**
         * Deletes a custom list on the Anilist API. There is no mutation specifically for creating a custom list. You can create a custom list through the `updateUser` mutation under the `animeListOptions` or `mangaListOptions` variables.
         * @param {DeleteCustomListVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the  custom list was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteCustomLists({customList: 'test'});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteCustomList: (
            variables: DeleteCustomListVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Saves a text activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveTextActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveTextActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveTextActivity: (
            variables: SaveTextActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves a message activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveMessageActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMessageActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveMessageActivity: (
            variables: SaveMessageActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves a list activity on the Anilist API.
         * Mod Only
         * @param {SaveListActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveListActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveListActivity: (
            variables: SaveListActivityVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Deletes an activity on the Anilist API.
         * Mod Only
         * @param {DeleteActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the          activity was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivity({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteActivity: (
            variables: DeleteActivityVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles the pin status of an activity on the Anilist API.
         *
         * @param {ToggleActivityPinVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivityPin({id: 1, pinned: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleActivityPin: (
            variables: ToggleActivityPinVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Toggles the subscription status of an activity on the Anilist API.
         *
         * @param {ToggleActivitySubscriptionVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleActivitySubscription({activityId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/union/activityunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleActivitySubscription: (
            variables: ToggleActivitySubscriptionVariables,
            options?: RequestOptions
        ) => Promise<Activity>;

        /**
         * Saves an activity reply on the Anilist API. If no `id` is provided, a new activity reply will be created. If an `id` is provided, the activity reply with that `id` will be updated.
         * @param {SaveActivityReplyVariables} variables - The variables for the mutation.
         * @returns {Promise<ActivityReply>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveActivityReply({activityId: 1, text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/activityreply
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveActivityReply: (
            variables: SaveActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<ActivityReply>;

        /**
         * Deletes an activity reply on the Anilist API.
         * @param {DeleteActivityReplyVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivityReply({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteActivityReply: (
            variables: DeleteActivityReplyVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles a like on the Anilist API.
         * @param {ToggleLikeVariables} variables - The variables for the mutation.
         * @returns {Promise<BasicUser>} A promise that resolves to the user who performed the like toggle.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleLike: (
            variables: ToggleLikeVariables,
            options?: RequestOptions
        ) => Promise<BasicUser>;

        /**
         * Toggles a like on the Anilist API.
         * Returns a different response than the `toggleLike` mutation.
         * @param {ToggleLikeVariables} variables - The variables for the mutation.
         * @returns {Promise<Likeable>} A promise that resolves to the liked entity: an activity,
         * activity reply, thread, or thread comment depending on the likeable type.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLikeV2({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/union/likeableunion
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleLikeV2: (
            variables: ToggleLikeVariables,
            options?: RequestOptions
        ) => Promise<Likeable>;

        /**
         * Toggles a follow on the Anilist API.
         * @param {ToggleFollowVariables} variables - The variables for the mutation.
         * @returns {Promise<UserResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFollow({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/object/user
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleFollow: (
            variables: ToggleFollowVariables,
            options?: RequestOptions
        ) => Promise<UserResponse>;

        /**
         * Toggles a favorite on the Anilist API.
         * @param {ToggleFavouriteVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFavorite({studioId: 561});
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleFavourite: (
            variables: ToggleFavouriteVariables,
            options?: RequestOptions
        ) => Promise<Favourites>;

        /**
         * Updates the order of favourites on the Anilist API.
         * @param {UpdateFavouriteOrderVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateFavouriteOrder({ids: [1, 2, 3]});
         * ```
         * @see https://docs.anilist.co/reference/object/favourites
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateFavouriteOrder: (
            variables: UpdateFavouriteOrderVariables,
            options?: RequestOptions
        ) => Promise<Favourites>;

        /**
         * Saves a review on the Anilist API. If no `id` is provided, a new review will be created. If an `id` is provided, the review with that `id` will be updated.
         * @param {SaveReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveReview({mediaId: 1, body: 'testing', summary: 'testing', score: 8, private: true});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveReview: (
            variables: SaveReviewVariables,
            options?: RequestOptions
        ) => Promise<ReviewResponse>;

        /**
         * Rates a review on the Anilist API.
         * @param {RateReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the rated review.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.rateReview({reviewId: 8008, rating: 'UP_VOTE'});
         * ```
         * @see https://docs.anilist.co/reference/object/review
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        rateReview: (
            variables: RateReviewVariables,
            options?: RequestOptions
        ) => Promise<ReviewResponse>;

        /**
         * Deletes a review on the Anilist API.
         * @param {DeleteReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteReview({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteReview: (
            variables: DeleteReviewVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Saves a recommendation on the Anilist API.
         * @param {SaveRecommendationVariables} variables - The variables for the mutation.
         * @returns {Promise<RecommendationResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveRecommendation({mediaId: 1, mediaRecommendationId: 2, rating: 8});
         * ```
         * @see https://docs.anilist.co/reference/object/recommendation
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveRecommendation: (
            variables: SaveRecommendationVariables,
            options?: RequestOptions
        ) => Promise<RecommendationResponse>;

        /**
         * Saves a thread on the Anilist API. If no `id` is provided, a new thread will be created. If an `id` is provided, the thread with that `id` will be updated.
         * @param {SaveThreadVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThread({title: 'Hello, world!', body: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveThread: (
            variables: SaveThreadVariables,
            options?: RequestOptions
        ) => Promise<ThreadResponse>;

        /**
         * Deletes a thread on the Anilist API.
         * @param {DeleteThreadVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThread({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteThread: (
            variables: DeleteThreadVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Toggles a thread subscription on the Anilist API.
         * @param {ToggleThreadSubscriptionVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleThreadSubscription({threadId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/object/thread
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        toggleThreadSubscription: (
            variables: ToggleThreadSubscriptionVariables,
            options?: RequestOptions
        ) => Promise<ThreadResponse>;

        /**
         * Saves a thread comment on the Anilist API. If no `id` is provided, a new thread comment will be created. If an `id` is provided, the thread comment with that `id` will be updated.
         * @param {SaveThreadCommentVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveThreadComment({threadId: 1, comment: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/object/threadcomment
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        saveThreadComment: (
            variables: SaveThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<ThreadCommentResponse>;

        /**
         * Deletes a thread comment on the Anilist API.
         * @param {DeleteThreadCommentVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the comment was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThreadComment({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/object/deleted
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        deleteThreadComment: (
            variables: DeleteThreadCommentVariables,
            options?: RequestOptions
        ) => Promise<DeleteResult>;

        /**
         * Updates the AniChart settings for a user on the Anilist API.
         * @param {UpdateAniChartSettingsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart settings string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartSettings({titleLanguage: 'romaji', theme: 'dark'});
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateAniChartSettings: (
            variables: UpdateAniChartSettingsVariables,
            options?: RequestOptions
        ) => Promise<string>;

        /**
         * Updates the AniChart highlights for a user on the Anilist API.
         * @param {UpdateAniChartHighlightsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart highlights string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartHighlights({highlights: [{mediaId: 1, highlight: 'test'}]});
         * ```
         * @see https://docs.anilist.co/reference/object/anichartuser
         * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
         */
        updateAniChartHighlights: (
            variables: UpdateAniChartHighlightsVariables,
            options?: RequestOptions
        ) => Promise<string>;
    };

    /**
     * Iterates `PageInfo`-based pages until `hasNextPage` is false or `maxPages` is reached.
     * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
     * @param itemsKey - The key of the items array on the page response (e.g. `"media"`, `"users"`).
     * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
     * @returns The collected items, per-page snapshots, page count, and whether the guard truncated the run.
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
    paginate: <
        TPage extends { pageInfo: PageInfo },
        K extends {
            [P in keyof TPage]: TPage[P] extends readonly unknown[] ? P : never;
        }[keyof TPage] &
            keyof TPage,
    >(
        fetchPage: PageFetcher<TPage>,
        itemsKey: K,
        options?: PaginateOptions
    ) => Promise<PaginateResult<TPage[K] extends readonly (infer U)[] ? U : never>>;

    /**
     * Async generator yielding each `PageInfo`-based page until `hasNextPage` is false or `maxPages` is reached.
     * @param fetchPage - Callback that fetches a single page given its 1-based number and `perPage`.
     * @param options - Optional `perPage`, `startPage`, and `maxPages` controls.
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
    paginatePages: <TPage extends { pageInfo: PageInfo }>(
        fetchPage: PageFetcher<TPage>,
        options?: PaginateOptions
    ) => AsyncGenerator<TPage>;

    /**
     * Iterates `MediaListCollection` chunks until `hasNextChunk` is false or `maxChunks` is reached.
     * @param fetchChunk - Callback that fetches a single chunk given its 1-based number and `perChunk`.
     * @param itemsKey - The key of the items array on the chunk response (e.g. `"lists"`).
     * @param options - Optional `perChunk`, `startChunk`, and `maxChunks` controls.
     * @returns The collected items, per-chunk snapshots, chunk count, and whether the guard truncated the run.
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
    paginateChunks: <
        TChunk extends { hasNextChunk: boolean },
        K extends {
            [P in keyof TChunk]: TChunk[P] extends readonly unknown[] ? P : never;
        }[keyof TChunk] &
            keyof TChunk,
    >(
        fetchChunk: ChunkFetcher<TChunk>,
        itemsKey: K,
        options?: ChunkPaginateOptions
    ) => Promise<ChunkPaginateResult<TChunk[K] extends readonly (infer U)[] ? U : never>>;

    /**
     * Builds an AniList `FuzzyDateInput` from optional year, month, and day parts.
     * @param options - The year, month, and day to include. All fields are optional.
     * @returns A `FuzzyDateInput` object containing only the provided parts.
     * @see https://docs.anilist.co/reference/input/fuzzydateinput
     * @example
     * ```typescript
     * const startedAt = aniLink.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
     * ```
     */
    fuzzyDate: (options?: FuzzyDateOptions) => FuzzyDateInput;

    /**
     * Flattens a `MediaListCollection` response into a single array of entries tagged with their list group.
     * @param response - The `MediaListCollectionResponse` returned by `mediaListCollection`.
     * @returns A flat array of entries across all list groups.
     * @see https://docs.anilist.co/reference/object/medialistcollection
     * @example
     * ```typescript
     * const collection = await aniLink.anilist.query.mediaListCollection({ userId: 542244, type: "ANIME" });
     * const entries = aniLink.anilist.flattenMediaListCollection(collection);
     * console.log(entries.length, entries[0].listName);
     * ```
     */
    flattenMediaListCollection: (
        response: MediaListCollectionResponse
    ) => FlattenedMediaListEntry[];
};
