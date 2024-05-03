import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { ListActivitySchema } from '../interfaces/Activity'

/**
 * `SaveListActivityMutation` is an interface representing the variables to save a list activity.
 * It includes the `customList` and `type` variables of the list activity to save.
 */
export interface SaveListActivityVariables {
  /**
   * `id` is a number representing the id of the list activity.
   */
  id: number

  /**
   * `locked` is a boolean representing whether the list activity is locked.
   */
  locked?: boolean

  /**
   * `asHtml` is a boolean representing whether the list activity is in HTML format.
   */
  asHtml?: boolean
}

/**
 * `SaveListActivityMutation` is a class representing a mutation to save a list activity.
 * It includes a method to save a list activity
 */
export class SaveListActivityMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveListActivityMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `saveListActivity` is a method that sends a mutation request to save a list activity.
   *
   * @param variables - An object of type `SaveListActivityVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveListActivity (variables: SaveListActivityVariables): Promise<any> {
    if (!this.authToken) {
      throw new Error('SaveListActivityMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id) {
      throw new Error('id variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      locked: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $locked: Boolean, $asHtml: Boolean) {
        SaveListActivity(id: $id, locked:$locked)
          ${ListActivitySchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
