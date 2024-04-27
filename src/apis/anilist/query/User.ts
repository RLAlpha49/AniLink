import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { UserResponse, UserSchema } from '../interfaces/responses/User'

interface UserVariables {
  id?: number
  name?: string
  isModerator?: boolean
  search?: string
  sort?: string[]
  isHTML?: boolean
  animeStatLimit?: number
  mangaStatLimit?: number
  animeStatSort?: string[]
  mangaStatSort?: string[]
}

export class UserQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async user (variables?: UserVariables): Promise<UserResponse> {
    // If isHTML is not provided in variables, default it to true
    const { isHTML = true, ...rest } = variables != null ? variables : {}

    const query = `
      query ($id: Int, $name: String, $isModerator: Boolean, $search: String, $sort: [UserSort], $isHTML: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        User (id: $id, name: $name, isModerator: $isModerator, search: $search, sort: $sort) {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables: { isHTML, ...rest } }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
