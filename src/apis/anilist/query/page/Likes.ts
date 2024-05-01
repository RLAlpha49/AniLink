import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type BasicUser, BasicUserSchema } from '../../interfaces/BasicUser'
import { type LikeableType, LikeableTypeMappings } from '../../types/Type'
import { validateVariables } from '../../../../base/ValidateVariables'

/**
 * `LikesVariables` is an interface representing the variables for the `LikesQuery`.
 * It includes optional likeable id, type, page, and per page.
 */
export interface LikesVariables {
  /**
   * `likeableId` is a number representing the id of the likeable item.
   */
  likeableId?: number

  /**
   * `type` is a string representing the type of the likeable item.
   */
  type?: LikeableType

  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number
}

/**
 * `LikesQuery` is a class representing a query for likes.
 * It includes a method to get likes.
 */
export class LikesQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `LikesQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `likes` is a method that sends a query request to get likes.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async likes (variables: LikesVariables): Promise<BasicUser> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      likeableId: 'number',
      type: LikeableTypeMappings,
      page: 'number',
      perPage: 'number'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($likeableId: Int, $type: LikeableType, $page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          likes (likeableId: $likeableId, type: $type) {
            ${BasicUserSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
