import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type UserResponse } from '../interfaces/responses/query/User'
import { BasicUserSchema } from '../interfaces/Basic'

/**
 * `ToggleFollowVariables` is an interface representing the variables to toggle a follow.
 * It includes a number representing the id of the user to follow.
 */
export interface ToggleFollowVariables {
  /**
   * `userId` is a number representing the id of the user to follow.
   */
  userId: number
}

/**
 * `ToggleFollowMutation` is a class representing a mutation to toggle a follow.
 * It includes a method to toggle a follow.
 */
export class ToggleFollowMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleFollowMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `ToggleFollow` is a method that sends a mutation request to toggle a follow.
   *
   * @param variables - An object of type `ToggleFollowVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleFollow (variables: ToggleFollowVariables): Promise<UserResponse> {
    if (!this.authToken) {
      throw new Error('ToggleFollowMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.userId) {
      throw new Error('userId variable is required')
    }
    const variableTypeMappings = {
      userId: 'number'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($userId: Int) {
        ToggleFollow (userId: $userId) {
          ${BasicUserSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
