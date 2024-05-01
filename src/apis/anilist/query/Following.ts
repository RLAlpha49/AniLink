import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../interfaces/responses/query/User'
import { type UserSort, UserSortMappings, type UserStatisticSort, UserStatisticSortMappings } from '../types/Sort'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `FollowingVariables` is an interface representing the variables for the `FollowingQuery`.
 * It includes optional userId, sort, animeStatLimit, mangaStatLimit, animeStatSort, and mangaStatSort.
 */
export interface FollowingVariables {
  /**
   * `userId` is a number representing the id of the user.
   */
  userId: number

  /**
   * `sort` is a string representing the sort order.
   */
  sort?: UserSort

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
  animeStatSort?: UserStatisticSort[]

  /**
   * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
   */
  mangaStatSort?: UserStatisticSort[]
}

/**
 * `FollowingQuery` is a class representing a query for following users.
 * It includes a method to get following users.
 */
export class FollowingQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `FollowingQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `following` is a method that sends a query request to get following users.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async following (variables: FollowingVariables): Promise<UserResponse> {
    if (!variables.userId) {
      throw new Error('userId is required')
    }
    const variableTypeMappings = {
      userId: 'number',
      sort: UserSortMappings,
      animeStatLimit: 'number',
      mangaStatLimit: 'number',
      animeStatSort: UserStatisticSortMappings,
      mangaStatSort: UserStatisticSortMappings
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Following (userId: $userId, sort: $sort) {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
