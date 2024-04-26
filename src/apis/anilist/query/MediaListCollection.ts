import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { MediaListCollectionResponse } from '../interfaces/responses/MediaListCollectionResponse'
// import { MediaListCollectionResponse } from '../interfaces/responses/MediaListCollection'

interface MediaListCollectionVariables {
  userId?: number
  userName?: string
  type?: string
  status?: string
  notes?: string
  startedAt?: number
  completedAt?: number
  forceSingleCompletedList?: boolean
  chunk?: number
  perChunk?: number
  status_in?: string[]
  status_not_in?: string[]
  status_not?: string
  notes_like?: string
  startedAt_greater?: number
  startedAt_lesser?: number
  startedAt_like?: string
  completedAt_greater?: number
  completedAt_lesser?: number
  completedAt_like?: string
  sort?: string[]
  scoreFormat?: string
  asArray?: boolean
  asHtml?: boolean
  animeStatLimit?: number
  animeStatSort?: string[]
  mangaStatLimit?: number
  mangaStatSort?: string[]
}

export class MediaListCollectionQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async mediaListCollection (variables?: MediaListCollectionVariables): Promise<MediaListCollectionResponse> {
    const query = `
      query ($userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $forceSingleCompletedList: Boolean, $chunk: Int, $perChunk: Int, $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $sort: [MediaListSort], $scoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean, $animeStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatLimit: Int, $mangaStatSort: [UserStatisticsSort]) {
        MediaListCollection (userId: $userId, userName: $userName, type: $type, status: $status, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, forceSingleCompletedList: $forceSingleCompletedList, chunk: $chunk, perChunk: $perChunk, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like, sort: $sort) {
          lists {
            entries {
              id
              userId
              mediaId
              status
              score (format: $scoreFormat)
              progress
              progressVolumes
              repeat
              priority
              private
              notes
              hiddenFromStatusLists
              customLists (asArray: $asArray)
              advancedScores
              startedAt {
                year
                month
                day
              }
              completedAt {
                year
                month
                day
              }
              updatedAt
              createdAt
              media {
                id
                idMal
                title {
                  romaji
                  english
                  native
                }
                type
                format
                status
                description (asHtml: $asHtml)
                startDate {
                  year
                  month
                  day
                }
                endDate {
                  year
                  month
                  day
                }
                season
                seasonYear
                seasonInt
                episodes
                duration
                chapters
                volumes
                countryOfOrigin
                isLicensed
                source
                hashtag
                trailer {
                  id
                  site
                  thumbnail
                }
                updatedAt
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
                bannerImage
                genres
                synonyms
                averageScore
                meanScore
                popularity
                isLocked
                trending
                favourites
                tags {
                  id
                  name
                  description 
                  rank
                  isGeneralSpoiler
                  isMediaSpoiler
                  isAdult
                }
                relations {
                  edges {
                    relationType
                    node {
                      id
                      title {
                        romaji
                        english
                        native
                      }
                    }
                  }
                }
                characters {
                  edges {
                    id
                    role
                    name
                    voiceActors {
                      id
                      name {
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
                        full
                        native
                      }
                      image {
                        large
                      }
                    }
                  }
                }
                staff {
                  edges {
                    id
                    role
                    favouriteOrder
                    node {
                      id
                      name {
                        full
                        native
                      }
                      image {
                        large
                      }
                    }
                  }
                }
                studios {
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
                isFavourite
                isAdult
                nextAiringEpisode {
                  airingAt
                  timeUntilAiring
                  episode
                }
                externalLinks {
                  id
                  url
                  site
                }
                streamingEpisodes {
                  title
                  thumbnail
                  url
                  site
                }
                rankings {
                  id
                  rank
                  type
                  format
                  year
                  season
                  allTime
                  context
                }
                mediaListEntry {
                  id
                  status
                }
                stats {
                  scoreDistribution {
                    score
                    amount
                  }
                  statusDistribution {
                    status
                    amount
                  }
                }
                siteUrl
                autoCreateForumThread
                isRecommendationBlocked
                modNotes
              }
            }
            name
            isCustomList
            isSplitCompletedList
            status
          }
          user {
            id
            name
            about (asHtml: $asHtml)
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
                      full
                      native
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
                      full
                      native
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
                      full
                      native
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
          }
          hasNextChunk
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
