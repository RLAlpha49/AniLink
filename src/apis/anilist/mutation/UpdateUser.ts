import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ListActivityOptionInput } from '../interfaces/Activity'
import { MediaListOptionsInput } from '../interfaces/MediaListEntry'
import { NotificationOptionInput } from '../interfaces/Notification'
import { ScoreFormat } from '../types/ScoreFormat'
import { UserStaffNameLanguage } from '../types/UserStaffNameLanguage'
import { UserTitleLanguage } from '../types/UserTitleLanguage'

export interface UpdateUserVariables {
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
  staffNameLanguage?: UserStaffNameLanguage
  restrictMessagesToFollowing?: boolean
  disabledListActivity?: ListActivityOptionInput[]
}

interface UpdateUserResponse {
  id: number
  name: string
  about: string
  avatar: {
    large: string
    medium: string
  }
  bannerImage: string
  isFollowing: boolean
  isFollower: boolean
  isBlocked: boolean
  bans: any[]
  options: {
    titleLanguage: string
    displayAdultContent: boolean
    airingNotifications: boolean
    profileColor: string
    notificationOptions: Array<{
      type: string
      enabled: boolean
    }>
    timezone: string
    activityMergeTime: number
    staffNameLanguage: string
    restrictMessagesToFollowing: boolean
  }
  mediaListOptions: {
    scoreFormat: string
    rowOrder: string
    animeList: {
      sectionOrder: string[]
      customLists: string[]
      advancedScoring: string[]
      advancedScoringEnabled: boolean
    }
    mangaList: {
      sectionOrder: string[]
      customLists: string[]
      advancedScoring: string[]
      advancedScoringEnabled: boolean
    }
  }
  unreadNotificationCount: number
  siteUrl: string
  donatorTier: number
  donatorBadge: string
  moderatorRoles: string[]
  createdAt: number
  updatedAt: number
}

export class UpdateUserMutation extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async updateUser (variables: UpdateUserVariables): Promise<UpdateUserResponse> {
    const mutation = `
      mutation ($about: String, $titleLanguage: UserTitleLanguage, $displayAdultContent: Boolean, $airingNotifications: Boolean, $scoreFormat: ScoreFormat, $rowOrder: String, $profileColor: String, $donatorBadge: String, $notificationOptions: [NotificationOptionInput], $timezone: String, $activityMergeTime: Int, $animeListOptions: MediaListOptionsInput, $mangaListOptions: MediaListOptionsInput, $staffNameLanguage: UserStaffNameLanguage, $restrictMessagesToFollowing: Boolean, $disabledListActivity: [ListActivityOptionInput]) {
        UpdateUser(about: $about, titleLanguage: $titleLanguage, displayAdultContent: $displayAdultContent, airingNotifications: $airingNotifications, scoreFormat: $scoreFormat, rowOrder: $rowOrder, profileColor: $profileColor, donatorBadge: $donatorBadge, notificationOptions: $notificationOptions, timezone: $timezone, activityMergeTime: $activityMergeTime, animeListOptions: $animeListOptions, mangaListOptions: $mangaListOptions, staffNameLanguage: $staffNameLanguage, restrictMessagesToFollowing: $restrictMessagesToFollowing, disabledListActivity: $disabledListActivity) {
          id
          name
          about
          avatar {
            large
            medium
          }
          bannerImage
          isFollowing
          isFollower
          isBlocked
          bans
          options {
            titleLanguage
            displayAdultContent
            airingNotifications
            profileColor
            notificationOptions {
              type
              enabled
            }
            timezone
            activityMergeTime
            staffNameLanguage
            restrictMessagesToFollowing
          }
          mediaListOptions {
            scoreFormat
            rowOrder
            animeList {
              sectionOrder
              customLists
              advancedScoring
              advancedScoringEnabled
            }
            mangaList {
              sectionOrder
              customLists
              advancedScoring
              advancedScoringEnabled
            }
          }
          unreadNotificationCount
          siteUrl
          donatorTier
          donatorBadge
          moderatorRoles
          createdAt
          updatedAt
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
