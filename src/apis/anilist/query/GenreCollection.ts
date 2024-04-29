import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

/**
 * `GenreCollectionQuery` is a class representing a query for genre collections.
 * It includes a method to get genre collections.
 */
export class GenreCollectionQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `GenreCollectionQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `genreCollection` is a method that sends a query request to get genre collections.
   *
   * @returns The response from the query request.
   */
  async genreCollection (): Promise<string> {
    const query = `
      query {
        GenreCollection
      }
    `

    const data = { query }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
