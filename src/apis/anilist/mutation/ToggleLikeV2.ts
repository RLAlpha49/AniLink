import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type LikeableType, LikeableTypeMappings } from '../types/Type'
import { type Activity, ActivitySchemaV2 } from '../interfaces/Activity'

/**
 * `ToggleLikeV2Mutation` is an interface representing the variables to toggle a like.
 * It includes the id of the likeable object and the type of the likeable object.
 */
export interface ToggleLikeV2Variables {
  /**
   * `id` is a number representing the id of the likeable object.
   */
  id: number

  /**
   * `type` is a string representing the type of the likeable object.
   */
  type: LikeableType

  /**
   * `asHtml` is a boolean representing whether the response should be in HTML format.
   */
  asHtml?: boolean
}

/**
 * `ToggleLikeV2Mutation` is a class representing a mutation to toggle a like.
 * It includes a method to delete an activity
 */
export class ToggleLikeV2Mutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleLikeV2Mutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `ToggleLikeV2` is a method that sends a mutation request to toggle a like.
   *
   * @param variables - An object of type `ToggleLikeV2Variables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleLikeV2 (variables: ToggleLikeV2Variables): Promise<Activity> {
    if (!this.authToken) {
      throw new Error('ToggleLikeV2Mutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
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
      mutation ($id: Int, $type: LikeableType, $asHtml: Boolean) {
        ToggleLikeV2 (id: $id, type: $type) {
          ${ActivitySchemaV2}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
