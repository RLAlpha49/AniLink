/**
 * AniList provider facade.
 *
 * Builds the `anilist` surface of the `AniLink` client: the `custom`,
 * `query`, `mutation`, pagination, and helper namespaces. Adding an operation
 * means adding its class import here plus one entry in the constructor wiring.
 */
import { type ActivityReply, type Activity } from "./interfaces/Activity";
import { type Likeable } from "./interfaces/Likeable";
import { ActivityQuery, type ActivityVariables } from "./query/Activity";
import { ActivityReplyQuery, type ActivityReplyVariables } from "./query/ActivityReply";
import { ActivityRepliesQuery, type ActivityRepliesVariables } from "./query/page/ActivityReplies";
import { ActivitiesQuery, type ActivitiesVariables } from "./query/page/Activities";
import { type ActivitiesPageResponse } from "./interfaces/responses/page/Activities";
import { type ActivityRepliesPageResponse } from "./interfaces/responses/page/ActivityReplies";
import { AiringScheduleQuery, type AiringScheduleVariables } from "./query/AiringSchedule";
import { type AiringScheduleResponse } from "./interfaces/responses/query/AiringSchedule";
import { AiringSchedulesQuery, type AiringSchedulesVariables } from "./query/page/AiringSchedules";
import { type AiringSchedulesPageResponse } from "./interfaces/responses/page/AiringSchedules";
import { AniChartUserQuery } from "./query/AniChartUser";
import { type AniChartUserResponse } from "./interfaces/responses/query/AniChartUser";
import { CharacterQuery, type CharacterVariables } from "./query/Character";
import { type CharacterResponse } from "./interfaces/responses/query/Character";
import { CharactersQuery, type CharactersVariables } from "./query/page/Characters";
import { type CharactersPageResponse } from "./interfaces/responses/page/Characters";
import { ExternalLinkSourceCollectionQuery } from "./query/ExternalLinkSourceCollection";
import { type ExternalLinkSourceCollectionResponse } from "./interfaces/responses/query/ExternalLinkSourceCollection";
import { FollowerQuery, type FollowerVariables } from "./query/Follower";
import { FollowersQuery, type FollowersVariables } from "./query/page/Followers";
import { type FollowersPageResponse } from "./interfaces/responses/page/Followers";
import { FollowingQuery, type FollowingVariables } from "./query/Following";
import { FollowingsQuery, type FollowingsVariables } from "./query/page/Followings";
import { type FollowingsPageResponse } from "./interfaces/responses/page/Followings";
import { GenreCollectionQuery } from "./query/GenreCollection";
import { LikesQuery, type LikesVariables } from "./query/page/Likes";
import { type LikesPageResponse } from "./interfaces/responses/page/Likes";
import { MarkdownQuery, type MarkdownVariables } from "./query/Markdown";
import {
    MediaListCollectionQuery,
    type MediaListCollectionVariables,
} from "./query/MediaListCollection";
import { type MediaListCollectionResponse } from "./interfaces/responses/query/MediaListCollectionResponse";
import { MediaListQuery, type MediaListVariables } from "./query/MediaList";
import { type MediaListResponse } from "./interfaces/responses/query/MediaList";
import { MediaListsQuery, type MediaListsVariables } from "./query/page/MediaLists";
import { type MediaListsPageResponse } from "./interfaces/responses/page/MediaLists";
import { MediaQuery, type MediaVariables } from "./query/Media";
import { type MediaResponse } from "./interfaces/responses/query/Media";
import { MediaTagCollectionQuery } from "./query/MediaTagCollection";
import { type MediaTagCollectionResponse } from "./interfaces/responses/query/MediaTagCollection";
import { MediaTrendQuery, type MediaTrendVariables } from "./query/MediaTrend";
import { type MediaTrendResponse } from "./interfaces/responses/query/MediaTrend";
import { MediaTrendsQuery, type MediaTrendsVariables } from "./query/page/MediaTrends";
import { MediasQuery, type MediasVariables } from "./query/page/Medias";
import { type MediasPageResponse } from "./interfaces/responses/page/Medias";
import { type MediaTrendsPageResponse } from "./interfaces/responses/page/MediaTrends";
import { NotificationQuery, type NotificationVariables } from "./query/Notification";
import { type NotificationResponse } from "./interfaces/responses/query/Notification";
import { NotificationsQuery, type NotificationsVariables } from "./query/page/Notifications";
import { type NotificationsPageResponse } from "./interfaces/responses/page/Notifications";
import { RecommendationQuery, type RecommendationVariables } from "./query/Recommendation";
import { type RecommendationResponse } from "./interfaces/responses/query/Recommendation";
import { RecommendationsQuery, type RecommendationsVariables } from "./query/page/Recommendations";
import { type RecommendationsPageResponse } from "./interfaces/responses/page/Recommendations";
import { ReviewQuery, type ReviewVariables } from "./query/Review";
import { type ReviewResponse } from "./interfaces/responses/query/Review";
import { ReviewsQuery, type ReviewsVariables } from "./query/page/Reviews";
import { type ReviewsPageResponse } from "./interfaces/responses/page/Reviews";
import {
    SaveMediaListEntryMutation,
    type SaveMediaListEntryVariables,
} from "./mutation/SaveMediaListEntry";
import { SiteStatisticsQuery } from "./query/SiteStatistics";
import { type SiteStatisticsResponse } from "./interfaces/responses/query/SiteStatistics";
import { StaffQuery, type StaffVariables } from "./query/Staff";
import { type StaffResponse } from "./interfaces/responses/query/Staff";
import { StaffsQuery, type StaffsVariables } from "./query/page/Staffs";
import { type StaffsPageResponse } from "./interfaces/responses/page/Staffs";
import { StudioQuery, type StudioVariables } from "./query/Studio";
import { type StudioResponse } from "./interfaces/responses/query/Studio";
import { StudiosQuery, type StudiosVariables } from "./query/page/Studios";
import { type StudiosPageResponse } from "./interfaces/responses/page/Studios";
import { ThreadCommentQuery, type ThreadCommentVariables } from "./query/ThreadComment";
import { type ThreadCommentResponse } from "./interfaces/responses/query/ThreadComment";
import { ThreadCommentsQuery, type ThreadCommentsVariables } from "./query/page/ThreadCommments";
import { type ThreadCommentsPageResponse } from "./interfaces/responses/page/ThreadComments";
import { ThreadQuery, type ThreadVariables } from "./query/Thread";
import { type ThreadResponse } from "./interfaces/responses/query/Thread";
import { ThreadsQuery, type ThreadsVariables } from "./query/page/Threads";
import { type ThreadsPageResponse } from "./interfaces/responses/page/Threads";
import {
    UpdateMediaListEntriesMutation,
    type UpdateMediaListEntriesVariables,
} from "./mutation/UpdateMediaListEntries";
import {
    UpdateUserMutation,
    type UpdateUserResponse,
    type UpdateUserVariables,
} from "./mutation/UpdateUser";
import { UserQuery, type UserVariables } from "./query/User";
import { type UserResponse } from "./interfaces/responses/query/User";
import { UsersQuery, type UsersVariables } from "./query/page/Users";
import { type UsersPageResponse } from "./interfaces/responses/page/Users";
import { ViewerQuery } from "./query/Viewer";
import {
    DeleteMediaListEntryMutation,
    type DeleteMediaListEntryVariables,
} from "./mutation/DeleteMediaListEntry";
import { type DeleteMediaListEntryResponse } from "./interfaces/responses/mutation/DeleteMediaListEntry";
import {
    DeleteCustomListMutation,
    type DeleteCustomListVariables,
} from "./mutation/DeleteCustomList";
import {
    SaveTextActivityMutation,
    type SaveTextActivityVariables,
} from "./mutation/SaveTextActivity";
import {
    SaveMessageActivityMutation,
    type SaveMessageActivityVariables,
} from "./mutation/SaveMessageActivity";
import {
    SaveListActivityMutation,
    type SaveListActivityVariables,
} from "./mutation/SaveListActivity";
import { DeleteActivityMutation, type DeleteActivityVariables } from "./mutation/DeleteActivity";
import {
    ToggleActivitySubscriptionMutation,
    type ToggleActivitySubscriptionVariables,
} from "./mutation/ToggleActivitySubscription";
import {
    ToggleActivityPinMutation,
    type ToggleActivityPinVariables,
} from "./mutation/ToggleActivityPin";
import {
    SaveActivityReplyMutation,
    type SaveActivityReplyVariables,
} from "./mutation/SaveActivityReply";
import {
    DeleteActivityReplyMutation,
    type DeleteActivityReplyVariables,
} from "./mutation/DeleteActivityReply";
import { ToggleLikeMutation, type ToggleLikeVariables } from "./mutation/ToggleLike";
import { ToggleLikeV2Mutation } from "./mutation/ToggleLikeV2";
import { type BasicUser } from "./interfaces/Basic";
import { ToggleFollowMutation, type ToggleFollowVariables } from "./mutation/ToggleFollow";
import { ToggleFavouriteMutation, type ToggleFavouriteVariables } from "./mutation/ToggleFavourite";
import { type Favourites } from "./interfaces/responses/mutation/Favourites";
import {
    UpdateFavouriteOrderMutation,
    type UpdateFavouriteOrderVariables,
} from "./mutation/UpdateFavouriteOrder";
import { SaveReviewMutation, type SaveReviewVariables } from "./mutation/SaveReview";
import { RateReviewMutation, type RateReviewVariables } from "./mutation/RateReview";
import { DeleteReviewMutation, type DeleteReviewVariables } from "./mutation/DeleteReview";
import {
    SaveRecommendationMutation,
    type SaveRecommendationVariables,
} from "./mutation/SaveRecommendation";
import { SaveThreadMutation, type SaveThreadVariables } from "./mutation/SaveThread";
import { DeleteThreadMutation, type DeleteThreadVariables } from "./mutation/DeleteThread";
import {
    ToggleThreadSubscriptionMutation,
    type ToggleThreadSubscriptionVariables,
} from "./mutation/ToggleThreadSubscription";
import {
    SaveThreadCommentMutation,
    type SaveThreadCommentVariables,
} from "./mutation/SaveThreadComment";
import {
    DeleteThreadCommentMutation,
    type DeleteThreadCommentVariables,
} from "./mutation/DeleteThreadComment";
import {
    UpdateAniChartSettingsMutation,
    type UpdateAniChartSettingsVariables,
} from "./mutation/UpdateAniChartSettings";
import {
    UpdateAniChartHighlightsMutation,
    type UpdateAniChartHighlightsVariables,
} from "./mutation/UpdateAniChartHighlights";
import { CustomRequest } from "./Custom";
import { fuzzyDate, type FuzzyDateOptions } from "./helpers/fuzzyDate";
import {
    flattenMediaListCollection,
    type FlattenedMediaListEntry,
} from "./helpers/flattenMediaListCollection";
import {
    paginate,
    paginatePages,
    paginateChunks,
    type PaginateOptions,
    type PaginateResult,
    type ChunkPaginateOptions,
    type ChunkPaginateResult,
} from "../../base/Paginator";
import type { PageInfo } from "./interfaces/responses/page/PageInfo";
import type { DeleteResult } from "./types/DeleteResult";
import type { FuzzyDateInput } from "./types/FuzzyDate";
import type { RequestOptions } from "../../base/RequestHandler";

