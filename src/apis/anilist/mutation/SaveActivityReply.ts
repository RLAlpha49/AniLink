import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import {Activity} from '../interfaces/Activity'
import {ActivityReply, ActivityReplySchema} from "../interfaces/ActivityReply";

/**
 * `SaveActivityReplyMutation` is an interface representing the variables to save an activity reply.
 * It includes the id of the activity, the activity id, the text of the activity reply, the locked status of the activity reply, and the status of the activity reply.
 */
export interface SaveActivityReplyVariables {
  /**
   * `id` is a number representing the id of the activity.
   */
  id: number

  /**
   * `activityId` is a number representing the id of the activity.
   */
  activityId?: number

  /**
   * `text` is a string representing the text of the activity reply.
   */
  text: string

  /**
   * `asMod` is a boolean representing the locked status of the activity reply.
   */
  asMod?: boolean

  /**
   * `asHtml` is a boolean representing the status of the activity reply.
   */
  asHtml?: boolean
}

/**
 * `SaveActivityReplyMutation` is a class representing a mutation to save an activity reply.
 * It includes a method to save an activity reply
 */
export class SaveActivityReplyMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `SaveActivityReplyMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `SaveActivityReply` is a method that sends a mutation request to save an activity reply.
   *
   * @param variables - An object of type `SaveActivityReplyVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async saveActivityReply (variables: SaveActivityReplyVariables): Promise<ActivityReply> {
    if (!this.authToken) {
      throw new Error('SaveActivityReplyMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.id && !variables.text) {
      throw new Error('id or text variable is required')
    }
    const variableTypeMappings = {
      id: 'number',
      activityId: 'number',
      text: 'string',
      asMod: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($id: Int, $activityId: Int, $text: String, $asMod: Boolean, $asHtml: Boolean) {
        SaveActivityReply (id: $id, activityId: $activityId, text: $text, asMod: $asMod) {
          ${ActivityReplySchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
