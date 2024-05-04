import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type Activity, TextActivitySchema } from '../interfaces/Activity'

/**
 * `SaveTextActivityMutation` is an interface representing the variables to save a text activity.
 * It includes the activity id, text, and locked status.
 */
export interface SaveTextActivityVariables {
  /**
   * `id` is a number representing the id of the activity.
   */
  id: number

  /**
   * `text` is a string representing the text of the activity.
   */
  text?: string

  /**
   * `locked` is a boolean representing whether the activity is locked.
   */
  locked?: boolean
}

/**
 * `SaveTextActivityMutation` is a class representing a mutation to save a text activity.
 * It includes a method to save a text activity
 */
export class SaveTextActivityMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveTextActivityMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveTextActivity` is a method that sends a mutation request to save a text activity.
   *
   * @param variables - An object of type `SaveTextActivityVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveTextActivity (variables: SaveTextActivityVariables): Promise<Activity> {
    if (!this.authToken) {
      throw new Error('SaveTextActivityMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.text) {
      throw new Error('id or text variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      text: 'string',
      locked: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $text: String, $locked: Boolean, $asHtml: Boolean) {
        SaveTextActivity(id: $id, text: $text, locked:$locked) {
          ${TextActivitySchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
