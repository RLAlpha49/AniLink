import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type MediaType, MediaTypeMappings } from '../types/Type'

/**
 * `DeleteCustomListMutation` is an interface representing the variables to delete a custom list.
 * It includes the `customList` and `type` variables of the custom list to delete.
 */
export interface DeleteCustomListVariables {
  customList?: string
  type?: MediaType
}

/**
 * `DeleteCustomListMutation` is a class representing a mutation to delete a custom list.
 * It includes a method to delete a custom list
 */
export class DeleteCustomListMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `DeleteCustomListMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `deleteMediaListEntry` is a method that sends a mutation request to delete a custom list.
   *
   * @param variables - An object of type `DeleteCustomListVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async deleteCustomList (variables: DeleteCustomListVariables): Promise<any> {
    if (!variables.customList || !variables.type) {
      throw new Error('customList & type variables are required')
    }
    const variableTypeMappings = {
      customList: 'string',
      type: MediaTypeMappings
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($customList: String, $type: MediaType) {
        DeleteCustomList(customList: $customList, type: $type) {
          deleted
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
