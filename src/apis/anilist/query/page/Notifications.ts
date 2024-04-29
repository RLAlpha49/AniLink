import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { NotificationResponse, NotificationSchema } from '../../interfaces/responses/query/Notification'

interface NotificationsVariables {
  page?: number
  perPage?: number
  type?: string
  resetNotificationCount?: boolean
  type_in?: string[]
  asHtml?: boolean
}

export class NotificationsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async notifications (variables?: NotificationsVariables): Promise<NotificationResponse> {
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
