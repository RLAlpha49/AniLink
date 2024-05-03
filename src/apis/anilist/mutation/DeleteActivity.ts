import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `DeleteActivityMutation` is an interface representing the variables to delete a activity.
 * It includes the activity id.
 */
export interface DeleteActivityVariables {
  /**
   * `id` is a number representing the id of the activity.
   */
  id: number
}

/**
 * `DeleteActivityMutation` is a class representing a mutation to delete a activity.
 * It includes a method to delete a activity
 */
export class DeleteActivityMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `DeleteActivityMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `deleteActivity` is a method that sends a mutation request to delete a activity.
   *
   * @param variables - An object of type `DeleteActivityVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async deleteActivity (variables: DeleteActivityVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('DeleteActivityMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
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
        DeleteActivity(id: $id) {
          deleted
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
