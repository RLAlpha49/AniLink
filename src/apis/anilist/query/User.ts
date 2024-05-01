import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../interfaces/responses/query/User'
import { type UserSort, UserSortMappings, type UserStatisticSort, UserStatisticSortMappings } from '../types/Sort'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `UserVariables` is an interface representing the variables for the `UserQuery`.
 * It includes optional parameters for querying user data.
 */
export interface UserVariables {
  /**
   * `id` is a number representing the id of the user.
   */
  id?: number

  /**
   * `name` is a string representing the name of the user.
   */
  name?: string

  /**
   * `isModerator` is a boolean indicating whether the user is a moderator.
   */
  isModerator?: boolean

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `sort` is an array of strings representing the sort order of the user.
   */
  sort?: UserSort[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean

  /**
   * `animeStatLimit` is a number representing the limit for anime statistics.
   */
  animeStatLimit?: number

  /**
   * `mangaStatLimit` is a number representing the limit for manga statistics.
   */
  mangaStatLimit?: number

  /**
   * `animeStatSort` is an array of strings representing the sort order of the anime statistics.
   */
  animeStatSort?: UserStatisticSort[]

  /**
   * `mangaStatSort` is an array of strings representing the sort order of the manga statistics.
   */
  mangaStatSort?: UserStatisticSort[]
}

/**
 * `UserQuery` is a class representing a query for user data.
 * It includes a method to send the user query and receive the response.
 */
export class UserQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UserQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `user` is a method that sends a query request to get user data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async user (variables: UserVariables): Promise<UserResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      id: 'number',
      name: 'string',
      isModerator: 'boolean',
      search: 'string',
      sort: UserSortMappings,
      asHtml: 'boolean',
      animeStatLimit: 'number',
      mangaStatLimit: 'number',
      animeStatSort: UserStatisticSortMappings,
      mangaStatSort: UserStatisticSortMappings
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        User (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
