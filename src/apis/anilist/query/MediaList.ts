import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

interface MediaListVariables {
  id?: number
  userId?: number
  userName?: string
  type?: string
  status?: string
  mediaId?: number
  isFollowing?: boolean
  notes?: string
  startedAt?: number
  completedAt?: number
  compareWithAuthList?: boolean
  userId_in?: number[]
  status_in?: string[]
  status_not_in?: string[]
  status_not?: string
  mediaId_in?: number[]
  mediaId_not_in?: number[]
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
}

interface MediaListResponse {
  id: number
  userId: number
  mediaId: number
  status: string
  score: number
  progress: number
  progressVolumes: number
  repeat: number
  priority: number
  private: boolean
  notes: string
  hiddenFromStatusLists: boolean
  customLists: any
  advancedScores: any
  startedAt: any
  completedAt: any
  updatedAt: number
  createdAt: number
  media: {
    id: number
    idMal: number
    title: {
      romaji: string
      english: string
      native: string
      userPreferred: string
    }
    type: string
    format: string
    status: string
    description: string
    startDate: {
      year: number
      month: number
      day: number
    }
    endDate: {
      year: number
      month: number
      day: number
    }
    season: string
    seasonYear: number
    seasonInt: number
    episodes?: number
    duration?: number
    chapters?: number
    volumes?: number
    countryOfOrigin: string
    isLicensed: boolean
    source: string
    hashtag: string
    trailer: {
      id: string
      site: string
      thumbnail: string
    }
    updatedAt: number
    coverImage: {
      extraLarge: string
      large: string
      medium: string
      color: string
    }
    bannerImage: string
    genres: string[]
    synonyms: string[]
    averageScore: number
    meanScore: number
    popularity: number
    isLocked: boolean
    trending: number
    favourites: number
    tags: Array<{
      id: number
      name: string
      description: string
      rank: number
      isGeneralSpoiler: boolean
      isMediaSpoiler: boolean
      isAdult: boolean
    }>
    isFavourite: boolean
    isAdult: boolean
    nextAiringEpisode: {
      airingAt: number
      timeUntilAiring: number
      episode: number
    }
    externalLinks: Array<{
      id: number
      url: string
      site: string
    }>
    streamingEpisodes: Array<{
      title: string
      thumbnail: string
      url: string
      site: string
    }>
    rankings: Array<{
      id: number
      rank: number
      type: string
      format: string
      year: number
      season: string
      allTime: boolean
      context: string
    }>
    mediaListEntry: {
      id: number
      status: string
    }
    stats: {
      scoreDistribution: Array<{
        score: number
        amount: number
      }>
      statusDistribution: Array<{
        status: string
        amount: number
      }>
    }
    siteUrl: string
    autoCreateForumThread: boolean
    isRecommendationBlocked: boolean
    modNotes: string
  }
  user: any
}

export class MediaListQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async mediaList (variables?: MediaListVariables): Promise<MediaListResponse> {
    const query = `
      query ($id: Int, $userId: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $mediaId: Int, $isFollowing: Boolean, $notes: String, $startedAt: FuzzyDateInt, $completedAt: FuzzyDateInt, $compareWithAuthList: Boolean, $userId_in: [Int], $status_in: [MediaListStatus], $status_not_in: [MediaListStatus], $status_not: MediaListStatus, $mediaId_in: [Int], $mediaId_not_in: [Int], $notes_like: String, $startedAt_greater: FuzzyDateInt, $startedAt_lesser: FuzzyDateInt, $startedAt_like: String, $completedAt_greater: FuzzyDateInt, $completedAt_lesser: FuzzyDateInt, $completedAt_like: String, $ScoreFormat: ScoreFormat, $asArray: Boolean, $asHtml: Boolean) {
        MediaList (id: $id, userId: $userId, userName: $userName, type: $type, status: $status, mediaId: $mediaId, isFollowing: $isFollowing, notes: $notes, startedAt: $startedAt, completedAt: $completedAt, compareWithAuthList: $compareWithAuthList, userId_in: $userId_in, status_in: $status_in, status_not_in: $status_not_in, status_not: $status_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, notes_like: $notes_like, startedAt_greater: $startedAt_greater, startedAt_lesser: $startedAt_lesser, startedAt_like: $startedAt_like, completedAt_greater: $completedAt_greater, completedAt_lesser: $completedAt_lesser, completedAt_like: $completedAt_like) {
          id
          userId
          mediaId
          status
          score (format: $ScoreFormat)
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
              userPreferred
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
              category
              rank
              isGeneralSpoiler
              isMediaSpoiler
              isAdult
            }
            isFavourite
            isFavouriteBlocked
            isAdult
            nextAiringEpisode {
              id
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
            isReviewBlocked
            modNotes
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}