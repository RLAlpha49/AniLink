import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../interfaces/responses/query/User'

/**
 * `FollowerVariables` is an interface representing the variables for the `FollowerQuery`.
 * It includes optional userId, sort, animeStatLimit, mangaStatLimit, animeStatSort, and mangaStatSort.
 */
export interface FollowerVariables {
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
 * `FollowerQuery` is a class representing a query for followers.
 * It includes a method to get followers.
 */
export class FollowerQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `FollowerQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `follower` is a method that sends a query request to get followers.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async follower (variables?: FollowerVariables): Promise<UserResponse> {
    const query = `
      query ($userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Follower (userId: $userId, sort: $sort) {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
