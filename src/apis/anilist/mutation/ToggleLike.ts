import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type LikeableType, LikeableTypeMappings } from '../types/Type'
import { BasicUserSchema } from '../interfaces/BasicUser'

/**
 * `ToggleLikeMutation` is an interface representing the variables to toggle a like.
 * It includes the id of the likeable object and the type of the likeable object.
 */
export interface ToggleLikeVariables {
  /**
   * `id` is a number representing the id of the likeable object.
   */
  id: number

  /**
   * `type` is a string representing the type of the likeable object.
   */
  type: LikeableType
}

/**
 * `ToggleLikeMutation` is a class representing a mutation to toggle a like.
 * It includes a method to delete an activity
 */
export class ToggleLikeMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleLikeMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `ToggleLike` is a method that sends a mutation request to toggle a like.
   *
   * @param variables - An object of type `ToggleLikeVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleLike (variables: ToggleLikeVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('ToggleLikeMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id || !variables.type) {
      throw new Error('id and type variables are required.')
    }
    const variableTypeMappings = {
      id: 'number',
      type: LikeableTypeMappings
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $type: LikeableType) {
        ToggleLike (id: $id, type: $type) {
          ${BasicUserSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
