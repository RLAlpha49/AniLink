import { type Activity } from './apis/anilist/interfaces/Activity'
import { ActivityQuery, type ActivityVariables } from './apis/anilist/query/Activity'
import { type ActivityReply } from './apis/anilist/interfaces/ActivityReply'
import {ActivityReplyQuery, ActivityReplyVariables} from './apis/anilist/query/ActivityReply'
import { ActivityRepliesQuery } from './apis/anilist/query/page/ActivityReplies'
import { ActivitiesQuery } from './apis/anilist/query/page/Activities'
import {AiringScheduleQuery, AiringScheduleVariables} from './apis/anilist/query/AiringSchedule'
import { type AiringScheduleResponse } from './apis/anilist/interfaces/responses/query/AiringSchedule'
import { AiringSchedulesQuery } from './apis/anilist/query/page/AiringSchedules'
import { AniChartUserQuery } from './apis/anilist/query/AniChartUser'
import { type AniChartUserResponse } from './apis/anilist/interfaces/responses/query/AniChartUser'
import { type BasicUser } from './apis/anilist/interfaces/BasicUser'
import { CharacterQuery } from './apis/anilist/query/Character'
import { type CharacterResponse } from './apis/anilist/interfaces/responses/query/Character'
import { CharactersQuery } from './apis/anilist/query/page/Characters'
import { ExternalLinkSourceCollectionQuery } from './apis/anilist/query/ExternalLinkSourceCollection'
import {
  type ExternalLinkSourceCollectionResponse
} from './apis/anilist/interfaces/responses/query/ExternalLinkSourceCollection'
import { FollowerQuery } from './apis/anilist/query/Follower'
import { FollowersQuery } from './apis/anilist/query/page/Followers'
import { FollowingQuery } from './apis/anilist/query/Following'
import { FollowingsQuery } from './apis/anilist/query/page/Followings'
import { GenreCollectionQuery } from './apis/anilist/query/GenreCollection'
import { LikesQuery } from './apis/anilist/query/page/Likes'
import { MarkdownQuery } from './apis/anilist/query/Markdown'
import { MediaListCollectionQuery } from './apis/anilist/query/MediaListCollection'
import { type MediaListCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaListCollectionResponse'
import { MediaListQuery } from './apis/anilist/query/MediaList'
import { type MediaListResponse } from './apis/anilist/interfaces/responses/query/MediaList'
import { MediaListsQuery } from './apis/anilist/query/page/MediaLists'
import { MediaQuery } from './apis/anilist/query/Media'
import { type MediaResponse } from './apis/anilist/interfaces/responses/query/Media'
import { MediaTagCollectionQuery } from './apis/anilist/query/MediaTagCollection'
import { type MediaTagCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaTagCollection'
import { MediaTrendQuery } from './apis/anilist/query/MediaTrend'
import { type MediaTrendResponse } from './apis/anilist/interfaces/responses/query/MediaTrend'
import { MediaTrendsQuery } from './apis/anilist/query/page/MediaTrends'
import { MediasQuery } from './apis/anilist/query/page/Medias'
import { NotificationQuery } from './apis/anilist/query/Notification'
import { type NotificationResponse } from './apis/anilist/interfaces/responses/query/Notification'
import { NotificationsQuery } from './apis/anilist/query/page/Notifications'
import { RecommendationQuery } from './apis/anilist/query/Recommendation'
import { type RecommendationResponse } from './apis/anilist/interfaces/responses/query/Recommendation'
import { RecommendationsQuery } from './apis/anilist/query/page/Recommendations'
import { ReviewQuery } from './apis/anilist/query/Review'
import { type ReviewResponse } from './apis/anilist/interfaces/responses/query/Review'
import { ReviewsQuery } from './apis/anilist/query/page/Reviews'
import { SaveMediaListEntryMutation, type SaveMediaListEntryVariables } from './apis/anilist/mutation/SaveMediaListEntry'
import { SiteStatisticsQuery } from './apis/anilist/query/SiteStatistics'
import { type SiteStatisticsResponse } from './apis/anilist/interfaces/responses/query/SiteStatistics'
import { StaffQuery } from './apis/anilist/query/Staff'
import { type StaffResponse } from './apis/anilist/interfaces/responses/query/Staff'
import { StaffsQuery } from './apis/anilist/query/page/Staffs'
import { StudioQuery } from './apis/anilist/query/Studio'
import { type StudioResponse } from './apis/anilist/interfaces/responses/query/Studio'
import { StudiosQuery } from './apis/anilist/query/page/Studios'
import { ThreadCommentQuery } from './apis/anilist/query/ThreadComment'
import { type ThreadCommentResponse } from './apis/anilist/interfaces/responses/query/ThreadComment'
import { ThreadCommentsQuery } from './apis/anilist/query/page/ThreadCommments'
import { ThreadQuery } from './apis/anilist/query/Thread'
import { type ThreadResponse } from './apis/anilist/interfaces/responses/query/Thread'
import { ThreadsQuery } from './apis/anilist/query/page/Threads'
import {
  UpdateMediaListEntriesMutation,
  type UpdateMediaListEntriesVariables
} from './apis/anilist/mutation/UpdateMediaListEntries'
import { UpdateUserMutation, type UpdateUserVariables } from './apis/anilist/mutation/UpdateUser'
import { UserQuery } from './apis/anilist/query/User'
import { type UserResponse } from './apis/anilist/interfaces/responses/query/User'
import { UsersQuery } from './apis/anilist/query/page/Users'
import { ViewerQuery } from './apis/anilist/query/Viewer'

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
       * @returns {Promise<UserResponse>} A promise that resolves to the user's data.
       */
      user: () => Promise<UserResponse>

      /**
       * Fetches media data from the Anilist API.
       * @returns {Promise<MediaResponse>} A promise that resolves to the media data.
       */
      media: () => Promise<MediaResponse>

      /**
       * Fetches media trend data from the Anilist API.
       * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trend data.
       */
      mediaTrend: () => Promise<MediaTrendResponse>

      /**
       * Fetches airing schedule data from the Anilist API.
       * @param {AiringScheduleVariables} variables - The variables for the query.
       * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedule data.
       */
      airingSchedule: (variables: AiringScheduleVariables) => Promise<AiringScheduleResponse>

      /**
       * Fetches character data from the Anilist API.
       * @returns {Promise<CharacterResponse>} A promise that resolves to the character data.
       */
      character: () => Promise<CharacterResponse>

      /**
       * Fetches staff data from the Anilist API.
       * @returns {Promise<StaffResponse>} A promise that resolves to the staff data.
       */
      staff: () => Promise<StaffResponse>

      /**
       * Fetches media list data from the Anilist API.
       * @returns {Promise<MediaListResponse>} A promise that resolves to the media list data.
       */
      mediaList: () => Promise<MediaListResponse>

      /**
       * Fetches media list collection data from the Anilist API.
       * @returns {Promise<MediaListCollectionResponse>} A promise that resolves to the media list collection data.
       */
      mediaListCollection: () => Promise<MediaListCollectionResponse>

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
       * @returns {Promise<NotificationResponse>} A promise that resolves to the notification data.
       */
      notification: () => Promise<NotificationResponse>

      /**
       * Fetches studio data from the Anilist API.
       * @returns {Promise<StudioResponse>} A promise that resolves to the studio data.
       */
      studio: () => Promise<StudioResponse>

      /**
       * Fetches review data from the Anilist API.
       * @returns {Promise<ReviewResponse>} A promise that resolves to the review data.
       */
      review: () => Promise<ReviewResponse>

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
       * @returns {Promise<UserResponse>} A promise that resolves to the following data.
       */
      following: () => Promise<UserResponse>

      /**
       * Fetches follower data from the Anilist API.
       * @returns {Promise<UserResponse>} A promise that resolves to the follower data.
       */
      follower: () => Promise<UserResponse>

      /**
       * Fetches thread data from the Anilist API.
       * @returns {Promise<ThreadResponse>} A promise that resolves to the thread data.
       */
      thread: () => Promise<ThreadResponse>

      /**
       * Fetches thread comment data from the Anilist API.
       * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comment data.
       */
      threadComment: () => Promise<ThreadCommentResponse>

      /**
       * Fetches recommendation data from the Anilist API.
       * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendation data.
       */
      recommendation: () => Promise<RecommendationResponse>

      /**
       * Fetches markdown data from the Anilist API.
       * @returns {Promise<string>} A promise that resolves to the markdown data.
       */
      markdown: () => Promise<string>

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
         * @returns {Promise<UserResponse>} A promise that resolves to the users data.
         */
        users: () => Promise<UserResponse>

        /**
         * Fetches medias data from the Anilist API.
         * @returns {Promise<MediaResponse>} A promise that resolves to the medias data.
         */
        medias: () => Promise<MediaResponse>

        /**
         * Fetches characters data from the Anilist API.
         * @returns {Promise<CharacterResponse>} A promise that resolves to the characters data.
         */
        characters: () => Promise<CharacterResponse>

        /**
         * Fetches staffs data from the Anilist API.
         * @returns {Promise<StaffResponse>} A promise that resolves to the staffs data.
         */
        staffs: () => Promise<StaffResponse>

        /**
         * Fetches studios data from the Anilist API.
         * @returns {Promise<StudioResponse>} A promise that resolves to the studios data.
         */
        studios: () => Promise<StudioResponse>

        /**
         * Fetches media lists data from the Anilist API.
         * @returns {Promise<MediaListResponse>} A promise that resolves to the media lists data.
         */
        mediaLists: () => Promise<MediaListResponse>

        /**
         * Fetches airing schedules data from the Anilist API.
         * @returns {Promise<AiringScheduleResponse>} A promise that resolves to the airing schedules data.
         */
        airingSchedules: () => Promise<AiringScheduleResponse>

        /**
         * Fetches media trends data from the Anilist API.
         * @returns {Promise<MediaTrendResponse>} A promise that resolves to the media trends data.
         */
        mediaTrends: () => Promise<MediaTrendResponse>

        /**
         * Fetches notifications data from the Anilist API.
         * @returns {Promise<NotificationResponse>} A promise that resolves to the notifications data.
         */
        notifications: () => Promise<NotificationResponse>

        /**
         * Fetches followers data from the Anilist API.
         * @returns {Promise<UserResponse>} A promise that resolves to the followers data.
         */
        followers: () => Promise<UserResponse>

        /**
         * Fetches following data from the Anilist API.
         * @returns {Promise<UserResponse>} A promise that resolves to the following data.
         */
        following: () => Promise<UserResponse>

        /**
         * Fetches activities data from the Anilist API.
         * @returns {Promise<Activity>} A promise that resolves to the activities data.
         */
        activities: () => Promise<Activity>

        /**
         * Fetches activity replies data from the Anilist API.
         * @returns {Promise<ActivityReply>} A promise that resolves to the activity replies data.
         */
        activityReplies: () => Promise<ActivityReply>

        /**
         * Fetches threads data from the Anilist API.
         * @returns {Promise<ThreadResponse>} A promise that resolves to the threads data.
         */
        threads: () => Promise<ThreadResponse>

        /**
         * Fetches thread comments data from the Anilist API.
         * @returns {Promise<ThreadCommentResponse>} A promise that resolves to the thread comments data.
         */
        threadComments: () => Promise<ThreadCommentResponse>

        /**
         * Fetches reviews data from the Anilist API.
         * @returns {Promise<ReviewResponse>} A promise that resolves to the reviews data.
         */
        reviews: () => Promise<ReviewResponse>

        /**
         * Fetches recommendations data from the Anilist API.
         * @returns {Promise<RecommendationResponse>} A promise that resolves to the recommendations data.
         */
        recommendations: () => Promise<RecommendationResponse>

        /**
         * Fetches likes data from the Anilist API.
         * @returns {Promise<BasicUser>} A promise that resolves to the likes data.
         */
        likes: () => Promise<BasicUser>
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
        recommendation: recommendationQueryInstance.recommmendation.bind(recommendationQueryInstance),
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
        updateMediaListEntries: updateMediaListEntriesMutationInstance.updateMediaListEntries.bind(updateMediaListEntriesMutationInstance)
      }
    }
  }
}

module.exports = AniLink
