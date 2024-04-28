import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'
import { AniChartUserResponse } from '../interfaces/responses/AniChartUser'
import { BasicUserSchema } from '../interfaces/BasicUser'

export class AniChartUserQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async aniChartUser (): Promise<AniChartUserResponse> {
    const query = `
      query {
        AniChartUser {
          user {
            ${BasicUserSchema}
          }
          settings
          highlights
        }
      }
    `

    const data = { query }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
