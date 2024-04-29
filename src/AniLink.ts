import { Activity } from './apis/anilist/interfaces/Activity'
import { ActivityQuery } from './apis/anilist/query/Activity'
import { ActivityReply } from './apis/anilist/interfaces/ActivityReply'
import { ActivityReplyQuery } from './apis/anilist/query/ActivityReply'
import { ActivityRepliesQuery } from './apis/anilist/query/page/ActivityReplies'
import { ActivitiesQuery } from './apis/anilist/query/page/Activities'
import { AiringScheduleQuery } from './apis/anilist/query/AiringSchedule'
import { AiringScheduleResponse } from './apis/anilist/interfaces/responses/query/AiringSchedule'
import { AiringSchedulesQuery } from './apis/anilist/query/page/AiringSchedules'
import { AniChartUserQuery } from './apis/anilist/query/AniChartUser'
import { AniChartUserResponse } from './apis/anilist/interfaces/responses/query/AniChartUser'
import { BasicUser } from './apis/anilist/interfaces/BasicUser'
import { CharacterQuery } from './apis/anilist/query/Character'
import { CharacterResponse } from './apis/anilist/interfaces/responses/query/Character'
import { CharactersQuery } from './apis/anilist/query/page/Characters'
import { ExternalLinkSourceCollectionQuery } from './apis/anilist/query/ExternalLinkSourceCollection'
import { ExternalLinkSourceCollectionResponse } from './apis/anilist/interfaces/responses/query/ExternalLinkSourceCollection'
import { FollowerQuery } from './apis/anilist/query/Follower'
import { FollowersQuery } from './apis/anilist/query/page/Followers'
import { FollowingQuery } from './apis/anilist/query/Following'
import { FollowingsQuery } from './apis/anilist/query/page/Followings'
import { GenreCollectionQuery } from './apis/anilist/query/GenreCollection'
import { LikesQuery } from './apis/anilist/query/page/Likes'
import { MarkdownQuery } from './apis/anilist/query/Markdown'
import { MediaListCollectionQuery } from './apis/anilist/query/MediaListCollection'
import { MediaListCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaListCollectionResponse'
import { MediaListQuery } from './apis/anilist/query/MediaList'
import { MediaListResponse } from './apis/anilist/interfaces/responses/query/MediaList'
import { MediaListsQuery } from './apis/anilist/query/page/MediaLists'
import { MediaQuery } from './apis/anilist/query/Media'
import { MediaResponse } from './apis/anilist/interfaces/responses/query/Media'
import { MediaTagCollectionQuery } from './apis/anilist/query/MediaTagCollection'
import { MediaTagCollectionResponse } from './apis/anilist/interfaces/responses/query/MediaTagCollection'
import { MediaTrendQuery } from './apis/anilist/query/MediaTrend'
import { MediaTrendResponse } from './apis/anilist/interfaces/responses/query/MediaTrend'
import { MediaTrendsQuery } from './apis/anilist/query/page/MediaTrends'
import { MediasQuery } from './apis/anilist/query/page/Medias'
import { NotificationQuery } from './apis/anilist/query/Notification'
import { NotificationResponse } from './apis/anilist/interfaces/responses/query/Notification'
import { NotificationsQuery } from './apis/anilist/query/page/Notifications'
import { RecommendationQuery } from './apis/anilist/query/Recommendation'
import { RecommendationResponse } from './apis/anilist/interfaces/responses/query/Recommendation'
import { RecommendationsQuery } from './apis/anilist/query/page/Recommendations'
import { ReviewQuery } from './apis/anilist/query/Review'
import { ReviewResponse } from './apis/anilist/interfaces/responses/query/Review'
import { ReviewsQuery } from './apis/anilist/query/page/Reviews'
import { SaveMediaListEntryMutation, SaveMediaListEntryVariables } from './apis/anilist/mutation/SaveMediaListEntry'
import { SiteStatisticsQuery } from './apis/anilist/query/SiteStatistics'
import { SiteStatisticsResponse } from './apis/anilist/interfaces/responses/query/SiteStatistics'
import { StaffQuery } from './apis/anilist/query/Staff'
import { StaffResponse } from './apis/anilist/interfaces/responses/query/Staff'
import { StaffsQuery } from './apis/anilist/query/page/Staffs'
import { StudioQuery } from './apis/anilist/query/Studio'
import { StudioResponse } from './apis/anilist/interfaces/responses/query/Studio'
import { StudiosQuery } from './apis/anilist/query/page/Studios'
import { ThreadCommentQuery } from './apis/anilist/query/ThreadComment'
import { ThreadCommentResponse } from './apis/anilist/interfaces/responses/query/ThreadComment'
import { ThreadCommentsQuery } from './apis/anilist/query/page/ThreadCommments'
import { ThreadQuery } from './apis/anilist/query/Thread'
import { ThreadResponse } from './apis/anilist/interfaces/responses/query/Thread'
import { ThreadsQuery } from './apis/anilist/query/page/Threads'
import { UpdateMediaListEntriesMutation, UpdateMediaListEntriesVariables } from './apis/anilist/mutation/UpdateMediaListEntries'
import { UpdateUserMutation, UpdateUserVariables } from './apis/anilist/mutation/UpdateUser'
import { UserQuery } from './apis/anilist/query/User'
import { UserResponse } from './apis/anilist/interfaces/responses/query/User'
import { UsersQuery } from './apis/anilist/query/page/Users'
import { ViewerQuery } from './apis/anilist/query/Viewer'

class AniLink {
  public anilist: {
    query: {
      user: () => Promise<UserResponse>
      media: () => Promise<MediaResponse>
      mediaTrend: () => Promise<MediaTrendResponse>
      airingSchedule: () => Promise<AiringScheduleResponse>
      character: () => Promise<CharacterResponse>
      staff: () => Promise<StaffResponse>
      mediaList: () => Promise<MediaListResponse>
      mediaListCollection: () => Promise<MediaListCollectionResponse>
      genreCollection: () => Promise<String>
      mediaTagCollection: () => Promise<MediaTagCollectionResponse>
      viewer: () => Promise<UserResponse>
      notification: () => Promise<NotificationResponse>
      studio: () => Promise<StudioResponse>
      review: () => Promise<ReviewResponse>
      activity: () => Promise<Activity>
      activityReply: () => Promise<ActivityReply>
      following: () => Promise<UserResponse>
      follower: () => Promise<UserResponse>
      thread: () => Promise<ThreadResponse>
      threadComment: () => Promise<ThreadCommentResponse>
      recommendation: () => Promise<RecommendationResponse>
      markdown: () => Promise<string>
      aniChartUser: () => Promise<AniChartUserResponse>
      siteStatistics: () => Promise<SiteStatisticsResponse>
      externalLinkSourceCollection: () => Promise<ExternalLinkSourceCollectionResponse>

      page: {
        users: () => Promise<UserResponse>
        medias: () => Promise<MediaResponse>
        characters: () => Promise<CharacterResponse>
        staffs: () => Promise<StaffResponse>
        studios: () => Promise<StudioResponse>
        mediaLists: () => Promise<MediaListResponse>
        airingSchedules: () => Promise<AiringScheduleResponse>
        mediaTrends: () => Promise<MediaTrendResponse>
        notifications: () => Promise<NotificationResponse>
        followers: () => Promise<UserResponse>
        following: () => Promise<UserResponse>
        activities: () => Promise<Activity>
        activityReplies: () => Promise<ActivityReply>
        threads: () => Promise<ThreadResponse>
        threadComments: () => Promise<ThreadCommentResponse>
        reviews: () => Promise<ReviewResponse>
        recommendations: () => Promise<RecommendationResponse>
        likes: () => Promise<BasicUser>
      }
    }
    mutation: {
      updateUser: (variables: UpdateUserVariables) => Promise<any>
      saveMediaListEntry: (variables: SaveMediaListEntryVariables) => Promise<any>
      updateMediaListEntries: (variables: UpdateMediaListEntriesVariables) => Promise<any>
    }
  }

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
