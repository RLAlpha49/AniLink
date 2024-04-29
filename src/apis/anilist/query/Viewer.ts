import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { UserResponse, UserSchema } from '../interfaces/responses/query/User'

interface ViewerVariables {
  asHtml?: boolean
  animeStatLimit?: number
  mangaStatLimit?: number
  animeStatSort?: string[]
  mangaStatSort?: string[]
}

export class ViewerQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async viewer (variables?: ViewerVariables): Promise<UserResponse> {
    const query = `
      query ($asHtml: Boolean, $animeStatLimit: Int, $mangaStatLimit: Int, $animeStatSort: [UserStatisticsSort], $mangaStatSort: [UserStatisticsSort]) {
        Viewer {
          ${UserSchema}
        }
      }
    `

    const data = { query, variables }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
