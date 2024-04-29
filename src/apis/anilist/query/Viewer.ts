import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { UserResponse, UserSchema } from '../interfaces/responses/query/User'

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
  animeStatSort?: string[]

  /**
   * `mangaStatSort` is an array of strings representing the sort order of the manga statistics.
   */
  mangaStatSort?: string[]
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
  async viewer (variables?: ViewerVariables): Promise<UserResponse> {
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
