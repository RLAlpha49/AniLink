import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { UserResponse, UserSchema } from '../interfaces/responses/query/User'

interface FollowingVariables {
  userId?: number
  sort?: string
  animeStatLimit?: number
  mangaStatLimit?: number
  animeStatSort?: string[]
  mangaStatSort?: string[]
}

export class FollowingQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async following (variables?: FollowingVariables): Promise<UserResponse> {
    const query = `
      query ($userId: Int!, $sort: [UserSort], $asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Following (userId: $userId, sort: $sort) {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
