import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ExternalLinkSourceCollectionResponse } from '../interfaces/responses/query/ExternalLinkSourceCollection'

/**
 * `ExternalLinkSourceCollectionVariables` is an interface representing the variables for the `ExternalLinkSourceCollectionQuery`.
 * It includes optional id, type, and mediaType.
 */
export interface ExternalLinkSourceCollectionVariables {
  /**
   * `id` is a number representing the id of the external link source collection.
   */
  id?: number

  /**
   * `type` is a string representing the type of the external link source collection.
   */
  type?: string

  /**
   * `mediaType` is a string representing the media type of the external link source collection.
   */
  mediaType?: string
}

/**
 * `ExternalLinkSourceCollectionQuery` is a class representing a query for external link source collections.
 * It includes a method to get external link source collections.
 */
export class ExternalLinkSourceCollectionQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ExternalLinkSourceCollectionQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `externalLinkSourceCollection` is a method that sends a query request to get external link source collections.
   *
   * @param variables - The variables for the query. If not provided, an empty object will be used.
   * @returns The response from the query request.
   */
  async externalLinkSourceCollection (variables: ExternalLinkSourceCollectionVariables = {}): Promise<ExternalLinkSourceCollectionResponse> {
    const query = `
      query ($id: Int, $type: ExternalLinkType, $mediaType: ExternalLinkMediaType) {
        ExternalLinkSourceCollection (id: $id, type: $type, mediaType: $mediaType) {
          id
          url
          site
          siteId
          type
          language
          color
          icon
          notes
          isDisabled
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
