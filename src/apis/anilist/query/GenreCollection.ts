import { APIWrapper } from '../../../base/APIWrapper'
import { sendRequest } from '../../../base/RequestHandler'

export class GenreCollectionQuery extends APIWrapper {
  private readonly authToken: string

  constructor (authToken: string) {
    super('https://graphql.anilist.co')
    this.authToken = authToken
  }

  async genreCollection (): Promise<string> {
    const query = `
      query {
        GenreCollection
      }
    `

    const data = { query }
    return await sendRequest(this.baseURL, 'POST', data, this.authToken)
  }
}
