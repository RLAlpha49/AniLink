import { APIWrapper } from '../../../../base/APIWrapper'
import { sendRequest } from '../../../../base/RequestHandler'
import { UserResponse, UserSchema } from '../../interfaces/responses/query/User'

interface FollowersVariables {
  page?: number
  perPage?: number
  userId?: number
  sort?: string
  animeStatLimit?: number
  mangaStatLimit?: number
  animeStatSort?: string[]
  mangaStatSort?: string[]
}

export class FollowersQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async followers (variables?: FollowersVariables): Promise<UserResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          followers (userId: $userId, sort: $sort) {
            ${UserSchema}
          }
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
