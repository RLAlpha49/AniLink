import { UserQuery } from './apis/anilist/query/User'
import { MediaQuery } from './apis/anilist/query/Media'
import { MediaTrendQuery } from './apis/anilist/query/MediaTrend'
import { AiringScheduleQuery } from './apis/anilist/query/AiringSchedule'
import { CharacterQuery } from './apis/anilist/query/Character'
import { MediaListQuery } from './apis/anilist/query/MediaList'
import { StaffQuery } from './apis/anilist/query/Staff'
import { MediaListCollectionQuery } from './apis/anilist/query/MediaListCollection'
import { GenreCollectionQuery } from './apis/anilist/query/GenreCollection'
import {
  ListActivityOptionInput,
  MediaListOptionsInput,
  NotificationOptionInput,
  ScoreFormat,
  UpdateUserMutation,
  UserTitleLanguage
} from './apis/anilist/mutation/UpdateUser'
import { MediaTagCollectionQuery } from './apis/anilist/query/MediaTagCollection'
import { ViewerQuery } from './apis/anilist/query/Viewer'
import { NotificationQuery } from './apis/anilist/query/Notification'
import { StudioQuery } from './apis/anilist/query/Studio'
import { UserResponse } from './apis/anilist/interfaces/responses/User'
import { MediaResponse } from './apis/anilist/interfaces/responses/Media'
import { MediaTrendResponse } from './apis/anilist/interfaces/responses/MediaTrend'
import { AiringScheduleResponse } from './apis/anilist/interfaces/responses/AiringSchedule'
import { CharacterResponse } from './apis/anilist/interfaces/responses/Character'
import { StaffResponse } from './apis/anilist/interfaces/responses/Staff'
import { MediaListResponse } from './apis/anilist/interfaces/responses/MediaList'
import { MediaListCollectionResponse } from './apis/anilist/interfaces/responses/MediaListCollectionResponse'
import { MediaTagCollectionResponse } from './apis/anilist/interfaces/responses/MediaTagCollection'
import { NotificationResponse } from './apis/anilist/interfaces/responses/Notification'
import { StudioResponse } from './apis/anilist/interfaces/responses/Studio'
import { ReviewResponse } from './apis/anilist/interfaces/responses/Review'
import { ReviewQuery } from './apis/anilist/query/Review'
import { Activity } from './apis/anilist/interfaces/Activity'
import { ActivityQuery } from './apis/anilist/query/Activity'
import { ActivityReply } from './apis/anilist/interfaces/ActivityReply'
import { ActivityReplyQuery } from './apis/anilist/query/ActivityReply'

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
    }
    mutation: {
      updateUser: (variables: {
        about?: string
        titleLanguage?: UserTitleLanguage
        displayAdultContent?: boolean
        airingNotifications?: boolean
        scoreFormat?: ScoreFormat
        rowOrder?: string
        profileColor?: string
        donatorBadge?: string
        notificationOptions?: NotificationOptionInput[]
        timezone?: string
        activityMergeTime?: number
        animeListOptions?: MediaListOptionsInput
        mangaListOptions?: MediaListOptionsInput
        staffNameLanguage?: UserTitleLanguage
        restrictMessagesToFollowing?: boolean
        disabledListActivity?: ListActivityOptionInput[]
      }) => Promise<any>
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

    const updateUserMutationInstance = new UpdateUserMutation(authToken)
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
        activityReply: activityReplyQueryInstance.activityReply.bind(activityReplyQueryInstance)
      },
      mutation: {
        updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance)
      }
    }
  }
}

module.exports = AniLink