export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkValidationError,
} from "../../base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "../../base/AniLinkError";

/** Transport settings accepted by an `AniLink` client: `timeout`, `signal`, opt-in `retry`, lifecycle hooks, and `exposeRawAxiosError`. */
export type AniLinkOptions = RequestOptions;

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
    custom: <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>;

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
         * @see https://docs.anilist.co/reference/query
         */
        user: (variables: UserVariables) => Promise<UserResponse>;

        /**
         * Fetches media data from the Anilist API.
         * @param {MediaVariables} variables - The variables for the query.
         * @returns {Promise<MediaResponse>} A promise that resolves to the media data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.media({id: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        media: (variables: MediaVariables) => Promise<MediaResponse>;

        /**
         * Fetches media trend data from the Anilist API.
         * @param {MediaTrendVariables} variables - The variables for the query.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trend data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        mediaTrend: (variables: MediaTrendVariables) => Promise<MediaTrendResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        airingSchedule: (variables: AiringScheduleVariables) => Promise<AiringScheduleResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        character: (variables: CharacterVariables) => Promise<CharacterResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        staff: (variables: StaffVariables) => Promise<StaffResponse>;

        /**
         * Fetches media list data from the Anilist API.
         * @param {MediaListVariables} variables - The variables for the query.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the media list data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaList({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        mediaList: (variables: MediaListVariables) => Promise<MediaListResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        mediaListCollection: (
            variables: MediaListCollectionVariables
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
         */
        genreCollection: () => Promise<string>;

        /**
         * Fetches media tag collection data from the Anilist API.
         * @returns {Promise<MediaTagCollectionResponse>} A promise that resolves to the media tag collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.mediaTagCollection()
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        mediaTagCollection: () => Promise<MediaTagCollectionResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        viewer: (variables: UserVariables) => Promise<UserResponse>;

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
         * @see https://docs.anilist.co/reference/query
         */
        notification: (variables: NotificationVariables) => Promise<NotificationResponse>;

        /**
         * Fetches studio data from the Anilist API.
         * @param {StudioVariables} variables - The variables for the query.
         * @returns {Promise<StudioResponse>} A promise that resolves to the studio data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.studio({id: 561, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        studio: (variables: StudioVariables) => Promise<StudioResponse>;

        /**
         * Fetches review data from the Anilist API.
         * @param {ReviewVariables} variables - The variables for the query.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the review data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.review({id: 8008, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        review: (variables: ReviewVariables) => Promise<ReviewResponse>;

        /**
         * Fetches activity data from the Anilist API.
         * @param {ActivityVariables} variables - The variables for the query.
         * @returns {Promise<Activity>} A promise that resolves to the activity data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activity({id: 723235883, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        activity: (variables: ActivityVariables) => Promise<Activity>;

        /**
         * Fetches activity reply data from the Anilist API.
         * @param {ActivityReplyVariables} variables - The variables for the query.
         * @returns {Promise<ActivityReply>} A promise that resolves to the activity reply data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        activityReply: (variables: ActivityReplyVariables) => Promise<ActivityReply>;

        /**
         * Fetches following data from the Anilist API.
         * @param {FollowingVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the following data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.following({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        following: (variables: FollowingVariables) => Promise<UserResponse>;

        /**
         * Fetches follower data from the Anilist API.
         * @param {FollowerVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the follower data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.follower({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        follower: (variables: FollowerVariables) => Promise<UserResponse>;

        /**
         * Fetches thread data from the Anilist API.
         * @param {ThreadVariables} variables - The variables for the query.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the thread data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.thread({id: 71881, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        thread: (variables: ThreadVariables) => Promise<ThreadResponse>;

        /**
         * Fetches thread comment data from the Anilist API.
         * @param {ThreadCommentVariables} variables - The variables for the query.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comment data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        threadComment: (variables: ThreadCommentVariables) => Promise<ThreadCommentResponse>;

        /**
         * Fetches recommendation data from the Anilist API.
         * @param {RecommendationVariables} variables - The variables for the query.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendation data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        recommendation: (variables: RecommendationVariables) => Promise<RecommendationResponse>;

        /**
         * Fetches markdown data from the Anilist API.
         * @param {MarkdownVariables} variables - The variables for the query.
         * @returns {Promise<string>} A promise that resolves to the markdown data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.markdown({markdown: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        markdown: (variables: MarkdownVariables) => Promise<string>;

        /**
         * Fetches aniChart user data from the Anilist API.
         * @returns {Promise<AniChartUserResponse>} A promise that resolves to the aniChart user data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.aniChartUser();
         * ```
         * Must be authenticated.
         * @see https://docs.anilist.co/reference/query
         */
        aniChartUser: () => Promise<AniChartUserResponse>;

        /**
         * Fetches site statistics data from the Anilist API.
         * @returns {Promise<SiteStatisticsResponse>} A promise that resolves to the site statistics data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.siteStatistics();
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        siteStatistics: () => Promise<SiteStatisticsResponse>;

        /**
         * Fetches external link source collection data from the Anilist API.
         * @returns {Promise<ExternalLinkSourceCollectionResponse>} A promise that resolves to the external link source collection data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.externalLinkSourceCollection();
         * ```
         * @see https://docs.anilist.co/reference/query
         */
        externalLinkSourceCollection: () => Promise<ExternalLinkSourceCollectionResponse>;

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
             * @see https://docs.anilist.co/reference/query
             */
            users: (variables: UsersVariables) => Promise<UsersPageResponse>;

            /**
             * Fetches medias data from the Anilist API.
             * @param {MediasVariables} variables - The variables for the query.
             * @returns {Promise<MediasPageResponse>} A promise that resolves to the medias data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.medias({page: 1, perPage: 10, type: 'ANIME'});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            medias: (variables: MediasVariables) => Promise<MediasPageResponse>;

            /**
             * Fetches characters data from the Anilist API.
             * @param {CharactersVariables} variables - The variables for the query.
             * @returns {Promise<CharactersPageResponse>} A promise that resolves to the characters data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.characters({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            characters: (variables: CharactersVariables) => Promise<CharactersPageResponse>;

            /**
             * Fetches staffs data from the Anilist API.
             * @param {StaffsVariables} variables - The variables for the query.
             * @returns {Promise<StaffsPageResponse>} A promise that resolves to the staffs data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.staffs({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            staffs: (variables: StaffsVariables) => Promise<StaffsPageResponse>;

            /**
             * Fetches studios data from the Anilist API.
             * @param {StudiosVariables} variables - The variables for the query.
             * @returns {Promise<StudiosPageResponse>} A promise that resolves to the studios data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.studios({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            studios: (variables: StudiosVariables) => Promise<StudiosPageResponse>;

            /**
             * Fetches media lists data from the Anilist API.
             * @param {MediaListsVariables} variables - The variables for the query.
             * @returns {Promise<MediaListsPageResponse>} A promise that resolves to the media lists data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.mediaLists({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            mediaLists: (variables: MediaListsVariables) => Promise<MediaListsPageResponse>;

            /**
             * Fetches airing schedules data from the Anilist API.
             * @param {AiringSchedulesVariables} variables - The variables for the query.
             * @returns {Promise<AiringSchedulesPageResponse>} A promise that resolves to the airing schedules data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.airingSchedules({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            airingSchedules: (
                variables: AiringSchedulesVariables
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
             * @see https://docs.anilist.co/reference/query
             */
            mediaTrends: (variables: MediaTrendsVariables) => Promise<MediaTrendsPageResponse>;

            /**
             * Fetches notifications data from the Anilist API.
             * @param {NotificationsVariables} variables - The variables for the query.
             * @returns {Promise<NotificationsPageResponse>} A promise that resolves to the notifications data and pagination metadata.\
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.notifications({page: 1, perPage: 10});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            notifications: (
                variables: NotificationsVariables
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
             * @see https://docs.anilist.co/reference/query
             */
            followers: (variables: FollowersVariables) => Promise<FollowersPageResponse>;

            /**
             * Fetches following data from the Anilist API.
             * @param {FollowingsVariables} variables - The variables for the query.
             * @returns {Promise<FollowingsPageResponse>} A promise that resolves to the following data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.following({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            following: (variables: FollowingsVariables) => Promise<FollowingsPageResponse>;

            /**
             * Fetches activities data from the Anilist API.
             * @param {ActivitiesVariables} variables - The variables for the query.
             * @returns {Promise<ActivitiesPageResponse>} A promise that resolves to the activities data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activities({page: 1, perPage: 10, userId: 542244});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            activities: (variables: ActivitiesVariables) => Promise<ActivitiesPageResponse>;

            /**
             * Fetches activity replies data from the Anilist API.
             * @param {ActivityRepliesVariables} variables - The variables for the query.
             * @returns {Promise<ActivityRepliesPageResponse>} A promise that resolves to the activity replies data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.activityReplies({page: 1, perPage: 10, activityId: 723235883});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            activityReplies: (
                variables: ActivityRepliesVariables
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
             * @see https://docs.anilist.co/reference/query
             */
            threads: (variables: ThreadsVariables) => Promise<ThreadsPageResponse>;

            /**
             * Fetches thread comments data from the Anilist API.
             * @param {ThreadCommentsVariables} variables - The variables for the query.
             * @returns {Promise<ThreadCommentsPageResponse>} A promise that resolves to the thread comments data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.threadComments({page: 1, perPage: 10, threadId: 71881});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            threadComments: (
                variables: ThreadCommentsVariables
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
             * @see https://docs.anilist.co/reference/query
             */
            reviews: (variables: ReviewsVariables) => Promise<ReviewsPageResponse>;

            /**
             * Fetches recommendations data from the Anilist API.
             * @param {RecommendationsVariables} variables - The variables for the query.
             * @returns {Promise<RecommendationsPageResponse>} A promise that resolves to the recommendations data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.recommendations({page: 1, perPage: 10, mediaId: 1});
             * ```
             * @see https://docs.anilist.co/reference/query
             */
            recommendations: (
                variables: RecommendationsVariables
            ) => Promise<RecommendationsPageResponse>;

            /**
             * Fetches likes data from the Anilist API.
             * @param {LikesVariables} variables - The variables for the query.
             * @returns {Promise<LikesPageResponse>} A promise that resolves to the likes data and pagination metadata.
             *
             * @example
             * ```typescript
             * await aniLink.anilist.query.page.likes({page: 1, perPage: 10, likeAbleId: 1});
             * @see https://docs.anilist.co/reference/query
             */
            likes: (variables: LikesVariables) => Promise<LikesPageResponse>;
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
         * @see https://docs.anilist.co/reference/mutation
         */
        updateUser: (variables: UpdateUserVariables) => Promise<UpdateUserResponse>;

        /**
         * Saves a media list entry on the Anilist API.
         * @param {SaveMediaListEntryVariables} variables - The variables for the mutation.
         * @returns {Promise<MediaListResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        saveMediaListEntry: (variables: SaveMediaListEntryVariables) => Promise<MediaListResponse>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        updateMediaListEntries: (
            variables: UpdateMediaListEntriesVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteMediaListEntry: (
            variables: DeleteMediaListEntryVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteCustomList: (variables: DeleteCustomListVariables) => Promise<DeleteResult>;

        /**
         * Saves a text activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveTextActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveTextActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        saveTextActivity: (variables: SaveTextActivityVariables) => Promise<Activity>;

        /**
         * Saves a message activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
         * @param {SaveMessageActivityVariables} variables - The variables for the mutation.
         * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveMessageActivity({text: 'Hello, world!'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        saveMessageActivity: (variables: SaveMessageActivityVariables) => Promise<Activity>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        saveListActivity: (variables: SaveListActivityVariables) => Promise<Activity>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteActivity: (variables: DeleteActivityVariables) => Promise<DeleteResult>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleActivityPin: (variables: ToggleActivityPinVariables) => Promise<Activity>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleActivitySubscription: (
            variables: ToggleActivitySubscriptionVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        saveActivityReply: (variables: SaveActivityReplyVariables) => Promise<ActivityReply>;

        /**
         * Deletes an activity reply on the Anilist API.
         * @param {DeleteActivityReplyVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the reply was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteActivityReply({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteActivityReply: (variables: DeleteActivityReplyVariables) => Promise<DeleteResult>;

        /**
         * Toggles a like on the Anilist API.
         * @param {ToggleLikeVariables} variables - The variables for the mutation.
         * @returns {Promise<BasicUser>} A promise that resolves to the user who performed the like toggle.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleLike: (variables: ToggleLikeVariables) => Promise<BasicUser>;

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
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleLikeV2: (variables: ToggleLikeVariables) => Promise<Likeable>;

        /**
         * Toggles a follow on the Anilist API.
         * @param {ToggleFollowVariables} variables - The variables for the mutation.
         * @returns {Promise<UserResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFollow({userId: 542244});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleFollow: (variables: ToggleFollowVariables) => Promise<UserResponse>;

        /**
         * Toggles a favorite on the Anilist API.
         * @param {ToggleFavouriteVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleFavorite({studioId: 561});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleFavourite: (variables: ToggleFavouriteVariables) => Promise<Favourites>;

        /**
         * Updates the order of favourites on the Anilist API.
         * @param {UpdateFavouriteOrderVariables} variables - The variables for the mutation.
         * @returns {Promise<Favourites>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateFavouriteOrder({ids: [1, 2, 3]});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        updateFavouriteOrder: (variables: UpdateFavouriteOrderVariables) => Promise<Favourites>;

        /**
         * Saves a review on the Anilist API. If no `id` is provided, a new review will be created. If an `id` is provided, the review with that `id` will be updated.
         * @param {SaveReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveReview({mediaId: 1, body: 'testing', summary: 'testing', score: 8, private: true});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        saveReview: (variables: SaveReviewVariables) => Promise<ReviewResponse>;

        /**
         * Rates a review on the Anilist API.
         * @param {RateReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the rated review.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.rateReview({reviewId: 8008, rating: 'UP_VOTE'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        rateReview: (variables: RateReviewVariables) => Promise<ReviewResponse>;

        /**
         * Deletes a review on the Anilist API.
         * @param {DeleteReviewVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteReview({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteReview: (variables: DeleteReviewVariables) => Promise<DeleteResult>;

        /**
         * Saves a recommendation on the Anilist API.
         * @param {SaveRecommendationVariables} variables - The variables for the mutation.
         * @returns {Promise<RecommendationResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.saveRecommendation({mediaId: 1, mediaRecommendationId: 2, rating: 8});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        saveRecommendation: (
            variables: SaveRecommendationVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        saveThread: (variables: SaveThreadVariables) => Promise<ThreadResponse>;

        /**
         * Deletes a thread on the Anilist API.
         * @param {DeleteThreadVariables} variables - The variables for the mutation.
         * @returns {Promise<DeleteResult>} A promise that resolves to `{ deleted }`, where `deleted` is `true` when the thread was deleted by this call and `false` when it was already absent.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.deleteThread({id: 1});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteThread: (variables: DeleteThreadVariables) => Promise<DeleteResult>;

        /**
         * Toggles a thread subscription on the Anilist API.
         * @param {ToggleThreadSubscriptionVariables} variables - The variables for the mutation.
         * @returns {Promise<ThreadResponse>} A promise that resolves when the mutation is complete.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.toggleThreadSubscription({threadId: 1, subscribe: true});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        toggleThreadSubscription: (
            variables: ToggleThreadSubscriptionVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        saveThreadComment: (
            variables: SaveThreadCommentVariables
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
         * @see https://docs.anilist.co/reference/mutation
         */
        deleteThreadComment: (variables: DeleteThreadCommentVariables) => Promise<DeleteResult>;

        /**
         * Updates the AniChart settings for a user on the Anilist API.
         * @param {UpdateAniChartSettingsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart settings string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartSettings({titleLanguage: 'romaji', theme: 'dark'});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        updateAniChartSettings: (variables: UpdateAniChartSettingsVariables) => Promise<string>;

        /**
         * Updates the AniChart highlights for a user on the Anilist API.
         * @param {UpdateAniChartHighlightsVariables} variables - The variables for the mutation.
         * @returns {Promise<string>} A promise that resolves to the updated AniChart highlights string.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.mutation.updateAniChartHighlights({highlights: [{mediaId: 1, highlight: 'test'}]});
         * ```
         * @see https://docs.anilist.co/reference/mutation
         */
        updateAniChartHighlights: (variables: UpdateAniChartHighlightsVariables) => Promise<string>;
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

