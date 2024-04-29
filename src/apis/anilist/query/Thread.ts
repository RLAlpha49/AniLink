import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ThreadResponse, ThreadSchema } from '../interfaces/responses/query/Thread'

interface ThreadVariables {
  id?: number
  userId?: number
  replyUserId?: number
  subscribed?: boolean
  categoryId?: number
  mediaCategoryId?: number
  search?: string
  id_in?: number[]
  sort?: string[]
  asHtml?: boolean
}

export class ThreadQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async thread (variables?: ThreadVariables): Promise<ThreadResponse> {
    const query = `
      query ($id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Thread (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
          ${ThreadSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
