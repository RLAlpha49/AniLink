import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../../interfaces/responses/query/User'

/**
 * `FollowersVariables` is an interface representing the variables for the `FollowersQuery`.
 * It includes optional page, per page, user id, sort, anime stat limit, manga stat limit, anime stat sort, and manga stat sort.
 */
export interface FollowersVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `userId` is a number representing the id of the user.
   */
  userId?: number

  /**
   * `sort` is a string representing the sort order.
   */
  sort?: string

  /**
   * `animeStatLimit` is a number representing the limit for anime statistics.
   */
  animeStatLimit?: number

  /**
   * `mangaStatLimit` is a number representing the limit for manga statistics.
   */
  mangaStatLimit?: number

  /**
   * `animeStatSort` is an array of strings representing the sort order for anime statistics.
   */
  animeStatSort?: string[]

  /**
   * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
   */
  mangaStatSort?: string[]
}

/**
 * `FollowersQuery` is a class representing a query for followers.
 * It includes a method to get followers.
 */
export class FollowersQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `FollowersQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `followers` is a method that sends a query request to get followers.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async followers (variables?: FollowersVariables): Promise<UserResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          followers (userId: $userId, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
