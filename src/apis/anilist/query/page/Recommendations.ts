import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { RecommendationResponse, RecommendationSchema } from '../../interfaces/responses/query/Recommendation'

export interface RecommendationsVariables {
  page?: number
  perPage?: number
  id?: number
  mediaId?: number
  mediaRecommendationId?: number
  userId?: number
  rating?: number
  onList?: boolean
  rating_greater?: number
  rating_lesser?: number
  sort?: string[]
  asHtml?: boolean
}

export class RecommendationsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async recommendations (variables?: RecommendationsVariables): Promise<RecommendationResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $mediaId: Int, $mediaRecommendationId: Int, $userId: Int, $rating: Int, $onList: Boolean, $rating_greater: Int, $rating_lesser: Int, $sort: [RecommendationSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          recommendations (id: $id, mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, userId: $userId, rating: $rating, onList: $onList, rating_greater: $rating_greater, rating_lesser: $rating_lesser, sort: $sort) {
            ${RecommendationSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
