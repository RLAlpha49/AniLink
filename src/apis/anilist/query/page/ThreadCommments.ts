import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { ThreadCommentResponse, ThreadCommentSchema } from '../../interfaces/responses/query/ThreadComment'

interface ThreadCommentsVariables {
  page?: number
  perPage?: number
  id?: number
  threadId?: number
  userId?: number
  sort?: string[]
  asHtml?: boolean
}

export class ThreadCommentsQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async threadComments (variables?: ThreadCommentsVariables): Promise<ThreadCommentResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          threadComments (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
            ${ThreadCommentSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
