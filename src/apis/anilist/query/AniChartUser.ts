import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { AniChartUserResponse } from '../interfaces/responses/query/AniChartUser'
import { BasicUserSchema } from '../interfaces/BasicUser'

/**
 * `AniChartUserQuery` is a class representing a query for AniChart users.
 * It includes a method to get AniChart users.
 */
export class AniChartUserQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `AniChartUserQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `aniChartUser` is a method that sends a query request to get AniChart users.
   *
   * @returns The response from the query request.
   */
  async aniChartUser (): Promise<AniChartUserResponse> {
    const query = `
      query {
        AniChartUser {
          user {
            ${BasicUserSchema}
          }
          settings
          highlights
        }
      }
    `

    const data = { query }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
