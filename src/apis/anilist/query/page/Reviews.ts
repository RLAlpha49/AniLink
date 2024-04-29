import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { ReviewResponse, ReviewSchema } from '../../interfaces/responses/query/Review'

/**
 * `ReviewsVariables` is an interface representing the variables for the `ReviewsQuery`.
 * It includes optional id, media id, user id, media type, sort, and as html.
 */
export interface ReviewsVariables {
  /**
   * `id` is a number representing the id of the review.
   */
  id?: number

  /**
   * `mediaId` is a number representing the id of the media.
   */
  mediaId?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `mediaType` is a string representing the type of the media.
   */
  mediaType?: string

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ReviewsQuery` is a class representing a query for reviews.
 * It includes a method to get reviews.
 */
export class ReviewsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ReviewsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `reviews` is a method that sends a query request to get reviews.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async reviews (variables?: ReviewsVariables): Promise<ReviewResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          reviews (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
            ${ReviewSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
