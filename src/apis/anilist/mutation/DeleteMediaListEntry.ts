import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import {MediaListResponse} from "../interfaces/responses/query/MediaList";

/**
 * `DeleteMediaListEntryMutation` is an interface representing the variables to delete a media list entry.
 * It includes the `id` of the media list entry to delete.
 */
export interface DeleteMediaListEntryVariables {
  /**
   * `id` is a number representing the media list entry ID.
   */
  id?: number
}

/**
 * `DeleteMediaListEntryMutation` is a class representing a mutation to delete a media list entry.
 * It includes a method to delete a media list entry.
 */
export class DeleteMediaListEntryMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `DeleteMediaListEntryMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `deleteMediaListEntry` is a method that sends a mutation request to delete a media list entry.
   *
   * @param variables - An object of type `DeleteMediaListEntryVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async deleteMediaListEntry (variables: DeleteMediaListEntryVariables): Promise<MediaListResponse> {
    if (!this.authToken) {
      throw new Error('DeleteMediaListEntryMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id) {
      throw new Error('id variable is required')
    }
    const variableTypeMappings = {
      id: 'number'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int) {
        DeleteMediaListEntry(id: $id) {
          deleted
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
