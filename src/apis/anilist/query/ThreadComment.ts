import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { ThreadCommentResponse, ThreadCommentSchema } from '../interfaces/responses/query/ThreadComment'

interface ThreadCommentVariables {
  id?: number
  threadId?: number
  userId?: number
  sort?: string[]
  asHtml?: boolean
}

export class ThreadCommentQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async threadComment (variables?: ThreadCommentVariables): Promise<ThreadCommentResponse> {
    const query = `
      query ($id: Int, $threadId: Int, $userId: Int, $sort: [ThreadCommentSort], $asHtml: Boolean) {
        ThreadComment (id: $id, threadId: $threadId, userId: $userId, sort: $sort) {
          ${ThreadCommentSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
