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

export type AniListQueries = {
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
};
