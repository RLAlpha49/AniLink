import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { type NotificationResponse, NotificationSchema } from '../../interfaces/responses/query/Notification'
import { NotificationTypeMappings } from '../../types/Type'
import { validateVariables } from '../../../../base/ValidateVariables'

/**
 * `NotificationsVariables` is an interface representing the variables for the `NotificationsQuery`.
 * It includes optional page, per page, type, reset notification count, type in, and as html.
 */
export interface NotificationsVariables {
  /**
   * `page` is a number representing the page number.
   */
  page?: number

  /**
   * `perPage` is a number representing the number of items per page.
   */
  perPage?: number

  /**
   * `type` is a string representing the type of the notification.
   */
  type?: string

  /**
   * `resetNotificationCount` is a boolean representing whether to reset the notification count.
   */
  resetNotificationCount?: boolean

  /**
   * `type_in` is an array of strings representing the types of notifications that should be included.
   */
  type_in?: string[]

  /**
   * `asHtml` is a boolean representing whether to return the result as HTML.
   */
  asHtml?: boolean
}

/**
 * `NotificationsQuery` is a class representing a query for notifications.
 * It includes a method to get notifications.
 */
export class NotificationsQuery extends APIWrapper {
  /**
   * `authToken` is a string representing the authentication token.
   */
  private readonly authToken: string

  /**
   * Constructs a new `NotificationsQuery` instance.
   *
   * @param authToken - The authentication token.
   */
  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  /**
   * `notifications` is a method that sends a query request to get notifications.
   *
   * @param variables - The variables for the query.
   * @returns The response from the query request.
   */
  async notifications (variables: NotificationsVariables): Promise<NotificationResponse> {
    if (!variables) {
      throw new Error('At least one variable must be set')
    }
    const variableTypeMappings = {
      page: 'number',
      perPage: 'number',
      type: NotificationTypeMappings,
      resetNotificationCount: 'boolean',
      type_in: NotificationTypeMappings,
      asHtml: 'boolean'
    }

    validateVariables(variables, variableTypeMappings)

    const query = `
      query ($page: Int, $perPage: Int, $type: NotificationType, $resetNotificationCount: Boolean, $type_in: [NotificationType], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          notifications (type: $type, resetNotificationCount: $resetNotificationCount, type_in: $type_in) {
            ${NotificationSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
