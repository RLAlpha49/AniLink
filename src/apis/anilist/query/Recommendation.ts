import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type RecommendationResponse, RecommendationSchema } from '../interfaces/responses/query/Recommendation'

/**
 * `RecommendationVariables` is an interface representing the variables for the `RecommendationQuery`.
 * It includes optional parameters for querying recommendation data.
 */
export interface RecommendationVariables {
  /**
   * `id` is a number representing the id of the recommendation.
   */
  id?: number

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `mediaRecommendationId` is a number representing the id of the media recommendation.
   */
  mediaRecommendationId?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `rating` is a number representing the rating of the recommendation.
   */
  rating?: number

  /**
   * `onList` is a boolean indicating whether the recommendation is on the list.
   */
  onList?: boolean

  /**
   * `rating_greater` is a number representing the rating greater than the recommendation.
   */
  rating_greater?: number

  /**
   * `rating_lesser` is a number representing the rating lesser than the recommendation.
   */
  rating_lesser?: number

  /**
   * `sort` is an array of strings representing the sort order of the recommendation.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `RecommendationQuery` is a class representing a query for recommendation data.
 * It includes a method to send the recommendation query and receive the response.
 */
export class RecommendationQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `RecommendationQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `recommmendation` is a method that sends a query request to get recommendation data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
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
