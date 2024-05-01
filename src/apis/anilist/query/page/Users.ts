import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../../interfaces/responses/query/User'
import {UserSortMappings, UserStatisticSortMappings} from "../../types/Sort";
import {validateVariables} from "../../../../base/ValidateVariables";

/**
 * `UsersVariables` is an interface representing the variables for the `UsersQuery`.
 * It includes optional page, per page, id, name, is moderator, search, sort, as html, anime stat limit, manga stat limit, anime stat sort, and manga stat sort.
 */
export interface UsersVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `id` is a number representing the id of the user.
   */
  id?: number

  /**
   * `name` is a string representing the name of the user.
   */
  name?: string

  /**
   * `isModerator` is a boolean representing whether the user is a moderator.
   */
  isModerator?: boolean

  /**
   * `search` is a string representing the search term.
   */
  search?: string

  /**
   * `sort` is an array of strings representing the sort order.
   */
  sort?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
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
   * `animeStatSort` is an array of strings representing the sort order for anime statistics.
   */
  animeStatSort?: string[]

  /**
   * `mangaStatSort` is an array of strings representing the sort order for manga statistics.
   */
  mangaStatSort?: string[]
}

/**
 * `UsersQuery` is a class representing a query for users.
 * It includes a method to get users.
 */
export class UsersQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `UsersQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `users` is a method that sends a query request to get users.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async users (variables: UsersVariables): Promise<UserResponse> {
    if (!variables) {
      throw new Error('At least one variable must be provided')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
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
      query ($page: Int, $perPage: Int, $id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          users (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
