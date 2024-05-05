import { type ActivityReply, type Activity } from './apis/anilist/interfaces/Activity'
import { ActivityQuery, type ActivityVariables } from './apis/anilist/query/Activity'
import { ActivityReplyQuery, type ActivityReplyVariables } from './apis/anilist/query/ActivityReply'
import { ActivityRepliesQuery, type ActivityRepliesVariables } from './apis/anilist/query/page/ActivityReplies'
import { ActivitiesQuery, type ActivitiesVariables } from './apis/anilist/query/page/Activities'
import { AiringScheduleQuery, type AiringScheduleVariables } from './apis/anilist/query/AiringSchedule'
import { type AiringScheduleResponse } from './apis/anilist/interfaces/responses/query/AiringSchedule'
import { AiringSchedulesQuery, type AiringSchedulesVariables } from './apis/anilist/query/page/AiringSchedules'
import { AniChartUserQuery } from './apis/anilist/query/AniChartUser'
import { type AniChartUserResponse } from './apis/anilist/interfaces/responses/query/AniChartUser'
import { CharacterQuery, type CharacterVariables } from './apis/anilist/query/Character'
import { type CharacterResponse } from './apis/anilist/interfaces/responses/query/Character'
import { CharactersQuery, type CharactersVariables } from './apis/anilist/query/page/Characters'
import { ExternalLinkSourceCollectionQuery } from './apis/anilist/query/ExternalLinkSourceCollection'
import {
  type ExternalLinkSourceCollectionResponse
} from './apis/anilist/interfaces/responses/query/ExternalLinkSourceCollection'
import { FollowerQuery, type FollowerVariables } from './apis/anilist/query/Follower'
import { FollowersQuery, type FollowersVariables } from './apis/anilist/query/page/Followers'
import { FollowingQuery, type FollowingVariables } from './apis/anilist/query/Following'
import { FollowingsQuery, type FollowingsVariables } from './apis/anilist/query/page/Followings'
import { GenreCollectionQuery } from './apis/anilist/query/GenreCollection'
import { LikesQuery, type LikesVariables } from './apis/anilist/query/page/Likes'
import { MarkdownQuery, type MarkdownVariables } from './apis/anilist/query/Markdown'
import { MediaListCollectionQuery, type MediaListCollectionVariables } from './apis/anilist/query/MediaListCollection'
import { type MediaListCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaListCollectionResponse'
import { MediaListQuery, type MediaListVariables } from './apis/anilist/query/MediaList'
import { type MediaListResponse } from './apis/anilist/interfaces/responses/query/MediaList'
import { MediaListsQuery, type MediaListsVariables } from './apis/anilist/query/page/MediaLists'
import { MediaQuery, type MediaVariables } from './apis/anilist/query/Media'
import { type MediaResponse } from './apis/anilist/interfaces/responses/query/Media'
import { MediaTagCollectionQuery } from './apis/anilist/query/MediaTagCollection'
import { type MediaTagCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaTagCollection'
import { MediaTrendQuery, type MediaTrendVariables } from './apis/anilist/query/MediaTrend'
import { type MediaTrendResponse } from './apis/anilist/interfaces/responses/query/MediaTrend'
import { MediaTrendsQuery, type MediaTrendsVariables } from './apis/anilist/query/page/MediaTrends'
import { MediasQuery, type MediasVariables } from './apis/anilist/query/page/Medias'
import { NotificationQuery, type NotificationVariables } from './apis/anilist/query/Notification'
import { type NotificationResponse } from './apis/anilist/interfaces/responses/query/Notification'
import { NotificationsQuery, type NotificationsVariables } from './apis/anilist/query/page/Notifications'
import { RecommendationQuery, type RecommendationVariables } from './apis/anilist/query/Recommendation'
import { type RecommendationResponse } from './apis/anilist/interfaces/responses/query/Recommendation'
import { RecommendationsQuery, type RecommendationsVariables } from './apis/anilist/query/page/Recommendations'
import { ReviewQuery, type ReviewVariables } from './apis/anilist/query/Review'
import { type ReviewResponse } from './apis/anilist/interfaces/responses/query/Review'
import { ReviewsQuery, type ReviewsVariables } from './apis/anilist/query/page/Reviews'
import { SaveMediaListEntryMutation, type SaveMediaListEntryVariables } from './apis/anilist/mutation/SaveMediaListEntry'
import { SiteStatisticsQuery } from './apis/anilist/query/SiteStatistics'
import { type SiteStatisticsResponse } from './apis/anilist/interfaces/responses/query/SiteStatistics'
import { StaffQuery, type StaffVariables } from './apis/anilist/query/Staff'
import { type StaffResponse } from './apis/anilist/interfaces/responses/query/Staff'
import { StaffsQuery, type StaffsVariables } from './apis/anilist/query/page/Staffs'
import { StudioQuery, type StudioVariables } from './apis/anilist/query/Studio'
import { type StudioResponse } from './apis/anilist/interfaces/responses/query/Studio'
import { StudiosQuery, type StudiosVariables } from './apis/anilist/query/page/Studios'
import { ThreadCommentQuery, type ThreadCommentVariables } from './apis/anilist/query/ThreadComment'
import { type ThreadCommentResponse } from './apis/anilist/interfaces/responses/query/ThreadComment'
import { ThreadCommentsQuery, type ThreadCommentsVariables } from './apis/anilist/query/page/ThreadCommments'
import { ThreadQuery, type ThreadVariables } from './apis/anilist/query/Thread'
import { type ThreadResponse } from './apis/anilist/interfaces/responses/query/Thread'
import { ThreadsQuery, type ThreadsVariables } from './apis/anilist/query/page/Threads'
import {
  UpdateMediaListEntriesMutation,
  type UpdateMediaListEntriesVariables
} from './apis/anilist/mutation/UpdateMediaListEntries'
import { UpdateUserMutation, type UpdateUserResponse, type UpdateUserVariables } from './apis/anilist/mutation/UpdateUser'
import { UserQuery, type UserVariables } from './apis/anilist/query/User'
import { type UserResponse } from './apis/anilist/interfaces/responses/query/User'
import { UsersQuery, type UsersVariables } from './apis/anilist/query/page/Users'
import { ViewerQuery } from './apis/anilist/query/Viewer'
import { DeleteMediaListEntryMutation, type DeleteMediaListEntryVariables } from './apis/anilist/mutation/DeleteMediaListEntry'
import { DeleteCustomListMutation, type DeleteCustomListVariables } from './apis/anilist/mutation/DeleteCustomList'
import { SaveTextActivityMutation, type SaveTextActivityVariables } from './apis/anilist/mutation/SaveTextActivity'
import { SaveMessageActivityMutation, type SaveMessageActivityVariables } from './apis/anilist/mutation/SaveMessageActivity'
import { SaveListActivityMutation, type SaveListActivityVariables } from './apis/anilist/mutation/SaveListActivity'
import { DeleteActivityMutation, type DeleteActivityVariables } from './apis/anilist/mutation/DeleteActivity'
import { ToggleActivitySubscriptionMutation, type ToggleActivitySubscriptionVariables } from './apis/anilist/mutation/ToggleActivitySubscription'
import { ToggleActivityPinMutation, type ToggleActivityPinVariables } from './apis/anilist/mutation/ToggleActivityPin'
import { SaveActivityReplyMutation, type SaveActivityReplyVariables } from './apis/anilist/mutation/SaveActivityReply'
import { DeleteActivityReplyMutation, type DeleteActivityReplyVariables } from './apis/anilist/mutation/DeleteActivityReply'
import { ToggleLikeMutation, type ToggleLikeVariables } from './apis/anilist/mutation/ToggleLike'
import { ToggleLikeV2Mutation } from './apis/anilist/mutation/ToggleLikeV2'
import { type BasicUser } from './apis/anilist/interfaces/Basic'

/**
 * `AniLink` is a class for interacting with the APIs.
 * It provides methods for querying and mutating data.
 */
export class AniLink {
  /**
   * Anilist API methods.
   * @public
   */
  public anilist: {
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
     * @property {Function} page - Fetches pages of data from the Anilist API.
     */
    query: {
      /**
       * Fetches user data from the Anilist API.
       * @param {UserVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the user's data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.user({id: 542244, isHTML: true});
       * ```
       */
      user: (variables: UserVariables) => Promise<UserResponse>

      /**
       * Fetches media data from the Anilist API.
       * @param {MediaVariables} variables - The variables for the query.
       * @returns {Promise<MediaResponse>} A promise that resolves to the media data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.media({id: 1, type: 'ANIME'});
       * ```
       */
      media: (variables: MediaVariables) => Promise<MediaResponse>

      /**
       * Fetches media trend data from the Anilist API.
       * @param {MediaTrendVariables} variables - The variables for the query.
       * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trend data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.mediaTrend({mediaId: 1, type: 'ANIME'});
       * ```
       */
      mediaTrend: (variables: MediaTrendVariables) => Promise<MediaTrendResponse>

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
       */
      airingSchedule: (variables: AiringScheduleVariables) => Promise<AiringScheduleResponse>

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
       */
      character: (variables: CharacterVariables) => Promise<CharacterResponse>

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
       */
      staff: (variables: StaffVariables) => Promise<StaffResponse>

      /**
       * Fetches media list data from the Anilist API.
       * @param {MediaListVariables} variables - The variables for the query.
       * @returns {Promise<MediaListResponse>} A promise that resolves to the media list data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.mediaList({userId: 542244});
       * ```
       */
      mediaList: (variables: MediaListVariables) => Promise<MediaListResponse>

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
       */
      mediaListCollection: (variables: MediaListCollectionVariables) => Promise<MediaListCollectionResponse>

      /**
       * Fetches genre collection data from the Anilist API.
       * @returns {Promise<String>} A promise that resolves to the genre collection data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.genreCollection()
       * ```
       */
      genreCollection: () => Promise<string>

      /**
       * Fetches media tag collection data from the Anilist API.
       * @returns {Promise<MediaTagCollectionResponse>} A promise that resolves to the media tag collection data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.mediaTagCollection()
       * ```
       */
      mediaTagCollection: () => Promise<MediaTagCollectionResponse>

      /**
       * Fetches viewer data from the Anilist API.
       * @returns {Promise<UserResponse>} A promise that resolves to the viewer data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.viewer({isHTML: true});
       * ```
       * Must be authenticated.
       */
      viewer: () => Promise<UserResponse>

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
       */
      notification: (variables: NotificationVariables) => Promise<NotificationResponse>

      /**
       * Fetches studio data from the Anilist API.
       * @param {StudioVariables} variables - The variables for the query.
       * @returns {Promise<StudioResponse>} A promise that resolves to the studio data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.studio({id: 561, asHtml: true});
       * ```
       */
      studio: (variables: StudioVariables) => Promise<StudioResponse>

      /**
       * Fetches review data from the Anilist API.
       * @param {ReviewVariables} variables - The variables for the query.
       * @returns {Promise<ReviewResponse>} A promise that resolves to the review data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.review({id: 8008, asHtml: true});
       * ```
       */
      review: (variables: ReviewVariables) => Promise<ReviewResponse>

      /**
       * Fetches activity data from the Anilist API.
       * @param {ActivityVariables} variables - The variables for the query.
       * @returns {Promise<Activity>} A promise that resolves to the activity data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.activity({id: 723235883, asHtml: true});
       * ```
       */
      activity: (variables: ActivityVariables) => Promise<Activity>

      /**
       * Fetches activity reply data from the Anilist API.
       * @param {ActivityReplyVariables} variables - The variables for the query.
       * @returns {Promise<ActivityReply>} A promise that resolves to the activity reply data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.activityReply({id: 12191046, asHtml: true});
       * ```
       */
      activityReply: (variables: ActivityReplyVariables) => Promise<ActivityReply>

      /**
       * Fetches following data from the Anilist API.
       * @param {FollowingVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the following data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.following({userId: 542244});
       * ```
       */
      following: (variables: FollowingVariables) => Promise<UserResponse>

      /**
       * Fetches follower data from the Anilist API.
       * @param {FollowerVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the follower data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.follower({userId: 542244});
       * ```
       */
      follower: (variables: FollowerVariables) => Promise<UserResponse>

      /**
       * Fetches thread data from the Anilist API.
       * @param {ThreadVariables} variables - The variables for the query.
       * @returns {Promise<ThreadResponse>} A promise that resolves to the thread data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.thread({id: 71881, asHtml: true});
       * ```
       */
      thread: (variables: ThreadVariables) => Promise<ThreadResponse>

      /**
       * Fetches thread comment data from the Anilist API.
       * @param {ThreadCommentVariables} variables - The variables for the query.
       * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comment data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.threadComment({id: 2555166, asHtml: true});
       * ```
       */
      threadComment: (variables: ThreadCommentVariables) => Promise<ThreadCommentResponse>

      /**
       * Fetches recommendation data from the Anilist API.
       * @param {RecommendationVariables} variables - The variables for the query.
       * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendation data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.recommendation({mediaId: 156822, asHtml: true});
       * ```
       */
      recommendation: (variables: RecommendationVariables) => Promise<RecommendationResponse>

      /**
       * Fetches markdown data from the Anilist API.
       * @param {MarkdownVariables} variables - The variables for the query.
       * @returns {Promise<string>} A promise that resolves to the markdown data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.markdown({markdown: 'Hello, world!'});
       * ```
       */
      markdown: (variables: MarkdownVariables) => Promise<string>

      /**
       * Fetches aniChart user data from the Anilist API.
       * @returns {Promise<AniChartUserResponse>} A promise that resolves to the aniChart user data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.aniChartUser();
       * ```
       * Must be authenticated.
       */
      aniChartUser: () => Promise<AniChartUserResponse>

      /**
       * Fetches site statistics data from the Anilist API.
       * @returns {Promise<SiteStatisticsResponse>} A promise that resolves to the site statistics data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.siteStatistics();
       * ```
       */
      siteStatistics: () => Promise<SiteStatisticsResponse>

      /**
       * Fetches external link source collection data from the Anilist API.
       * @returns {Promise<ExternalLinkSourceCollectionResponse>} A promise that resolves to the external link source collection data.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.query.externalLinkSourceCollection();
       * ```
       */
      externalLinkSourceCollection: () => Promise<ExternalLinkSourceCollectionResponse>

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
         * @returns {Promise<UserResponse>} A promise that resolves to the users data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.users({page: 1, perPage: 10});
         * ```
         */
        users: (variables: UsersVariables) => Promise<UserResponse>

        /**
         * Fetches medias data from the Anilist API.
         * @param {MediasVariables} variables - The variables for the query.
         * @returns {Promise<MediaResponse>} A promise that resolves to the medias data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.medias({page: 1, perPage: 10, type: 'ANIME'});
         * ```
         */
        medias: (variables: MediasVariables) => Promise<MediaResponse>

        /**
         * Fetches characters data from the Anilist API.
         * @param {CharactersVariables} variables - The variables for the query.
         * @returns {Promise<CharacterResponse>} A promise that resolves to the characters data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.characters({page: 1, perPage: 10});
         * ```
         */
        characters: (variables: CharactersVariables) => Promise<CharacterResponse>

        /**
         * Fetches staffs data from the Anilist API.
         * @param {StaffsVariables} variables - The variables for the query.
         * @returns {Promise<StaffResponse>} A promise that resolves to the staffs data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.staffs({page: 1, perPage: 10});
         * ```
         */
        staffs: (variables: StaffsVariables) => Promise<StaffResponse>

        /**
         * Fetches studios data from the Anilist API.
         * @param {StudiosVariables} variables - The variables for the query.
         * @returns {Promise<StudioResponse>} A promise that resolves to the studios data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.studios({page: 1, perPage: 10});
         * ```
         */
        studios: (variables: StudiosVariables) => Promise<StudioResponse>

        /**
         * Fetches media lists data from the Anilist API.
         * @param {MediaListsVariables} variables - The variables for the query.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the media lists data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.mediaLists({page: 1, perPage: 10, userId: 542244});
         * ```
         */
        mediaLists: (variables: MediaListsVariables) => Promise<MediaListResponse>

        /**
         * Fetches airing schedules data from the Anilist API.
         * @param {AiringSchedulesVariables} variables - The variables for the query.
         * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedules data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.airingSchedules({page: 1, perPage: 10});
         * ```
         */
        airingSchedules: (variables: AiringSchedulesVariables) => Promise<AiringScheduleResponse>

        /**
         * Fetches media trends data from the Anilist API.
         * @param {MediaTrendsVariables} variables - The variables for the query.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trends data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.mediaTrends({page: 1, perPage: 10, type: 'ANIME'});
         * ```
         * Must be quering an airing anime. Returns error if not.
         */
        mediaTrends: (variables: MediaTrendsVariables) => Promise<MediaTrendResponse>

        /**
         * Fetches notifications data from the Anilist API.
         * @param {NotificationsVariables} variables - The variables for the query.
         * @returns {Promise<NotificationResponse>} A promise that resolves to the notifications data.\
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.notifications({page: 1, perPage: 10});
         * ```
         */
        notifications: (variables: NotificationsVariables) => Promise<NotificationResponse>

        /**
         * Fetches followers data from the Anilist API.
         * @param {FollowersVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the followers data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.followers({page: 1, perPage: 10, userId: 542244});
         * ```
         */
        followers: (variables: FollowersVariables) => Promise<UserResponse>

        /**
         * Fetches following data from the Anilist API.
         * @param {FollowingsVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the following data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.following({page: 1, perPage: 10, userId: 542244});
         * ```
         */
        following: (variables: FollowingsVariables) => Promise<UserResponse>

        /**
         * Fetches activities data from the Anilist API.
         * @param {ActivitiesVariables} variables - The variables for the query.
         * @returns {Promise<Activity>} A promise that resolves to the activities data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.activities({page: 1, perPage: 10, userId: 542244});
         * ```
         */
        activities: (variables: ActivitiesVariables) => Promise<Activity>

        /**
         * Fetches activity replies data from the Anilist API.
         * @param {ActivityRepliesVariables} variables - The variables for the query.
         * @returns {Promise<ActivityReply>} A promise that resolves to the activity replies data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.activityReplies({page: 1, perPage: 10, activityId: 723235883});
         * ```
         */
        activityReplies: (variables: ActivityRepliesVariables) => Promise<ActivityReply>

        /**
         * Fetches threads data from the Anilist API.
         * @param {ThreadsVariables} variables - The variables for the query.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the threads data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.threads({page: 1, perPage: 10});
         * ```
         */
        threads: (variables: ThreadsVariables) => Promise<ThreadResponse>

        /**
         * Fetches thread comments data from the Anilist API.
         * @param {ThreadCommentsVariables} variables - The variables for the query.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comments data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.threadComments({page: 1, perPage: 10, threadId: 71881});
         * ```
         */
        threadComments: (variables: ThreadCommentsVariables) => Promise<ThreadCommentResponse>

        /**
         * Fetches reviews data from the Anilist API.
         * @param {ReviewsVariables} variables - The variables for the query.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the reviews data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.reviews({page: 1, perPage: 10, mediaId: 1});
         * ```
         */
        reviews: (variables: ReviewsVariables) => Promise<ReviewResponse>

        /**
         * Fetches recommendations data from the Anilist API.
         * @param {RecommendationsVariables} variables - The variables for the query.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendations data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.recommendations({page: 1, perPage: 10, mediaId: 1});
         * ```
         */
        recommendations: (variables: RecommendationsVariables) => Promise<RecommendationResponse>

        /**
         * Fetches likes data from the Anilist API.
         * @param {LikesVariables} variables - The variables for the query.
         * @returns {Promise<BasicUser>} A promise that resolves to the likes data.
         *
         * @example
         * ```typescript
         * await aniLink.anilist.query.page.likes({page: 1, perPage: 10, likeAbleId: 1});
         */
        likes: (variables: LikesVariables) => Promise<BasicUser>
      }
    }
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
       */
      updateUser: (variables: UpdateUserVariables) => Promise<UpdateUserResponse>

      /**
       * Saves a media list entry on the Anilist API.
       * @param {SaveMediaListEntryVariables} variables - The variables for the mutation.
       * @returns {Promise<MediaListResponse>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.saveMediaListEntry({mediaId: 1, status: 'COMPLETED'});
       * ```
       */
      saveMediaListEntry: (variables: SaveMediaListEntryVariables) => Promise<MediaListResponse>

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
       */
      updateMediaListEntries: (variables: UpdateMediaListEntriesVariables) => Promise<MediaListResponse[]>

      /**
       * Deletes a media list entry on the Anilist API.
       * @param {DeleteMediaListEntryVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       *
       * @example
       * You cannot delete a media list entry without first fetching the entry's id. The entry's id is not the same as the mediaId. It is specific to each user and media.
       * ```typescript
       * // Fetch the entry's id first by quering the user's media list by the mediaId.
       * const entryId = (
       *   await handleRateLimit(() => aniLink.anilist.query.mediaList(
       *     {
       *       userId: 6503722,
       *       mediaId: 143271
       *     }
       *   ))).data.MediaList.id;
       * aniLink.anilist.mutation.deleteMediaListEntry({id: entryId});
       * ```
       */
      deleteMediaListEntry: (variables: DeleteMediaListEntryVariables) => Promise<MediaListResponse>

      /**
       * Deletes a custom list on the Anilist API. There is no mutation specifically for creating a custom list. You can create a custom list through the `updateUser` mutation under the `animeListOptions` or `mangaListOptions` variables.
       * @param {DeleteCustomListVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.deleteCustomLists({customList: 'test'});
       * ```
       */
      deleteCustomList: (variables: DeleteCustomListVariables) => Promise<any>

      /**
       * Saves a text activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
       * @param {SaveTextActivityVariables} variables - The variables for the mutation.
       * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.saveTextActivity({text: 'Hello, world!'});
       * ```
       */
      saveTextActivity: (variables: SaveTextActivityVariables) => Promise<Activity>

      /**
       * Saves a message activity on the Anilist API. If no `id` is provided, a new activity will be created. If an `id` is provided, the activity with that `id` will be updated.
       * @param {SaveMessageActivityVariables} variables - The variables for the mutation.
       * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.saveMessageActivity({text: 'Hello, world!'});
       * ```
       */
      saveMessageActivity: (variables: SaveMessageActivityVariables) => Promise<Activity>

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
       */
      saveListActivity: (variables: SaveListActivityVariables) => Promise<Activity>

      /**
       * Deletes an activity on the Anilist API.
       * Mod Only
       * @param {DeleteActivityVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.deleteActivity({id: 1});
       * ```
       */
      deleteActivity: (variables: DeleteActivityVariables) => Promise<any>

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
       */
      toggleActivityPin: (variables: ToggleActivityPinVariables) => Promise<Activity>

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
       */
      toggleActivitySubscription: (variables: ToggleActivitySubscriptionVariables) => Promise<Activity>

      /**
       * Saves an activity reply on the Anilist API. If no `id` is provided, a new activity reply will be created. If an `id` is provided, the activity reply with that `id` will be updated.
       * @param {SaveActivityReplyVariables} variables - The variables for the mutation.
       * @returns {Promise<ActivityReply>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.saveActivityReply({activityId: 1, text: 'Hello, world!'});
       * ```
       */
      saveActivityReply: (variables: SaveActivityReplyVariables) => Promise<ActivityReply>

      /**
       * Deletes an activity reply on the Anilist API.
       * @param {DeleteActivityReplyVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.deleteActivityReply({id: 1});
       * ```
       */
      deleteActivityReply: (variables: DeleteActivityReplyVariables) => Promise<any>

      /**
       * Toggles a like on the Anilist API.
       * @param {ToggleLikeVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.toggleLike({id: 1, type: 'ACTIVITY'});
       * ```
       */
      toggleLike: (variables: ToggleLikeVariables) => Promise<any>

      /**
       * Toggles a like on the Anilist API.
       * Returns a different response than the `toggleLike` mutation.
       * @param {ToggleLikeVariables} variables - The variables for the mutation.
       * @returns {Promise<Activity>} A promise that resolves when the mutation is complete.
       *
       * @example
       * ```typescript
       * await aniLink.anilist.mutation.toggleLikeV2({id: 1, type: 'ACTIVITY'});
       * ```
       */
      toggleLikeV2: (variables: ToggleLikeVariables) => Promise<Activity>
    }
  }

  /**
   * Creates a new AniLink instance. The `authToken` parameter is optional and only required for authenticated queries and mutations. If no `authToken` is provided, only public queries will be available. You are able to create multiple AniLink instances with different `authToken`s.
   * @param {string} [authToken] - The authentication token to use for API requests.
   * @public
   * @example
   * ```typescript
   * const aniLink = new AniLink('authToken');
   *
   * const aniLink2 = new AniLink();
   * ```
   */
  constructor (authToken: string) {
    const userQueryInstance = new UserQuery(authToken)
    const mediaQueryInstance = new MediaQuery(authToken)
    const mediaTrendQueryInstance = new MediaTrendQuery(authToken)
    const airingScheduleQueryInstance = new AiringScheduleQuery(authToken)
    const characterQueryInstance = new CharacterQuery(authToken)
    const staffQueryInstance = new StaffQuery(authToken)
    const mediaListQueryInstance = new MediaListQuery(authToken)
    const mediaListCollectionQueryInstance = new MediaListCollectionQuery(authToken)
    const genreCollectionQueryInstance = new GenreCollectionQuery(authToken)
    const mediaTagCollectionQueryInstance = new MediaTagCollectionQuery(authToken)
    const viewerQueryInstance = new ViewerQuery(authToken)
    const notificationQueryInstance = new NotificationQuery(authToken)
    const studioQueryInstance = new StudioQuery(authToken)
    const reviewQueryInstance = new ReviewQuery(authToken)
    const activityQueryInstance = new ActivityQuery(authToken)
    const activityReplyQueryInstance = new ActivityReplyQuery(authToken)
    const followingQueryInstance = new FollowingQuery(authToken)
    const followerQueryInstance = new FollowerQuery(authToken)
    const threadQueryInstance = new ThreadQuery(authToken)
    const threadCommentQueryInstance = new ThreadCommentQuery(authToken)
    const recommendationQueryInstance = new RecommendationQuery(authToken)
    const markdownQueryInstance = new MarkdownQuery(authToken)
    const aniChartUserQueryInstance = new AniChartUserQuery(authToken)
    const siteStatisticsQueryInstance = new SiteStatisticsQuery(authToken)
    const externalLinkSourceCollectionQueryInstance = new ExternalLinkSourceCollectionQuery(authToken)

    const usersQueryInstance = new UsersQuery(authToken)
    const mediasQueryInstance = new MediasQuery(authToken)
    const charactersQueryInstance = new CharactersQuery(authToken)
    const staffsQueryInstance = new StaffsQuery(authToken)
    const studiosQueryInstance = new StudiosQuery(authToken)
    const mediaListsQueryInstance = new MediaListsQuery(authToken)
    const airingSchedulesQueryInstance = new AiringSchedulesQuery(authToken)
    const mediaTrendsQueryInstance = new MediaTrendsQuery(authToken)
    const notificationsQueryInstance = new NotificationsQuery(authToken)
    const followersQueryInstance = new FollowersQuery(authToken)
    const followingsQueryInstance = new FollowingsQuery(authToken)
    const activitiesQueryInstance = new ActivitiesQuery(authToken)
    const activityRepliesQueryInstance = new ActivityRepliesQuery(authToken)
    const threadsQueryInstance = new ThreadsQuery(authToken)
    const threadCommentsQueryInstance = new ThreadCommentsQuery(authToken)
    const reviewsQueryInstance = new ReviewsQuery(authToken)
    const recommendationsQueryInstance = new RecommendationsQuery(authToken)
    const likesQueryInstance = new LikesQuery(authToken)

    const updateUserMutationInstance = new UpdateUserMutation(authToken)
    const saveMediaListEntryMutationInstance = new SaveMediaListEntryMutation(authToken)
    const updateMediaListEntriesMutationInstance = new UpdateMediaListEntriesMutation(authToken)
    const deleteMediaListEntryMutationInstance = new DeleteMediaListEntryMutation(authToken)
    const deleteCustomListMutationInstance = new DeleteCustomListMutation(authToken)
    const saveTextActivityMutationInstance = new SaveTextActivityMutation(authToken)
    const saveMessageActivityMutationInstance = new SaveMessageActivityMutation(authToken)
    const saveListActivityMutationInstance = new SaveListActivityMutation(authToken)
    const deleteActivityMutationInstance = new DeleteActivityMutation(authToken)
    const toggleActivityPinMutationInstance = new ToggleActivityPinMutation(authToken)
    const toggleActivitySubscriptionMutationInstance = new ToggleActivitySubscriptionMutation(authToken)
    const saveActivityReplyMutationInstance = new SaveActivityReplyMutation(authToken)
    const deleteActivityReplyMutationInstance = new DeleteActivityReplyMutation(authToken)
    const toggleLikeMutationInstance = new ToggleLikeMutation(authToken)
    const toggleLikeV2MutationInstance = new ToggleLikeV2Mutation(authToken)

    this.anilist = {
      query: {
        user: userQueryInstance.user.bind(userQueryInstance),
        media: mediaQueryInstance.media.bind(mediaQueryInstance),
        mediaTrend: mediaTrendQueryInstance.mediaTrend.bind(mediaTrendQueryInstance),
        airingSchedule: airingScheduleQueryInstance.airingSchedule.bind(airingScheduleQueryInstance),
        character: characterQueryInstance.character.bind(characterQueryInstance),
        staff: staffQueryInstance.staff.bind(staffQueryInstance),
        mediaList: mediaListQueryInstance.mediaList.bind(mediaListQueryInstance),
        mediaListCollection: mediaListCollectionQueryInstance.mediaListCollection.bind(mediaListQueryInstance),
        genreCollection: genreCollectionQueryInstance.genreCollection.bind(genreCollectionQueryInstance),
        mediaTagCollection: mediaTagCollectionQueryInstance.mediaTagCollection.bind(mediaTagCollectionQueryInstance),
        viewer: viewerQueryInstance.viewer.bind(viewerQueryInstance),
        notification: notificationQueryInstance.notification.bind(notificationQueryInstance),
        studio: studioQueryInstance.studio.bind(studioQueryInstance),
        review: reviewQueryInstance.review.bind(reviewQueryInstance),
        activity: activityQueryInstance.activity.bind(activityQueryInstance),
        activityReply: activityReplyQueryInstance.activityReply.bind(activityReplyQueryInstance),
        following: followingQueryInstance.following.bind(followingQueryInstance),
        follower: followerQueryInstance.follower.bind(followerQueryInstance),
        thread: threadQueryInstance.thread.bind(threadQueryInstance),
        threadComment: threadCommentQueryInstance.threadComment.bind(threadCommentQueryInstance),
        recommendation: recommendationQueryInstance.recommendation.bind(recommendationQueryInstance),
        markdown: markdownQueryInstance.markdown.bind(markdownQueryInstance),
        aniChartUser: aniChartUserQueryInstance.aniChartUser.bind(aniChartUserQueryInstance),
        siteStatistics: siteStatisticsQueryInstance.siteStatistics.bind(siteStatisticsQueryInstance),
        externalLinkSourceCollection: externalLinkSourceCollectionQueryInstance.externalLinkSourceCollection.bind(externalLinkSourceCollectionQueryInstance),

        page: {
          users: usersQueryInstance.users.bind(usersQueryInstance),
          medias: mediasQueryInstance.medias.bind(mediasQueryInstance),
          characters: charactersQueryInstance.characters.bind(charactersQueryInstance),
          staffs: staffsQueryInstance.staffs.bind(staffsQueryInstance),
          studios: studiosQueryInstance.studios.bind(studiosQueryInstance),
          mediaLists: mediaListsQueryInstance.mediaLists.bind(mediaListsQueryInstance),
          airingSchedules: airingSchedulesQueryInstance.airingSchedules.bind(airingSchedulesQueryInstance),
          mediaTrends: mediaTrendsQueryInstance.mediaTrends.bind(mediaTrendsQueryInstance),
          notifications: notificationsQueryInstance.notifications.bind(notificationsQueryInstance),
          followers: followersQueryInstance.followers.bind(followersQueryInstance),
          following: followingsQueryInstance.followings.bind(followingsQueryInstance),
          activities: activitiesQueryInstance.activities.bind(activitiesQueryInstance),
          activityReplies: activityRepliesQueryInstance.activityReplies.bind(activityRepliesQueryInstance),
          threads: threadsQueryInstance.threads.bind(threadsQueryInstance),
          threadComments: threadCommentsQueryInstance.threadComments.bind(threadCommentsQueryInstance),
          reviews: reviewsQueryInstance.reviews.bind(reviewsQueryInstance),
          recommendations: recommendationsQueryInstance.recommendations.bind(recommendationsQueryInstance),
          likes: likesQueryInstance.likes.bind(likesQueryInstance)
        }
      },
      mutation: {
        updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance),
        saveMediaListEntry: saveMediaListEntryMutationInstance.saveMediaListEntry.bind(saveMediaListEntryMutationInstance),
        updateMediaListEntries: updateMediaListEntriesMutationInstance.updateMediaListEntries.bind(updateMediaListEntriesMutationInstance),
        deleteMediaListEntry: deleteMediaListEntryMutationInstance.deleteMediaListEntry.bind(deleteMediaListEntryMutationInstance),
        deleteCustomList: deleteCustomListMutationInstance.deleteCustomList.bind(deleteCustomListMutationInstance),
        saveTextActivity: saveTextActivityMutationInstance.saveTextActivity.bind(saveTextActivityMutationInstance),
        saveMessageActivity: saveMessageActivityMutationInstance.saveMessageActivity.bind(saveMessageActivityMutationInstance),
        saveListActivity: saveListActivityMutationInstance.saveListActivity.bind(saveListActivityMutationInstance),
        deleteActivity: deleteActivityMutationInstance.deleteActivity.bind(deleteActivityMutationInstance),
        toggleActivityPin: toggleActivityPinMutationInstance.toggleActivityPin.bind(toggleActivityPinMutationInstance),
        toggleActivitySubscription: toggleActivitySubscriptionMutationInstance.toggleActivitySubscription.bind(toggleActivitySubscriptionMutationInstance),
        saveActivityReply: saveActivityReplyMutationInstance.saveActivityReply.bind(saveActivityReplyMutationInstance),
        deleteActivityReply: deleteActivityReplyMutationInstance.deleteActivityReply.bind(deleteActivityReplyMutationInstance),
        toggleLike: toggleLikeMutationInstance.toggleLike.bind(toggleLikeMutationInstance),
        toggleLikeV2: toggleLikeV2MutationInstance.toggleLikeV2.bind(toggleLikeV2MutationInstance)
      }
    }
  }
}

module.exports = AniLink
