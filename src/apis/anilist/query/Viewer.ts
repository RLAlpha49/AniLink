import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type UserResponse, UserSchema } from '../interfaces/responses/query/User'
import {UserStatisticSort, UserStatisticSortMappings} from "../types/Sort";
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `ViewerVariables` is an interface representing the variables for the `ViewerQuery`.
 * It includes optional parameters for querying viewer data.
 */
export interface ViewerVariables {
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
 * `ViewerQuery` is a class representing a query for viewer data.
 * It includes a method to send the viewer query and receive the response.
 */
export class ViewerQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ViewerQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `viewer` is a method that sends a query request to get viewer data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async viewer (variables: ViewerVariables = {}): Promise<UserResponse> {
    const variableTypeMappings = {
      asHtml: 'boolean',
      animeStatLimit: 'number',
      mangaStatLimit: 'number',
      animeStatSort: UserStatisticSortMappings,
      mangaStatSort: UserStatisticSortMappings
    }

    if (Object(variables).length > 0) {
      validateVariables(variables, variableTypeMappings)
    }

    const query = `
      query ($asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Viewer {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
