import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type MediaTagCollectionResponse } from '../interfaces/responses/query/MediaTagCollection'
import { TagSchema } from '../interfaces/Tag'
import {validateVariables} from "../../../base/ValidateVariables";

/**
 * `MediaTagCollectionVariables` is an interface representing the variables for the `MediaTagCollectionQuery`.
 * It includes optional parameters for querying media tag collection data.
 */
export interface MediaTagCollectionVariables {
  /**
   * `status` is a number representing the status of the media tag.
   */
  status?: number
}

/**
 * `MediaTagCollectionQuery` is a class representing a query for media tag collection data.
 * It includes a method to send the media tag collection query and receive the response.
 */
export class MediaTagCollectionQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `MediaTagCollectionQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
 * `mediaTagCollection` is a method that sends a query request to get media tag collection data.
 *
 * @param variables - The variables for the query. If not provided, an empty object will be used.
 * @returns The response from the query request.
 */
  async mediaTagCollection (variables: MediaTagCollectionVariables = {}): Promise<MediaTagCollectionResponse> {
    const variableTypeMappings = {
      status: 'number'
    }

    if (Object(variables).length > 0) {
      validateVariables(variables, variableTypeMappings)
    }

    const query = `
      query ($status: Int) {
        MediaTagCollection (status: $status) {
          ${TagSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
