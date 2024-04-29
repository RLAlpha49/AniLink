import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { MediaTrendResponse, MediaTrendSchema } from '../../interfaces/responses/query/MediaTrend'

interface MediaTrendsVariables {
  page?: number
  perPage?: number
  mediaId?: number
  date?: number
  trending?: number
  averageScore?: number
  popularity?: number
  episode?: number
  releasing?: boolean
  mediaId_not?: number
  mediaId_in?: number[]
  mediaId_not_in?: number[]
  date_greater?: number
  date_lesser?: number
  trending_greater?: number
  trending_lesser?: number
  trending_not?: number
  averageScore_greater?: number
  averageScore_lesser?: number
  averageScore_not?: number
  popularity_greater?: number
  popularity_lesser?: number
  popularity_not?: number
  episode_greater?: number
  episode_lesser?: number
  episode_not?: number
  sort?: string[]
  asHtml?: boolean
}

export class MediaTrendsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async mediaTrends (variables?: MediaTrendsVariables): Promise<MediaTrendResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $mediaId: Int, $date: Int, $trending: Int, $averageScore: Int, $popularity: Int, $episode: Int, $releasing: Boolean, $mediaId_not: Int, $mediaId_in: [Int], $mediaId_not_in: [Int], $date_greater: Int, $date_lesser: Int, $trending_greater: Int, $trending_lesser: Int, $trending_not: Int, $averageScore_greater: Int, $averageScore_lesser: Int, $averageScore_not: Int, $popularity_greater: Int, $popularity_lesser: Int, $popularity_not: Int, $episode_greater: Int, $episode_lesser: Int, $episode_not: Int, $sort: [MediaTrendSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          mediaTrends (mediaId: $mediaId, date: $date, trending: $trending, averageScore: $averageScore, popularity: $popularity, episode: $episode, releasing: $releasing, mediaId_not: $mediaId_not, mediaId_in: $mediaId_in, mediaId_not_in: $mediaId_not_in, date_greater: $date_greater, date_lesser: $date_lesser, trending_greater: $trending_greater, trending_lesser: $trending_lesser, trending_not: $trending_not, averageScore_greater: $averageScore_greater, averageScore_lesser: $averageScore_lesser, averageScore_not: $averageScore_not, popularity_greater: $popularity_greater, popularity_lesser: $popularity_lesser, popularity_not: $popularity_not, episode_greater: $episode_greater, episode_lesser: $episode_lesser, episode_not: $episode_not, sort: $sort) {
            ${MediaTrendSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}