import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { ThreadResponse, ThreadSchema } from '../../interfaces/responses/query/Thread'

interface ThreadsVariables {
  page?: number
  perPage?: number
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

export class ThreadsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async threads (variables?: ThreadsVariables): Promise<ThreadResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $userId: Int, $replyUserId: Int, $subscribed: Boolean, $categoryId: Int, $mediaCategoryId: Int, $search: String, $id_in: [Int], $sort: [ThreadSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          threads (id: $id, userId: $userId, replyUserId: $replyUserId, subscribed: $subscribed, categoryId: $categoryId, mediaCategoryId: $mediaCategoryId, search: $search, id_in: $id_in, sort: $sort) {
            ${ThreadSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
