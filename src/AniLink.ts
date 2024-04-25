import { UserQuery } from './apis/anilist/query/User'
import { MediaQuery } from './apis/anilist/query/Media'
import { MediaTrendQuery } from './apis/anilist/query/MediaTrend'
import { AiringScheduleQuery } from './apis/anilist/query/AiringSchedule'
import { CharacterQuery } from './apis/anilist/query/Character'
import {
  ListActivityOptionInput,
  MediaListOptionsInput,
  NotificationOptionInput,
  ScoreFormat,
  UpdateUserMutation,
  UserTitleLanguage
} from './apis/anilist/mutation/UpdateUser'

class AniLink {
  public anilist: {
    query: {
      user: () => Promise<any>
      media: () => Promise<any>
      mediaTrend: () => Promise<any>
      airingSchedule: () => Promise<any>
      character: () => Promise<any>
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

  constructor () {
    const userQueryInstance = new UserQuery()
    const mediaQueryInstance = new MediaQuery()
    const mediaTrendQueryInstance = new MediaTrendQuery()
    const airingScheduleQueryInstance = new AiringScheduleQuery()
    const characterQueryInstance = new CharacterQuery()
    const updateUserMutationInstance = new UpdateUserMutation()
    this.anilist = {
      query: {
        user: userQueryInstance.user.bind(userQueryInstance),
        media: mediaQueryInstance.media.bind(mediaQueryInstance),
        mediaTrend: mediaTrendQueryInstance.mediaTrend.bind(mediaTrendQueryInstance),
        airingSchedule: airingScheduleQueryInstance.airingSchedule.bind(airingScheduleQueryInstance),
        character: characterQueryInstance.character.bind(characterQueryInstance)
      },
      mutation: {
        updateUser: updateUserMutationInstance.updateUser.bind(updateUserMutationInstance)
      }
    }
  }
}

module.exports = AniLink
