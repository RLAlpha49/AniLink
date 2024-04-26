import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { UserResponse } from '../interfaces/responses/User'

interface UserVariables {
  id?: number
  name?: string
  isModerator?: boolean
  search?: string
  sort?: string[]
  isHTML?: boolean
  animeStatLimit?: number
  mangaStatLimit?: number
  animeStatSort?: string[]
  mangaStatSort?: string[]
}

export class UserQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async user (variables?: UserVariables): Promise<UserResponse> {
    // If isHTML is not provided in variables, default it to true
    const { isHTML = true, ...rest } = variables != null ? variables : {}

    const query = `
          query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $isHTML: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
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
                  formats (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    format
                  }
                  statuses (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    status
                  }
                  scores (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    score
                  }
                  lengths (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    length
                  }
                  releaseYears (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    releaseYear
                  }
                  startYears (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    startYear
                  }
                  genres (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    genre
                  }
                  tags (limit: $animeStatLimit, sort: $animeStatSort) {
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
                  countries (limit: $animeStatLimit, sort: $animeStatSort) {
                    count
                    meanScore
                    minutesWatched
                    mediaIds
                    country
                  }
                  voiceActors (limit: $animeStatLimit, sort: $animeStatSort) {
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
                  staff (limit: $animeStatLimit, sort: $animeStatSort) {
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
                  studios (limit: $animeStatLimit, sort: $animeStatSort) {
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
                  formats (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    format
                  }
                  statuses (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    status
                  }
                  scores (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    score
                  }
                  lengths (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    length
                  }
                  releaseYears (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    releaseYear
                  }
                  startYears (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    startYear
                  }
                  genres (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    genre
                  }
                  tags (limit: $mangaStatLimit, sort: $mangaStatSort) {
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
                  countries (limit: $mangaStatLimit, sort: $mangaStatSort) {
                    count
                    meanScore
                    chaptersRead
                    mediaIds
                    country
                  }
                  staff (limit: $mangaStatLimit, sort: $mangaStatSort) {
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
                  studios (limit: $mangaStatLimit, sort: $mangaStatSort) {
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
              stats {
                watchedTime
                chaptersRead
                activityHistory {
                  date
                  amount
                  level
                }
                animeStatusDistribution {
                  status
                  amount
                }
                mangaStatusDistribution {
                  status
                  amount
                }
                animeScoreDistribution {
                  score
                  amount
                }
                mangaScoreDistribution {
                  score
                  amount
                }
                animeListScores {
                  meanScore
                  standardDeviation
                }
                mangaListScores {
                  meanScore
                  standardDeviation
                }
                favouredGenresOverview {
                  genre
                  amount
                  meanScore
                  timeWatched
                }
                favouredGenres {
                  genre
                  amount
                  meanScore
                  timeWatched
                }
                favouredTags {
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
                  amount
                  meanScore
                  timeWatched
                }
                favouredActors {
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
                  amount
                  meanScore
                  timeWatched
                }
                favouredStaff {
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
                  amount
                  meanScore
                  timeWatched
                }
                favouredStudios {
                  studio {
                    id
                    name
                  }
                  amount
                  meanScore
                  timeWatched
                }
                favouredYears {
                  year
                  amount
                  meanScore
                }
                favouredFormats {
                  format
                  amount
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
