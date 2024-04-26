import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { AiringScheduleResponse } from '../interfaces/responses/AiringSchedule'

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

export class AiringScheduleQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
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
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
