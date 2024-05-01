import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { type NotificationResponse, NotificationSchema } from '../interfaces/responses/query/Notification'
import { type NotificationType, NotificationTypeMappings } from '../types/Type'
import { validateVariables } from '../../../base/ValidateVariables'

/**
 * `NotificationVariables` is an interface representing the variables for the `NotificationQuery`.
 * It includes optional parameters for querying notification data.
 */
export interface NotificationVariables {
  /**
   * `type` is a string representing the type of the notification.
   */
  type?: NotificationType

  /**
   * `resetNotificationCount` is a boolean indicating whether to reset the notification count.
   */
  resetNotificationCount?: boolean

  /**
   * `type_in` is an array of strings representing the types of the notifications.
   */
  type_in?: NotificationType[]

  /**
   * `asHtml` is a boolean indicating whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `NotificationQuery` is a class representing a query for notification data.
 * It includes a method to send the notification query and receive the response.
 */
export class NotificationQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `NotificationQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `notification` is a method that sends a query request to get notification data.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async notification (variables: NotificationVariables): Promise<NotificationResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      type: NotificationTypeMappings,
      resetNotificationCount: 'boolean',
      type_in: NotificationTypeMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($type: NotificationType, $resetNotificationCount: Boolean, $type_in: [NotificationType], $asHtml: Boolean) {
        Notification (type: $type, resetNotificationCount: $resetNotificationCount, type_in: $type_in) {
          ${NotificationSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