/**
 * Builds the AniList facade from the operation classes.
 *
 * @param authToken - The authentication token shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The composed AniList API surface.
 */
export function buildAniListApi(authToken?: string, options?: AniLinkOptions): AniListApi {
    const customInstance = new CustomRequest(authToken, options);

    const userQueryInstance = new UserQuery(authToken, options);
    const mediaQueryInstance = new MediaQuery(authToken, options);
    const mediaTrendQueryInstance = new MediaTrendQuery(authToken, options);
    const airingScheduleQueryInstance = new AiringScheduleQuery(authToken, options);
    const characterQueryInstance = new CharacterQuery(authToken, options);
    const staffQueryInstance = new StaffQuery(authToken, options);
    const mediaListQueryInstance = new MediaListQuery(authToken, options);
    const mediaListCollectionQueryInstance = new MediaListCollectionQuery(authToken, options);
    const genreCollectionQueryInstance = new GenreCollectionQuery(authToken, options);
    const mediaTagCollectionQueryInstance = new MediaTagCollectionQuery(authToken, options);
    const viewerQueryInstance = new ViewerQuery(authToken, options);
    const notificationQueryInstance = new NotificationQuery(authToken, options);
    const studioQueryInstance = new StudioQuery(authToken, options);
    const reviewQueryInstance = new ReviewQuery(authToken, options);
    const activityQueryInstance = new ActivityQuery(authToken, options);
    const activityReplyQueryInstance = new ActivityReplyQuery(authToken, options);
    const followingQueryInstance = new FollowingQuery(authToken, options);
    const followerQueryInstance = new FollowerQuery(authToken, options);
    const threadQueryInstance = new ThreadQuery(authToken, options);
    const threadCommentQueryInstance = new ThreadCommentQuery(authToken, options);
    const recommendationQueryInstance = new RecommendationQuery(authToken, options);
    const markdownQueryInstance = new MarkdownQuery(authToken, options);
    const aniChartUserQueryInstance = new AniChartUserQuery(authToken, options);
    const siteStatisticsQueryInstance = new SiteStatisticsQuery(authToken, options);
    const externalLinkSourceCollectionQueryInstance = new ExternalLinkSourceCollectionQuery(
        authToken,
        options
    );

    const usersQueryInstance = new UsersQuery(authToken, options);
    const mediasQueryInstance = new MediasQuery(authToken, options);
    const charactersQueryInstance = new CharactersQuery(authToken, options);
    const staffsQueryInstance = new StaffsQuery(authToken, options);
    const studiosQueryInstance = new StudiosQuery(authToken, options);
    const mediaListsQueryInstance = new MediaListsQuery(authToken, options);
    const airingSchedulesQueryInstance = new AiringSchedulesQuery(authToken, options);
    const mediaTrendsQueryInstance = new MediaTrendsQuery(authToken, options);
    const notificationsQueryInstance = new NotificationsQuery(authToken, options);
    const followersQueryInstance = new FollowersQuery(authToken, options);
    const followingsQueryInstance = new FollowingsQuery(authToken, options);
    const activitiesQueryInstance = new ActivitiesQuery(authToken, options);
    const activityRepliesQueryInstance = new ActivityRepliesQuery(authToken, options);
    const threadsQueryInstance = new ThreadsQuery(authToken, options);
    const threadCommentsQueryInstance = new ThreadCommentsQuery(authToken, options);
    const reviewsQueryInstance = new ReviewsQuery(authToken, options);
    const recommendationsQueryInstance = new RecommendationsQuery(authToken, options);
    const likesQueryInstance = new LikesQuery(authToken, options);

    const updateUserMutationInstance = new UpdateUserMutation(authToken, options);
    const saveMediaListEntryMutationInstance = new SaveMediaListEntryMutation(authToken, options);
    const updateMediaListEntriesMutationInstance = new UpdateMediaListEntriesMutation(
        authToken,
        options
    );
    const deleteMediaListEntryMutationInstance = new DeleteMediaListEntryMutation(
        authToken,
        options
    );
    const deleteCustomListMutationInstance = new DeleteCustomListMutation(authToken, options);
    const saveTextActivityMutationInstance = new SaveTextActivityMutation(authToken, options);
    const saveMessageActivityMutationInstance = new SaveMessageActivityMutation(authToken, options);
    const saveListActivityMutationInstance = new SaveListActivityMutation(authToken, options);
    const deleteActivityMutationInstance = new DeleteActivityMutation(authToken, options);
    const toggleActivityPinMutationInstance = new ToggleActivityPinMutation(authToken, options);
    const toggleActivitySubscriptionMutationInstance = new ToggleActivitySubscriptionMutation(
        authToken,
        options
    );
    const saveActivityReplyMutationInstance = new SaveActivityReplyMutation(authToken, options);
    const deleteActivityReplyMutationInstance = new DeleteActivityReplyMutation(authToken, options);
    const toggleLikeMutationInstance = new ToggleLikeMutation(authToken, options);
    const toggleLikeV2MutationInstance = new ToggleLikeV2Mutation(authToken, options);
    const toggleFollowMutationInstance = new ToggleFollowMutation(authToken, options);
    const toggleFavouriteMutationInstance = new ToggleFavouriteMutation(authToken, options);
    const updateFavouriteOrderMutationInstance = new UpdateFavouriteOrderMutation(
        authToken,
        options
    );
    const saveReviewMutationInstance = new SaveReviewMutation(authToken, options);
    const rateReviewMutationInstance = new RateReviewMutation(authToken, options);
    const deleteReviewMutationInstance = new DeleteReviewMutation(authToken, options);
    const saveRecommendationMutationInstance = new SaveRecommendationMutation(authToken, options);
    const saveThreadMutationInstance = new SaveThreadMutation(authToken, options);
    const deleteThreadMutationInstance = new DeleteThreadMutation(authToken, options);
    const toggleThreadSubscriptionMutationInstance = new ToggleThreadSubscriptionMutation(
        authToken,
        options
    );
    const saveThreadCommentMutationInstance = new SaveThreadCommentMutation(authToken, options);
    const deleteThreadCommentMutationInstance = new DeleteThreadCommentMutation(authToken, options);
    const updateAniChartSettingsMutationInstance = new UpdateAniChartSettingsMutation(
        authToken,
        options
    );
    const updateAniChartHighlightsMutationInstance = new UpdateAniChartHighlightsMutation(
        authToken,
        options
    );

    return {
        custom: customInstance.custom.bind(customInstance),
        query: {
            user: userQueryInstance.user.bind(userQueryInstance),
            media: mediaQueryInstance.media.bind(mediaQueryInstance),
            mediaTrend: mediaTrendQueryInstance.mediaTrend.bind(mediaTrendQueryInstance),
            airingSchedule: airingScheduleQueryInstance.airingSchedule.bind(
                airingScheduleQueryInstance
            ),
            character: characterQueryInstance.character.bind(characterQueryInstance),
            staff: staffQueryInstance.staff.bind(staffQueryInstance),
            mediaList: mediaListQueryInstance.mediaList.bind(mediaListQueryInstance),
            mediaListCollection: mediaListCollectionQueryInstance.mediaListCollection.bind(
                mediaListCollectionQueryInstance
            ),
            genreCollection: genreCollectionQueryInstance.genreCollection.bind(
                genreCollectionQueryInstance
            ),
            mediaTagCollection: mediaTagCollectionQueryInstance.mediaTagCollection.bind(
                mediaTagCollectionQueryInstance
            ),
            viewer: viewerQueryInstance.viewer.bind(viewerQueryInstance),
            notification: notificationQueryInstance.notification.bind(notificationQueryInstance),
            studio: studioQueryInstance.studio.bind(studioQueryInstance),
            review: reviewQueryInstance.review.bind(reviewQueryInstance),
            activity: activityQueryInstance.activity.bind(activityQueryInstance),
            activityReply: activityReplyQueryInstance.activityReply.bind(
                activityReplyQueryInstance
            ),
            following: followingQueryInstance.following.bind(followingQueryInstance),
            follower: followerQueryInstance.follower.bind(followerQueryInstance),
            thread: threadQueryInstance.thread.bind(threadQueryInstance),
            threadComment: threadCommentQueryInstance.threadComment.bind(
                threadCommentQueryInstance
            ),
            recommendation: recommendationQueryInstance.recommendation.bind(
                recommendationQueryInstance
            ),
            markdown: markdownQueryInstance.markdown.bind(markdownQueryInstance),
            aniChartUser: aniChartUserQueryInstance.aniChartUser.bind(aniChartUserQueryInstance),
            siteStatistics: siteStatisticsQueryInstance.siteStatistics.bind(
                siteStatisticsQueryInstance
            ),
            externalLinkSourceCollection:
                externalLinkSourceCollectionQueryInstance.externalLinkSourceCollection.bind(
                    externalLinkSourceCollectionQueryInstance
                ),

            page: {
                users: usersQueryInstance.users.bind(usersQueryInstance),
                medias: mediasQueryInstance.medias.bind(mediasQueryInstance),
                characters: charactersQueryInstance.characters.bind(charactersQueryInstance),
                staffs: staffsQueryInstance.staffs.bind(staffsQueryInstance),
                studios: studiosQueryInstance.studios.bind(studiosQueryInstance),
                mediaLists: mediaListsQueryInstance.mediaLists.bind(mediaListsQueryInstance),
                airingSchedules: airingSchedulesQueryInstance.airingSchedules.bind(
                    airingSchedulesQueryInstance
                ),
                mediaTrends: mediaTrendsQueryInstance.mediaTrends.bind(mediaTrendsQueryInstance),
                notifications: notificationsQueryInstance.notifications.bind(
                    notificationsQueryInstance
                ),
                followers: followersQueryInstance.followers.bind(followersQueryInstance),
                following: followingsQueryInstance.followings.bind(followingsQueryInstance),
                activities: activitiesQueryInstance.activities.bind(activitiesQueryInstance),
                activityReplies: activityRepliesQueryInstance.activityReplies.bind(
                    activityRepliesQueryInstance
                ),
                threads: threadsQueryInstance.threads.bind(threadsQueryInstance),
                threadComments: threadCommentsQueryInstance.threadComments.bind(
                    threadCommentsQueryInstance
                ),
                reviews: reviewsQueryInstance.reviews.bind(reviewsQueryInstance),
                recommendations: recommendationsQueryInstance.recommendations.bind(
                    recommendationsQueryInstance
                ),
                likes: likesQueryInstance.likes.bind(likesQueryInstance),
            },
        },
        mutation: {
            updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance),
            saveMediaListEntry: saveMediaListEntryMutationInstance.saveMediaListEntry.bind(
                saveMediaListEntryMutationInstance
            ),
            updateMediaListEntries:
                updateMediaListEntriesMutationInstance.updateMediaListEntries.bind(
                    updateMediaListEntriesMutationInstance
                ),
            deleteMediaListEntry: deleteMediaListEntryMutationInstance.deleteMediaListEntry.bind(
                deleteMediaListEntryMutationInstance
            ),
            deleteCustomList: deleteCustomListMutationInstance.deleteCustomList.bind(
                deleteCustomListMutationInstance
            ),
            saveTextActivity: saveTextActivityMutationInstance.saveTextActivity.bind(
                saveTextActivityMutationInstance
            ),
            saveMessageActivity: saveMessageActivityMutationInstance.saveMessageActivity.bind(
                saveMessageActivityMutationInstance
            ),
            saveListActivity: saveListActivityMutationInstance.saveListActivity.bind(
                saveListActivityMutationInstance
            ),
            deleteActivity: deleteActivityMutationInstance.deleteActivity.bind(
                deleteActivityMutationInstance
            ),
            toggleActivityPin: toggleActivityPinMutationInstance.toggleActivityPin.bind(
                toggleActivityPinMutationInstance
            ),
            toggleActivitySubscription:
                toggleActivitySubscriptionMutationInstance.toggleActivitySubscription.bind(
                    toggleActivitySubscriptionMutationInstance
                ),
            saveActivityReply: saveActivityReplyMutationInstance.saveActivityReply.bind(
                saveActivityReplyMutationInstance
            ),
            deleteActivityReply: deleteActivityReplyMutationInstance.deleteActivityReply.bind(
                deleteActivityReplyMutationInstance
            ),
            toggleLike: toggleLikeMutationInstance.toggleLike.bind(toggleLikeMutationInstance),
            toggleLikeV2: toggleLikeV2MutationInstance.toggleLikeV2.bind(
                toggleLikeV2MutationInstance
            ),
            toggleFollow: toggleFollowMutationInstance.toggleFollow.bind(
                toggleFollowMutationInstance
            ),
            toggleFavourite: toggleFavouriteMutationInstance.toggleFavourite.bind(
                toggleFavouriteMutationInstance
            ),
            updateFavouriteOrder: updateFavouriteOrderMutationInstance.updateFavouriteOrder.bind(
                updateFavouriteOrderMutationInstance
            ),
            saveReview: saveReviewMutationInstance.saveReview.bind(saveReviewMutationInstance),
            rateReview: rateReviewMutationInstance.rateReview.bind(rateReviewMutationInstance),
            deleteReview: deleteReviewMutationInstance.deleteReview.bind(
                deleteReviewMutationInstance
            ),
            saveRecommendation: saveRecommendationMutationInstance.saveRecommendation.bind(
                saveRecommendationMutationInstance
            ),
            saveThread: saveThreadMutationInstance.saveThread.bind(saveThreadMutationInstance),
            deleteThread: deleteThreadMutationInstance.deleteThread.bind(
                deleteThreadMutationInstance
            ),
            toggleThreadSubscription:
                toggleThreadSubscriptionMutationInstance.toggleThreadSubscription.bind(
                    toggleThreadSubscriptionMutationInstance
                ),
            saveThreadComment: saveThreadCommentMutationInstance.saveThreadComment.bind(
                saveThreadCommentMutationInstance
            ),
            deleteThreadComment: deleteThreadCommentMutationInstance.deleteThreadComment.bind(
                deleteThreadCommentMutationInstance
            ),
            updateAniChartSettings:
                updateAniChartSettingsMutationInstance.updateAniChartSettings.bind(
                    updateAniChartSettingsMutationInstance
                ),
            updateAniChartHighlights:
                updateAniChartHighlightsMutationInstance.updateAniChartHighlights.bind(
                    updateAniChartHighlightsMutationInstance
                ),
        },
        paginate,
        paginatePages,
        paginateChunks,
        fuzzyDate,
        flattenMediaListCollection,
    };
}
