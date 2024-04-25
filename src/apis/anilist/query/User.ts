import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

interface UserVariables {
  id?: number
  name?: string
  isModerator?: boolean
  search?: string
  sort?: string[]
  isHTML?: boolean
}

interface UserResponse {
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

export class UserQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async user (variables?: UserVariables): Promise<UserResponse> {
    // If isHTML is not provided in variables, default it to true
    const { isHTML = true, ...rest } = variables != null ? variables : {}

    const query = `
          query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $isHTML: Boolean) {
            User (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
              id
              name
              about(asHtml: $isHTML)
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
                  disabledListActivity {
                  disabled
                  type
                  }
              }
              mediaListOptions {
                scoreFormat
                rowOrder
                animeList {
                  sectionOrder
                  splitCompletedSectionByFormat
                  customLists
                  advancedScoring
                  advancedScoringEnabled
                }
                mangaList {
                  sectionOrder
                  splitCompletedSectionByFormat
                  customLists
                  advancedScoring
                  advancedScoringEnabled
                }
              }
              favourites {
                anime (perPage: 50) {
                  edges {
                    node {
                      id
                      title {
                        romaji
                        english
                        native
                        userPreferred
                      }
                    }
                  }
                  nodes {
                    id
                    title {
                      romaji
                      english
                      native
                      userPreferred
                    }
                  }
                }
                manga (perPage: 50) {
                  edges {
                    node {
                    id
                    title {
                      romaji
                      english
                      native
                      userPreferred
                      }
                    }
                  }
                  nodes {
                    id
                    title {
                      romaji
                      english
                      native
                      userPreferred
                    }
                  }
                }
                characters (perPage: 50) {
                  edges {
                    id
                    role
                    name
                    voiceActors {
                      id
                      name {
                        first
                        last
                        full
                        native
                      }
                      image {
                        large
                      }
                    }
                    media {
                      id
                      title {
                        romaji
                        english
                        native
                        userPreferred
                      }
                      coverImage {
                        extraLarge
                        large
                        medium
                        color
                      }
                    }
                    favouriteOrder
                    node {
                      id
                      name {
                        first
                        last
                        full
                        native
                      }
                      image {
                        large
                      }
                    }
                  }
                }
                staff (perPage: 50) {
                  edges {
                    id
                    role
                    favouriteOrder
                    node {
                      id
                      name {
                        first
                        last
                        full
                        native
                      }
                      image {
                        large
                      }
                    }
                  }
                }
                studios (perPage: 50) {
                  edges {
                    id
                    isMain
                    favouriteOrder
                    node {
                      id
                      name
                      isAnimationStudio
                      siteUrl
                    }
                  }
                }
              }
              statistics {
                anime {
                  count
                  meanScore
                  standardDeviation
                  minutesWatched
                  episodesWatched
                  formats {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    format
                  }
                  statuses {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    status
                  }
                  scores {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    score
                  }
                  lengths {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    length
                  }
                  releaseYears {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    releaseYear
                  }
                  startYears {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    startYear
                  }
                  genres {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    genre
                  }
                  tags {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    tag {
                      id
                      name
                      description
                      category
                      rank
                      isGeneralSpoiler
                      isMediaSpoiler
                      isAdult
                    }
                  }
                  countries {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    country
                  }
                  voiceActors {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    voiceActor {
                      id
                      name {
                        first
                        last
                        full
                        native
                        alternative
                        userPreferred
                      }
                    }
                    characterIds
                  }
                  staff {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    staff {
                      id
                      name {
                        first
                        last
                        full
                        native
                        alternative
                        userPreferred
                      }
                    }
                  }
                  studios {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    studio {
                      id
                      name
                    }
                  }
                }
                manga {
                  count
                  meanScore
                  standardDeviation
                  chaptersRead
                  volumesRead
                  formats {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    format
                  }
                  statuses {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    status
                  }
                  scores {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    score
                  }
                  lengths {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    length
                  }
                  releaseYears {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    releaseYear
                  }
                  startYears {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    startYear
                  }
                  genres {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    genre
                  }
                  tags {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    tag {
                      id
                      name
                      description
                      category
                      rank
                      isGeneralSpoiler
                      isMediaSpoiler
                      isAdult
                    }
                  }
                  countries {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    country
                  }
                  staff {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    staff {
                      id
                      name {
                        first
                        last
                        full
                        native
                        alternative
                        userPreferred
                      }
                    }
                  }
                  studios {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    studio {
                      id
                      name
                    }
                  }
                }
              }
              unreadNotificationCount
              siteUrl
              donatorTier
              donatorBadge
              moderatorRoles
              createdAt
              updatedAt
              previousNames {
                name
                createdAt
                updatedAt
              }
            }
          }
        `

    const data = { query, variables: { isHTML, ...rest } }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}
