import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { validateVariables } from '../../../base/ValidateVariables'
import { type Activity, ActivityWithRepliesSchema } from '../interfaces/Activity'

/**
 * `ToggleActivitySubscriptionMutation` is an interface representing the variables to pin an activity.
 * It includes activityId and subscribe.
 */
export interface ToggleActivitySubscriptionVariables {
  /**
   * `activityId` is a number representing the id of the activity.
   */
  activityId: number

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
 * `ToggleActivitySubscriptionMutation` is a class representing a mutation to subscribe to an activity.
 * It includes a method to subscribe to an activity
 */
export class ToggleActivitySubscriptionMutation extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `ToggleActivitySubscriptionMutation` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `toggleActivitySubscription` is a method that sends a mutation request to subscribe to an activity.
   *
   * @param variables - An object of type `ToggleActivitySubscriptionVariables` representing the variables for the mutation.
   * @returns A Promise that resolves to the response from the mutation request.
   * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
   *  */
  async toggleActivitySubscription (variables: ToggleActivitySubscriptionVariables): Promise<Activity> {
    if (!this.authToken) {
      throw new Error('ToggleActivitySubscriptionMutation requires an authentication token. Create a new instance of AniLink and pass the token as an argument.')
    }
    if (!variables.activityId || !variables.subscribe) {
      throw new Error('activityId & subscribe variables are required')
    }
    const variableTypeMappings = {
      activityId: 'number',
      subscribe: 'boolean',
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const mutation = `
      mutation ($activityId: Int, $subscribe: Boolean, $asHtml: Boolean) {
        ToggleActivitySubscription(activityId: $activityId, subscribe: $subscribe) {
          ${ActivityWithRepliesSchema}
        }
      }
    `

    const data = { query: mutation, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
