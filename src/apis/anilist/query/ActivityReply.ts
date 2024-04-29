import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ActivityReply, ActivityReplySchema } from '../interfaces/ActivityReply'

export interface ActivityReplyVariables {
  id?: number
  activityId?: number
  asHtml?: boolean
}

export class ActivityReplyQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async activityReply (variables?: ActivityReplyVariables): Promise<ActivityReply> {
    const query = `
      query ($id: Int, $activityId: Int, $asHtml: Boolean) {
        ActivityReply (id: $id, activityId: $activityId) {
          ${ActivityReplySchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
