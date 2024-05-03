import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type Activity, ActivityWithRepliesSchema } from '../interfaces/Activity'

/**
 * `ToggleActivityPinMutation` is an interface representing the variables to pin an activity.
 * It includes id and pinned.
 */
export interface ToggleActivityPinVariables {
  /**
   * `id` is a number representing the id of the activity.
   */
  id: number

  /**
   * `pinned` is a boolean representing whether the activity is pinned.
   */
  pinned?: boolean

  /**
   * `asHtml` is a boolean representing whether the activity descriptions is in HTML format.
   */
  asHtml?: boolean
}

/**
 * `ToggleActivityPinMutation` is a class representing a mutation to pin an activity.
 * It includes a method to pin an activity
 */
export class ToggleActivityPinMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleActivityPinMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `toggleActivityPin` is a method that sends a mutation request to pin an activity.
   *
   * @param variables - An object of type `ToggleActivityPinVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleActivityPin (variables: ToggleActivityPinVariables): Promise<Activity> {
    if (!this.authToken) {
      throw new Error('ToggleActivityPinMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id || !variables.pinned) {
      throw new Error('id & pinned variables are required')
    }
    const variableTypeMappings = {
      id: 'number',
      pinned: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $pinned: Boolean, $asHtml: Boolean) {
        ToggleActivityPin(id: $id, pinned: $pinned) {
          ${ActivityWithRepliesSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
