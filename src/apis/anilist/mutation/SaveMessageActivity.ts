import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { MessageActivitySchema } from '../interfaces/Activity'

/**
 * `SaveMessageActivityMutation` is an interface representing the variables to save a message activity.
 * It includes the activity id, message, recipient id, private, locked, and asHtml.
 */
export interface SaveMessageActivityVariables {
  id: number
  message?: string
  recipientId?: number
  private?: boolean
  locked?: boolean
  asHtml?: boolean
}

/**
 * `SaveMessageActivityMutation` is a class representing a mutation to save a message activity.
 * It includes a method to save a message activity
 */
export class SaveMessageActivityMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveMessageActivityMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveMessageActivity` is a method that sends a mutation request to save a message activity.
   *
   * @param variables - An object of type `SaveMessageActivityVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveMessageActivity (variables: SaveMessageActivityVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('SaveMessageActivityMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.message) {
      throw new Error('id or text variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      message: 'string',
      recipientId: 'number',
      private: 'boolean',
      locked: 'boolean',
      asMod: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $message: String, $recipientId: Int, $private: Boolean, $locked: Boolean, $asMod: Boolean, $asHtml: Boolean) {
        SaveMessageActivity(id: $id, message: $message, recipientId: $recipientId, private: $private, locked:$locked, asMod: $asMod) {
          ${MessageActivitySchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
