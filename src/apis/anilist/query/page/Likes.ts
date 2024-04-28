import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { BasicUser, BasicUserSchema } from '../../interfaces/BasicUser'

interface LikesVariables {
  likeableId?: number
  type?: string
  page?: number
  perPage?: number
}

export class LikesQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async likes (variables?: LikesVariables): Promise<BasicUser> {
    const query = `
      query ($likeableId: Int, $type: LikeableType, $page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          likes (likeableId: $likeableId, type: $type) {
            ${BasicUserSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
