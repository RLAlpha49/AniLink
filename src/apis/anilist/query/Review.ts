import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type ReviewResponse, ReviewSchema } from '../interfaces/responses/query/Review'
import {MediaType} from "../types/Type";
import {ReviewSort, ReviewSortMappings} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `ReviewVariables` is an interface representing the variables for the `ReviewQuery`.
 * It includes optional parameters for querying review data.
 */
export interface ReviewVariables {
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
  mediaType?: MediaType

  /**
   * `sort` is an array of strings representing the sort order of the review.
   */
  sort?: ReviewSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `ReviewQuery` is a class representing a query for review data.
 * It includes a method to send the review query and receive the response.
 */
export class ReviewQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ReviewQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `review` is a method that sends a query request to get review data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async review (variables: ReviewVariables): Promise<ReviewResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      id: 'number',
      mediaId: 'number',
      userId: 'number',
      mediaType: 'string',
      sort: ReviewSortMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Review (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
          ${ReviewSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
