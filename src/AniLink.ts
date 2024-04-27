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

class AniLink {
  public anilist: {
    query: {
      user: () => Promise<any>
      media: () => Promise<any>
      mediaTrend: () => Promise<any>
      airingSchedule: () => Promise<any>
      character: () => Promise<any>
      staff: () => Promise<any>
      mediaList: () => Promise<any>
      mediaListCollection: () => Promise<any>
      genreCollection: () => Promise<any>
      mediaTagCollection: () => Promise<any>
      viewer: () => Promise<any>
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
        viewer: viewerQueryInstance.viewer.bind(viewerQueryInstance)
      },
      mutation: {
        updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance)
      }
    }
  }
}

module.exports = AniLink
