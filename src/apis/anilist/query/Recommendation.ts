import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { RecommendationResponse, RecommendationSchema } from '../interfaces/responses/query/Recommendation'

export interface RecommendationVariables {
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

export class RecommendationQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async recommmendation (variables?: RecommendationVariables): Promise<RecommendationResponse> {
    const query = `
      query ($id: Int, $mediaId: Int, $mediaRecommendationId: Int, $userId: Int, $rating: Int, $onList: Boolean, $rating_greater: Int, $rating_lesser: Int, $sort: [RecommendationSort], $asHtml: Boolean) {
        Recommendation (id: $id, mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, userId: $userId, rating: $rating, onList: $onList, rating_greater: $rating_greater, rating_lesser: $rating_lesser, sort: $sort) {
          ${RecommendationSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
