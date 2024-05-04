import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `DeleteActivityReplyMutation` is an interface representing the variables to delete an activity reply.
 * It includes the activity reply id.
 */
export interface DeleteActivityReplyVariables {
  /**
   * `id` is a number representing the id of the activity reply.
   */
  id: number
}

/**
 * `DeleteActivityReplyMutation` is a class representing a mutation to delete an activity reply.
 * It includes a method to delete an activity
 */
export class DeleteActivityReplyMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `DeleteActivityReplyMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `DeleteActivityReply` is a method that sends a mutation request to delete an activity reply.
   *
   * @param variables - An object of type `DeleteActivityReplyVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async deleteActivityReply (variables: DeleteActivityReplyVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('DeleteActivityReplyMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
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
        DeleteActivityReply (id: $id) {
          deleted
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
