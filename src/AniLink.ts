import { type Activity } from './apis/anilist/interfaces/Activity'
import { ActivityQuery, type ActivityVariables } from './apis/anilist/query/Activity'
import { type ActivityReply } from './apis/anilist/interfaces/ActivityReply'
import { ActivityReplyQuery, type ActivityReplyVariables } from './apis/anilist/query/ActivityReply'
import { ActivityRepliesQuery, type ActivityRepliesVariables } from './apis/anilist/query/page/ActivityReplies'
import { ActivitiesQuery, type ActivitiesVariables } from './apis/anilist/query/page/Activities'
import { AiringScheduleQuery, type AiringScheduleVariables } from './apis/anilist/query/AiringSchedule'
import { type AiringScheduleResponse } from './apis/anilist/interfaces/responses/query/AiringSchedule'
import { AiringSchedulesQuery, type AiringSchedulesVariables } from './apis/anilist/query/page/AiringSchedules'
import { AniChartUserQuery } from './apis/anilist/query/AniChartUser'
import { type AniChartUserResponse } from './apis/anilist/interfaces/responses/query/AniChartUser'
import { type BasicUser } from './apis/anilist/interfaces/BasicUser'
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
import { UpdateUserMutation, type UpdateUserVariables } from './apis/anilist/mutation/UpdateUser'
import { UserQuery, type UserVariables } from './apis/anilist/query/User'
import { type UserResponse } from './apis/anilist/interfaces/responses/query/User'
import { UsersQuery, type UsersVariables } from './apis/anilist/query/page/Users'
import { ViewerQuery } from './apis/anilist/query/Viewer'
import {DeleteMediaListEntryMutation, DeleteMediaListEntryVariables } from './apis/anilist/mutation/DeleteMediaListEntry'
import {DeleteCustomListMutation, DeleteCustomListVariables } from './apis/anilist/mutation/DeleteCustomList'

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
     */
    query: {
      /**
       * Fetches user data from the Anilist API.
       * @param {UserVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the user's data.
       */
      user: (variables: UserVariables) => Promise<UserResponse>

      /**
       * Fetches media data from the Anilist API.
       * @param {MediaVariables} variables - The variables for the query.
       * @returns {Promise<MediaResponse>} A promise that resolves to the media data.
       */
      media: (variables: MediaVariables) => Promise<MediaResponse>

      /**
       * Fetches media trend data from the Anilist API.
       * @param {MediaTrendVariables} variables - The variables for the query.
       * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trend data.
       */
      mediaTrend: (variables: MediaTrendVariables) => Promise<MediaTrendResponse>

      /**
       * Fetches airing schedule data from the Anilist API.
       * @param {AiringScheduleVariables} variables - The variables for the query.
       * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedule data.
       */
      airingSchedule: (variables: AiringScheduleVariables) => Promise<AiringScheduleResponse>

      /**
       * Fetches character data from the Anilist API.
       * @param {CharacterVariables} variables - The variables for the query.
       * @returns {Promise<CharacterResponse>} A promise that resolves to the character data.
       */
      character: (variables: CharacterVariables) => Promise<CharacterResponse>

      /**
       * Fetches staff data from the Anilist API.
       * @param {StaffVariables} variables - The variables for the query.
       * @returns {Promise<StaffResponse>} A promise that resolves to the staff data.
       */
      staff: (variables: StaffVariables) => Promise<StaffResponse>

      /**
       * Fetches media list data from the Anilist API.
       * @param {MediaListVariables} variables - The variables for the query.
       * @returns {Promise<MediaListResponse>} A promise that resolves to the media list data.
       */
      mediaList: (variables: MediaListVariables) => Promise<MediaListResponse>

      /**
       * Fetches media list collection data from the Anilist API.
       * @param {MediaListCollectionVariables} variables - The variables for the query.
       * @returns {Promise<MediaListCollectionResponse>} A promise that resolves to the media list collection data.
       */
      mediaListCollection: (variables: MediaListCollectionVariables) => Promise<MediaListCollectionResponse>

      /**
       * Fetches genre collection data from the Anilist API.
       * @returns {Promise<String>} A promise that resolves to the genre collection data.
       */
      genreCollection: () => Promise<string>

      /**
       * Fetches media tag collection data from the Anilist API.
       * @returns {Promise<MediaTagCollectionResponse>} A promise that resolves to the media tag collection data.
       */
      mediaTagCollection: () => Promise<MediaTagCollectionResponse>

      /**
       * Fetches viewer data from the Anilist API.
       * @returns {Promise<UserResponse>} A promise that resolves to the viewer data.
       */
      viewer: () => Promise<UserResponse>

      /**
       * Fetches notification data from the Anilist API.
       * @param {NotificationVariables} variables - The variables for the query.
       * @returns {Promise<NotificationResponse>} A promise that resolves to the notification data.
       */
      notification: (variables: NotificationVariables) => Promise<NotificationResponse>

      /**
       * Fetches studio data from the Anilist API.
       * @param {StudioVariables} variables - The variables for the query.
       * @returns {Promise<StudioResponse>} A promise that resolves to the studio data.
       */
      studio: (variables: StudioVariables) => Promise<StudioResponse>

      /**
       * Fetches review data from the Anilist API.
       * @param {ReviewVariables} variables - The variables for the query.
       * @returns {Promise<ReviewResponse>} A promise that resolves to the review data.
       */
      review: (variables: ReviewVariables) => Promise<ReviewResponse>

      /**
       * Fetches activity data from the Anilist API.
       * @param {ActivityVariables} variables - The variables for the query.
       * @returns {Promise<Activity>} A promise that resolves to the activity data.
       */
      activity: (variables: ActivityVariables) => Promise<Activity>

      /**
       * Fetches activity reply data from the Anilist API.
       * @param {ActivityReplyVariables} variables - The variables for the query.
       * @returns {Promise<ActivityReply>} A promise that resolves to the activity reply data.
       */
      activityReply: (variables: ActivityReplyVariables) => Promise<ActivityReply>

      /**
       * Fetches following data from the Anilist API.
       * @param {FollowingVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the following data.
       */
      following: (variables: FollowingVariables) => Promise<UserResponse>

      /**
       * Fetches follower data from the Anilist API.
       * @param {FollowerVariables} variables - The variables for the query.
       * @returns {Promise<UserResponse>} A promise that resolves to the follower data.
       */
      follower: (variables: FollowerVariables) => Promise<UserResponse>

      /**
       * Fetches thread data from the Anilist API.
       * @param {ThreadVariables} variables - The variables for the query.
       * @returns {Promise<ThreadResponse>} A promise that resolves to the thread data.
       */
      thread: (variables: ThreadVariables) => Promise<ThreadResponse>

      /**
       * Fetches thread comment data from the Anilist API.
       * @param {ThreadCommentVariables} variables - The variables for the query.
       * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comment data.
       */
      threadComment: (variables: ThreadCommentVariables) => Promise<ThreadCommentResponse>

      /**
       * Fetches recommendation data from the Anilist API.
       * @param {RecommendationVariables} variables - The variables for the query.
       * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendation data.
       */
      recommendation: (variables: RecommendationVariables) => Promise<RecommendationResponse>

      /**
       * Fetches markdown data from the Anilist API.
       * @param {MarkdownVariables} variables - The variables for the query.
       * @returns {Promise<string>} A promise that resolves to the markdown data.
       */
      markdown: (variables: MarkdownVariables) => Promise<string>

      /**
       * Fetches aniChart user data from the Anilist API.
       * @returns {Promise<AniChartUserResponse>} A promise that resolves to the aniChart user data.
       */
      aniChartUser: () => Promise<AniChartUserResponse>

      /**
       * Fetches site statistics data from the Anilist API.
       * @returns {Promise<SiteStatisticsResponse>} A promise that resolves to the site statistics data.
       */
      siteStatistics: () => Promise<SiteStatisticsResponse>

      /**
       * Fetches external link source collection data from the Anilist API.
       * @returns {Promise<ExternalLinkSourceCollectionResponse>} A promise that resolves to the external link source collection data.
       */
      externalLinkSourceCollection: () => Promise<ExternalLinkSourceCollectionResponse>

      page: {
        /**
         * Fetches users data from the Anilist API.
         * @param {UsersVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the users data.
         */
        users: (variables: UsersVariables) => Promise<UserResponse>

        /**
         * Fetches medias data from the Anilist API.
         * @param {MediasVariables} variables - The variables for the query.
         * @returns {Promise<MediaResponse>} A promise that resolves to the medias data.
         */
        medias: (variables: MediasVariables) => Promise<MediaResponse>

        /**
         * Fetches characters data from the Anilist API.
         * @param {CharactersVariables} variables - The variables for the query.
         * @returns {Promise<CharacterResponse>} A promise that resolves to the characters data.
         */
        characters: (variables: CharactersVariables) => Promise<CharacterResponse>

        /**
         * Fetches staffs data from the Anilist API.
         * @param {StaffsVariables} variables - The variables for the query.
         * @returns {Promise<StaffResponse>} A promise that resolves to the staffs data.
         */
        staffs: (variables: StaffsVariables) => Promise<StaffResponse>

        /**
         * Fetches studios data from the Anilist API.
         * @param {StudiosVariables} variables - The variables for the query.
         * @returns {Promise<StudioResponse>} A promise that resolves to the studios data.
         */
        studios: (variables: StudiosVariables) => Promise<StudioResponse>

        /**
         * Fetches media lists data from the Anilist API.
         * @param {MediaListsVariables} variables - The variables for the query.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the media lists data.
         */
        mediaLists: (variables: MediaListsVariables) => Promise<MediaListResponse>

        /**
         * Fetches airing schedules data from the Anilist API.
         * @param {AiringSchedulesVariables} variables - The variables for the query.
         * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedules data.
         */
        airingSchedules: (variables: AiringSchedulesVariables) => Promise<AiringScheduleResponse>

        /**
         * Fetches media trends data from the Anilist API.
         * @param {MediaTrendsVariables} variables - The variables for the query.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trends data.
         */
        mediaTrends: (variables: MediaTrendsVariables) => Promise<MediaTrendResponse>

        /**
         * Fetches notifications data from the Anilist API.
         * @param {NotificationsVariables} variables - The variables for the query.
         * @returns {Promise<NotificationResponse>} A promise that resolves to the notifications data.
         */
        notifications: (variables: NotificationsVariables) => Promise<NotificationResponse>

        /**
         * Fetches followers data from the Anilist API.
         * @param {FollowersVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the followers data.
         */
        followers: (variables: FollowersVariables) => Promise<UserResponse>

        /**
         * Fetches following data from the Anilist API.
         * @param {FollowingsVariables} variables - The variables for the query.
         * @returns {Promise<UserResponse>} A promise that resolves to the following data.
         */
        following: (variables: FollowingsVariables) => Promise<UserResponse>

        /**
         * Fetches activities data from the Anilist API.
         * @param {ActivitiesVariables} variables - The variables for the query.
         * @returns {Promise<Activity>} A promise that resolves to the activities data.
         */
        activities: (variables: ActivitiesVariables) => Promise<Activity>

        /**
         * Fetches activity replies data from the Anilist API.
         * @param {ActivityRepliesVariables} variables - The variables for the query.
         * @returns {Promise<ActivityReply>} A promise that resolves to the activity replies data.
         */
        activityReplies: (variables: ActivityRepliesVariables) => Promise<ActivityReply>

        /**
         * Fetches threads data from the Anilist API.
         * @param {ThreadsVariables} variables - The variables for the query.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the threads data.
         */
        threads: (variables: ThreadsVariables) => Promise<ThreadResponse>

        /**
         * Fetches thread comments data from the Anilist API.
         * @param {ThreadCommentsVariables} variables - The variables for the query.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comments data.
         */
        threadComments: (variables: ThreadCommentsVariables) => Promise<ThreadCommentResponse>

        /**
         * Fetches reviews data from the Anilist API.
         * @param {ReviewsVariables} variables - The variables for the query.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the reviews data.
         */
        reviews: (variables: ReviewsVariables) => Promise<ReviewResponse>

        /**
         * Fetches recommendations data from the Anilist API.
         * @param {RecommendationsVariables} variables - The variables for the query.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendations data.
         */
        recommendations: (variables: RecommendationsVariables) => Promise<RecommendationResponse>

        /**
         * Fetches likes data from the Anilist API.
         * @param {LikesVariables} variables - The variables for the query.
         * @returns {Promise<BasicUser>} A promise that resolves to the likes data.
         */
        likes: (variables: LikesVariables) => Promise<BasicUser>
      }
    }
    /**
     * Mutation methods for updating data on the Anilist API.
     */
    mutation: {
      /**
       * Updates a user on the Anilist API.
       * @param {UpdateUserVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       */
      updateUser: (variables: UpdateUserVariables) => Promise<any>

      /**
       * Saves a media list entry on the Anilist API.
       * @param {SaveMediaListEntryVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       */
      saveMediaListEntry: (variables: SaveMediaListEntryVariables) => Promise<any>

      /**
       * Updates media list entries on the Anilist API.
       * @param {UpdateMediaListEntriesVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       */
      updateMediaListEntries: (variables: UpdateMediaListEntriesVariables) => Promise<any>

      /**
       * Deletes a media list entry on the Anilist API.
       * @param {DeleteMediaListEntryVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       */
      deleteMediaListEntry: (variables: DeleteMediaListEntryVariables) => Promise<any>

      /**
       * Deletes a custom list on the Anilist API.
       * @param {DeleteCustomListVariables} variables - The variables for the mutation.
       * @returns {Promise<any>} A promise that resolves when the mutation is complete.
       */
      deleteCustomList: (variables: DeleteCustomListVariables) => Promise<any>
    }
  }

  /**
   * Creates a new AniLink instance.
   * @param {string} authToken - The authentication token to use for API requests.
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
        deleteCustomList: deleteCustomListMutationInstance.deleteCustomList.bind(deleteCustomListMutationInstance)
      }
    }
  }
}

module.exports = AniLink
