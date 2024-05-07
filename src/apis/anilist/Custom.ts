import { APIWrapper } from '../../base/APIWrapper'
import { sendRequest } from '../../base/RequestHandler'

/**
 * `CustomRequest` is a class representing a custom query or mutation by the user.
 */
export class CustomRequest extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ActivityQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `custom` is a method that sends a custom query or mutation by the user.
   *
   * @param query - The query for the request.
   * @param variables - The variables for the request. This parameter is optional.
   * @returns The response from the query request.
   */
  async custom (query: string, variables: unknown = {}): Promise<any> {
    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
