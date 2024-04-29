import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { ActivityReply, ActivityReplySchema } from '../../interfaces/ActivityReply'

interface ActivityRepliesVariables {
  page?: number
  perPage?: number
  id?: number
  activityId?: number
  asHtml?: boolean
}

export class ActivityRepliesQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async activityReplies (variables?: ActivityRepliesVariables): Promise<ActivityReply> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $activityId: Int, $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          activityReplies (id: $id, activityId: $activityId) {
            ${ActivityReplySchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
