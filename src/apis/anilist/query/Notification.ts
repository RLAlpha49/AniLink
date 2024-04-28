import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { NotificationResponse, NotificationSchema } from '../interfaces/responses/Notification'

interface NotificationVariables {
  type?: string
  resetNotificationCount?: boolean
  type_in?: string[]
  asHtml?: boolean
}

export class NotificationQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async notification (variables?: NotificationVariables): Promise<NotificationResponse> {
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
