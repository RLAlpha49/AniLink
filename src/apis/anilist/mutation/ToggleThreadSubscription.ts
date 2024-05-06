import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type ThreadResponse, ThreadSchema } from '../interfaces/responses/query/Thread'

/**
 * `ToggleThreadSubscriptionVariables` is an interface representing the variables to subscribe to a thread.
 * It includes threadId and subscribe.
 */
export interface ToggleThreadSubscriptionVariables {
  /**
   * `threadId` is a number representing the id of the thread.
   */
  threadId: number

  /**
   * `subscribe` is a boolean representing whether the activity is subscribed.
   */
  subscribe: boolean

  /**
   * `asHtml` is a boolean representing whether the activity descriptions is in HTML format.
   */
  asHtml?: boolean
}

/**
 * `ToggleThreadSubscriptionMutation` is a class representing a mutation to subscribe to a thread.
 * It includes a method to subscribe to a thread
 */
export class ToggleThreadSubscriptionMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleThreadSubscriptionMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `toggleThreadSubscription` is a method that sends a mutation request to subscribe to an activity.
   *
   * @param variables - An object of type `ToggleThreadSubscriptionVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleThreadSubscription (variables: ToggleThreadSubscriptionVariables): Promise<ThreadResponse> {
    if (!this.authToken) {
      throw new Error('ToggleThreadSubscriptionMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.threadId || !variables.subscribe) {
      throw new Error('threadId & subscribe variables are required')
    }
    const variableTypeMappings = {
      threadId: 'number',
      subscribe: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($threadId: Int, $subscribe: Boolean, $asHtml: Boolean) {
        ToggleThreadSubscription (threadId: $threadId, subscribe: $subscribe) {
          ${ThreadSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
