import { Image } from '../Image'

export interface UserResponse {
  id: number
  name: string
  about: string
  avatar: Image
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
    disabledListActivity: Array<{
      disabled: boolean
      type: string
    }>
  }
  mediaListOptions: {
    scoreFormat: string
    rowOrder: string
    animeList: {
      sectionOrder: string[]
      splitCompletedSectionByFormat: boolean
      customLists: string[]
      advancedScoring: string[]
      advancedScoringEnabled: boolean
    }
    mangaList: {
      sectionOrder: string[]
      splitCompletedSectionByFormat: boolean
      customLists: string[]
      advancedScoring: string[]
      advancedScoringEnabled: boolean
    }
  }
  favourites: {
    anime: any[]
    manga: any[]
    characters: any[]
    staff: any[]
    studios: any[]
  }
  statistics: {
    anime: any
    manga: any
  }
  unreadNotificationCount: number
  siteUrl: string
  donatorTier: number
  donatorBadge: string
  moderatorRoles: string[]
  createdAt: number
  updatedAt: number
  previousNames: Array<{
    name: string
    createdAt: number
    updatedAt: number
  }>
}
