import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

interface AiringScheduleVariables {
  id?: number
  mediaId?: number
  episode?: number
  airingAt?: number
  notYetAired?: boolean
  id_not?: number
  id_in?: number[]
  id_not_in?: number[]
  mediaId_not?: number
  mediaId_in?: number[]
  mediaId_not_in?: number[]
  episode_not?: number
  episode_in?: number[]
  episode_not_in?: number[]
  episode_greater?: number
  episode_lesser?: number
  airingAt_greater?: number
  airingAt_lesser?: number
  sort?: string[]
}

interface AiringScheduleResponse {
  id: number
  airingAt: number
  timeUntilAiring: number
  episode: number
  mediaId: number
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
}

export class AiringScheduleQuery extends APIWrapper {
  constructor () {
    super('https://graphql.anilist.co')
  }

  async airingSchedule (variables?: AiringScheduleVariables): Promise<AiringScheduleResponse> {
    const query = `
      query ($id: Int, $mediaId: Int, $episode: Int, $airingAt: Int, $notYetAired: Boolean, $id_not: Int, $id_in: [Int], $id_not_in: [Int], $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $episode_not: Int, $episode_in: [Int], $episode_not_in: [Int], $episode_greater: Int, $episode_lesser: Int, $airingAt_greater: Int, $airingAt_lesser: Int, $sort: [AiringSort]) {
        AiringSchedule (id: $id, mediaId: $mediaId, episode: $episode, airingAt: $airingAt, notYetAired: $notYetAired, id_not: $id_not, id_in: $id_in, id_not_in: $id_not_in, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, episode_not: $episode_not, episode_in: $episode_in, episode_not_in: $episode_not_in, episode_greater: $episode_greater, episode_lesser: $episode_lesser, airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: $sort) {
          id
          airingAt
          timeUntilAiring
          episode
          mediaId
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
            description
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
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data)
  }
}
